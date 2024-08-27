// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { _getAssetDecimals, _getChainNativeTokenBasicInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { AppBannerData, AppBasicInfoData, AppCommonData, AppConfirmationData, AppPopupData, ConditionBalanceType, ConditionCrowdloanType, ConditionEarningType, ConditionHasMoneyType, ConditionNftType, ConditionType, MktCampaignCondition, MktCampaignConditionTypeValue } from '@subwallet/extension-base/services/mkt-campaign-service/types';
import { fetchStaticData, TARGET_ENV, wait } from '@subwallet/extension-base/utils';
import { keyring } from '@subwallet/ui-keyring';
import BigN from 'bignumber.js';
import { BehaviorSubject } from 'rxjs';

export default class MktCampaignService {
  readonly #state: KoniState;

  private appPopupSubject = new BehaviorSubject<AppPopupData[]>([]);
  private appBannerSubject = new BehaviorSubject<AppBannerData[]>([]);
  private appConfirmationSubject = new BehaviorSubject<AppConfirmationData[]>([]);
  constructor (state: KoniState) {
    this.#state = state;

    this.appPopupSubject.next([]);
    this.appBannerSubject.next([]);
    this.appConfirmationSubject.next([]);

    this.fetchPopupData().catch((e) => {
      console.error('Error on fetch popup', e);
    });

    this.fetchBannerData().catch((e) => {
      console.error('Error on fetch banner', e);
    });

    this.fetchConfirmationData().catch((e) => {
      console.error('Error on fetch confirmation', e);
    });
  }

  fetchMktCampaignData (timeout = 10000) {
    wait(timeout)
      .finally(() => {
        this.fetchPopupData().catch(console.error);
        this.fetchBannerData().catch(console.error);
        this.fetchConfirmationData().catch(console.error);
      });
  }

  public init () {
    this.fetchMktCampaignData();
    console.log('Mkt campaign service ready');
  }

  public async fetchPopupData () {
    const respAppPopupData = await fetchStaticData<AppPopupData[]>('app-popups');
    const result = await this.handleMktCampaignData<AppPopupData>(respAppPopupData);

    this.appPopupSubject.next(result);
  }

  public async fetchBannerData () {
    const respAppBannerData = await fetchStaticData<AppBannerData[]>('app-banners');
    const result = await this.handleMktCampaignData<AppBannerData>(respAppBannerData);

    this.appBannerSubject.next(result);
  }

  public async fetchConfirmationData () {
    const respAppConfirmationData = await fetchStaticData<AppConfirmationData[]>('app-confirmations');

    const result = await this.handleMktCampaignData<AppConfirmationData>(respAppConfirmationData);

    this.appConfirmationSubject.next(result);
  }

  public subscribePopupsData (callback: (data: AppPopupData[]) => void) {
    return this.appPopupSubject.subscribe({
      next: callback
    });
  }

  public subscribeBannersData (callback: (data: AppBannerData[]) => void) {
    return this.appBannerSubject.subscribe({
      next: callback
    });
  }

  public subscribeConfirmationsData (callback: (data: AppConfirmationData[]) => void) {
    return this.appConfirmationSubject.subscribe({
      next: callback
    });
  }

  public getAppPopupsData () {
    return this.appPopupSubject.getValue();
  }

  public getAppBannersData () {
    return this.appBannerSubject.getValue();
  }

  public getAppConfirmationsData () {
    return this.appConfirmationSubject.getValue();
  }

  public async handleMktCampaignData<T extends AppCommonData> (data: T[]): Promise<T[]> {
    const addresses = keyring.getPairs().map((pair) => pair.address);
    const allConditions: Record<string, string[]> = this.getAllConditions(data);
    const conditionBalanceMap = await this.checkBalanceCondition(allConditions, addresses);
    const conditionEarningMap = await this.checkEarningCondition(allConditions, addresses);
    const conditionNftMap = await this.checkNftCondition(allConditions, addresses);
    const conditionCrowdloanMap = await this.checkCrowdloanCondition(allConditions, addresses);
    const conditionHasMoneyMap = await this.checkHasMoneyCondition(allConditions, addresses);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const conditionMap: Record<string, boolean> = Object.assign({}, conditionBalanceMap, conditionEarningMap, conditionNftMap, conditionCrowdloanMap, conditionHasMoneyMap);
    const filteredData = this.checkActiveAndPlatformCondition(data);

    return filteredData.filter((item) => this.filterCampaignFunc(item, conditionMap));
  }

  private checkActiveAndPlatformCondition<T extends AppCommonData> (data: T[]) {
    return data.filter((item) => {
      if (item.info) {
        return this.checkCampaignExistTime(item.info) && item.info.platforms.includes(TARGET_ENV);
      } else {
        return true;
      }
    });
  }

  private checkCampaignExistTime (info: AppBasicInfoData) {
    if (info.start_time && info.stop_time) {
      const now = new Date();
      const startTime = new Date(info.start_time);
      const endTime = new Date(info.stop_time);

      return now >= startTime && now <= endTime;
    } else {
      return false;
    }
  }

  private async checkBalanceCondition (allConditions: Record<string, string[]>, addresses: string[]): Promise<Record<string, boolean>> {
    const allBalanceConditions = allConditions[MktCampaignConditionTypeValue.BALANCE]?.map((condition) => {
      return JSON.parse(condition) as ConditionBalanceType;
    });

    const allBalanceConditionPromises: Promise<number>[] = [];

    allBalanceConditions.forEach((balanceCondition) => {
      const decimals = _getAssetDecimals(this.#state.getAssetBySlug(balanceCondition.chain_asset));
      const convertedValue = new BigN(balanceCondition.value).shiftedBy(decimals);

      allBalanceConditionPromises.push(
        this.#state.dbService.checkBalanceByTokens([balanceCondition.chain_asset], balanceCondition.comparison, addresses, convertedValue.toString())
      );
    });

    const promiseBalanceResult = await Promise.all(allBalanceConditionPromises);
    const conditionBalanceMap: Record<string, boolean> = {};

    promiseBalanceResult.forEach((rs, i) => {
      conditionBalanceMap[allConditions[MktCampaignConditionTypeValue.BALANCE][i]] = rs > 0;
    });

    return conditionBalanceMap;
  }

  private async checkEarningCondition (allConditions: Record<string, string[]>, addresses: string[]): Promise<Record<string, boolean>> {
    const allEarningConditions = allConditions[MktCampaignConditionTypeValue.EARNING]?.map((condition) => {
      return JSON.parse(condition) as ConditionEarningType;
    });

    const allEarningConditionPromises: Promise<number>[] = [];

    allEarningConditions.forEach((earningCondition) => {
      const poolSlugSplittedArr = earningCondition.pool_slug.split('___');

      if (poolSlugSplittedArr[1] === 'liquid_staking') {
        allEarningConditionPromises.push(new Promise(() => false));
      }

      const chain = earningCondition.pool_slug.split('___')[2];
      const chainInfo = this.#state.getChainInfo(chain);
      const { decimals } = _getChainNativeTokenBasicInfo(chainInfo);
      const convertedValue = new BigN(earningCondition.value).shiftedBy(decimals);

      allEarningConditionPromises.push(
        this.#state.dbService.checkEarningByTokens(earningCondition.pool_slug, earningCondition.comparison, addresses, convertedValue.toString())
      );
    });

    const promiseEarningResult = await Promise.all(allEarningConditionPromises);
    const conditionEarningMap: Record<string, boolean> = {};

    promiseEarningResult.forEach((rs, i) => {
      conditionEarningMap[allConditions[MktCampaignConditionTypeValue.EARNING][i]] = rs > 0;
    });

    return conditionEarningMap;
  }

  private async checkNftCondition (allConditions: Record<string, string[]>, addresses: string[]): Promise<Record<string, boolean>> {
    const allNftConditions = allConditions[MktCampaignConditionTypeValue.NFT]?.map((condition) => {
      return JSON.parse(condition) as ConditionNftType;
    });

    const allNftConditionPromises: Promise<number>[] = [];

    allNftConditions.forEach((nftCondition) => {
      allNftConditionPromises.push(
        this.#state.dbService.checkNftByTokens(nftCondition.chain, addresses, nftCondition.collection_id)
      );
    });

    const promiseNftResult = await Promise.all(allNftConditionPromises);
    const conditionNftMap: Record<string, boolean> = {};

    promiseNftResult.forEach((rs, i) => {
      conditionNftMap[allConditions[MktCampaignConditionTypeValue.NFT][i]] = rs > 0;
    });

    return conditionNftMap;
  }

  private async checkCrowdloanCondition (allConditions: Record<string, string[]>, addresses: string[]): Promise<Record<string, boolean>> {
    const allCrowdloanConditions = allConditions[MktCampaignConditionTypeValue.CROWDLOAN]?.map((condition) => {
      return JSON.parse(condition) as ConditionCrowdloanType;
    });

    const allCrowdloanConditionPromises: Promise<number>[] = [];

    allCrowdloanConditions.forEach((crowdloanCondition) => {
      allCrowdloanConditionPromises.push(
        this.#state.dbService.checkCrowdloanByChain(crowdloanCondition.chain, addresses)
      );
    });

    const promiseCrowdloanResult = await Promise.all(allCrowdloanConditionPromises);
    const conditionCrowdloanMap: Record<string, boolean> = {};

    promiseCrowdloanResult.forEach((rs, i) => {
      conditionCrowdloanMap[allConditions[MktCampaignConditionTypeValue.CROWDLOAN][i]] = rs > 0;
    });

    return conditionCrowdloanMap;
  }

  private async checkHasMoneyCondition (allConditions: Record<string, string[]>, addresses: string[]): Promise<Record<string, boolean>> {
    const hasMoneyCondition = allConditions[MktCampaignConditionTypeValue.HAS_MONEY];
    const allHasMoneyConditions = hasMoneyCondition?.map((condition) => {
      return JSON.parse(condition) as ConditionHasMoneyType;
    });

    const allHasMoneyConditionPromises: Promise<number>[] = [];

    allHasMoneyConditions.forEach((hasMoneyCondition) => {
      allHasMoneyConditionPromises.push(
        this.#state.dbService.checkHasMoneyByTokens(hasMoneyCondition.has_money, addresses)
      );
    });

    const promiseHasMoneyResult = await Promise.all(allHasMoneyConditionPromises);
    const conditionHasMoneyMap: Record<string, boolean> = {};

    promiseHasMoneyResult.forEach((rs, i) => {
      conditionHasMoneyMap[hasMoneyCondition[i]] = rs > 0;
    });

    return conditionHasMoneyMap;
  }

  private getAllConditions (respAppPopupData: AppCommonData[]) {
    const result: Record<ConditionType, string[]> = {
      [MktCampaignConditionTypeValue.BALANCE]: [],
      [MktCampaignConditionTypeValue.EARNING]: [],
      [MktCampaignConditionTypeValue.CROWDLOAN]: [],
      [MktCampaignConditionTypeValue.NFT]: [],
      [MktCampaignConditionTypeValue.HAS_MONEY]: []
    };

    const getConditionByType = (campaignCondition: MktCampaignCondition, type: ConditionType) => {
      const campaignConditionByType = campaignCondition[type];

      campaignConditionByType?.forEach((condition) => {
        const conditionStringify = JSON.stringify(condition);

        if (!result[type].includes(conditionStringify)) {
          result[type].push(conditionStringify);
        }
      });
    };

    respAppPopupData.forEach((popup) => {
      const conditionKeys = Object.keys(popup.conditions);

      if (conditionKeys && conditionKeys.length) {
        conditionKeys.forEach((con) => getConditionByType(popup.conditions, con as MktCampaignConditionTypeValue));
      }
    });

    return result;
  }

  private filterCampaignFunc<T extends AppCommonData> (item: T, conditionMap: Record<string, boolean>) {
    const isPassValidation: boolean[] = [];

    if (Object.values(item.conditions) && Object.values(item.conditions).length) {
      const conditionBalance = Object.values(item.conditions[MktCampaignConditionTypeValue.BALANCE] || {});
      const conditionEarning = Object.values(item.conditions[MktCampaignConditionTypeValue.EARNING] || {});
      const conditionNft = Object.values(item.conditions[MktCampaignConditionTypeValue.NFT] || {});
      const conditionCrowdloan = Object.values(item.conditions[MktCampaignConditionTypeValue.CROWDLOAN] || {});
      const conditionHasMoney = Object.values(item.conditions[MktCampaignConditionTypeValue.HAS_MONEY] || {});

      if (conditionBalance && conditionBalance.length) {
        const isValidArr = conditionBalance.map((condition) => {
          return conditionMap[JSON.stringify(condition)];
        });

        if (item.comparison_operator === 'AND') {
          isPassValidation.push(isValidArr.every((i) => i));
        } else {
          isPassValidation.push(isValidArr.some((i) => i));
        }
      }

      if (conditionEarning && conditionEarning.length) {
        const isValidArr = conditionEarning.map((condition) => {
          return conditionMap[JSON.stringify(condition)];
        });

        if (item.comparison_operator === 'AND') {
          isPassValidation.push(isValidArr.every((i) => i));
        } else {
          isPassValidation.push(isValidArr.some((i) => i));
        }
      }

      if (conditionNft && conditionNft.length) {
        const isValidArr = conditionNft.map((condition) => {
          return conditionMap[JSON.stringify(condition)];
        });

        if (item.comparison_operator === 'AND') {
          isPassValidation.push(isValidArr.every((i) => i));
        } else {
          isPassValidation.push(isValidArr.some((i) => i));
        }
      }

      if (conditionCrowdloan && conditionCrowdloan.length) {
        const isValidArr = conditionCrowdloan.map((condition) => {
          return conditionMap[JSON.stringify(condition)];
        });

        if (item.comparison_operator === 'AND') {
          isPassValidation.push(isValidArr.every((i) => i));
        } else {
          isPassValidation.push(isValidArr.some((i) => i));
        }
      }

      if (conditionHasMoney && conditionHasMoney.length) {
        const isValidArr = conditionHasMoney.map((condition) => {
          return conditionMap[JSON.stringify(condition)];
        });

        if (item.comparison_operator === 'AND') {
          isPassValidation.push(isValidArr.every((i) => i));
        } else {
          isPassValidation.push(isValidArr.some((i) => i));
        }
      }
    }

    if (isPassValidation && isPassValidation.length) {
      if (item.comparison_operator === 'AND') {
        return isPassValidation.every((_i) => _i);
      } else {
        return isPassValidation.some((_i) => _i);
      }
    } else {
      return true;
    }
  }
}
