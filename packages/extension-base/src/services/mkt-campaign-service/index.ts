// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { _getAssetDecimals } from '@subwallet/extension-base/services/chain-service/utils';
import { AppBannerData, AppBasicInfoData, AppCommonData, AppConfirmationData, AppPopupData, ConditionBalanceType, ConditionCrowdloanType, ConditionEarningType, ConditionNftType, ConditionType, MktCampaignConditionTypeValue } from '@subwallet/extension-base/services/mkt-campaign-service/types';
import { fetchStaticData } from '@subwallet/extension-base/utils';
import { keyring } from '@subwallet/ui-keyring';
import BigN from 'bignumber.js';

export default class MktCampaignService {
  readonly #state: KoniState;

  constructor (state: KoniState) {
    this.#state = state;
  }

  public init () {
    console.log('Mkt campaign service ready');
  }

  public async fetchPopupData () {
    const respAppPopupData = await fetchStaticData<AppPopupData[]>('app-popups');

    return await this.fetchMktCampaignData<AppPopupData>(respAppPopupData);
  }

  public async fetchBannerData () {
    const respAppBannerData = await fetchStaticData<AppBannerData[]>('app-banners');

    return await this.fetchMktCampaignData<AppBannerData>(respAppBannerData);
  }

  public async fetchConfirmationData () {
    const respAppConfirmationData = await fetchStaticData<AppConfirmationData[]>('app-banners');

    return await this.fetchMktCampaignData<AppConfirmationData>(respAppConfirmationData);
  }

  public async fetchMktCampaignData<T extends AppCommonData> (data: T[]): Promise<T[]> {
    const addresses = keyring.getPairs().map((pair) => pair.address);
    const allConditions: Record<string, string[]> = this.getAllConditions(data);
    const conditionBalanceMap = await this.checkBalanceCondition(allConditions, addresses);
    const conditionEarningMap = await this.checkEarningCondition(allConditions, addresses);
    const conditionNftMap = await this.checkNftCondition(allConditions, addresses);
    const conditionCrowdloanMap = await this.checkCrowdloanCondition(allConditions, addresses);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const conditionMap: Record<string, boolean> = Object.assign({}, conditionBalanceMap, conditionEarningMap, conditionNftMap, conditionCrowdloanMap);
    const filteredData = this.checkActiveAndPlatformCondition(data);

    console.log('filteredData', filteredData);

    return filteredData.filter((item) => this.filterAppPopupFunc(item, conditionMap));
  }

  private checkActiveAndPlatformCondition<T extends AppCommonData> (data: T[]) {
    return data.filter((item) => {
      if (item.info) {
        return this.checkPopupExistTime(item.info) && item.info.platforms.includes('extension');
      } else {
        return true;
      }
    });
  }

  private checkPopupExistTime (info?: AppBasicInfoData) {
    if (info?.start_time && info?.stop_time) {
      const now = new Date();
      const startTime = new Date(info.start_time);
      const endTime = new Date(info.stop_time);

      if (now >= startTime && now <= endTime) {
        return true;
      } else {
        return false;
      }
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
      const decimals = chainInfo?.substrateInfo?.decimals || chainInfo?.evmInfo?.decimals;
      const convertedValue = new BigN(earningCondition.value).shiftedBy(decimals || 0);

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
        this.#state.dbService.checkNftByTokens(nftCondition.chain, nftCondition.collection_id)
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
        this.#state.dbService.checkCrowdloanByChain(crowdloanCondition.chain)
      );
    });

    const promiseCrowdloanResult = await Promise.all(allCrowdloanConditionPromises);
    const conditionCrowdloanMap: Record<string, boolean> = {};

    promiseCrowdloanResult.forEach((rs, i) => {
      conditionCrowdloanMap[allConditions[MktCampaignConditionTypeValue.CROWDLOAN][i]] = rs > 0;
    });

    return conditionCrowdloanMap;
  }

  private getAllConditions (respAppPopupData: AppCommonData[]) {
    const result: Record<ConditionType, string[]> = {
      [MktCampaignConditionTypeValue.BALANCE]: [],
      [MktCampaignConditionTypeValue.EARNING]: [],
      [MktCampaignConditionTypeValue.CROWDLOAN]: [],
      [MktCampaignConditionTypeValue.NFT]: [],
      [MktCampaignConditionTypeValue.HAS_MONEY]: []
    };

    const getConditionByType = (data: AppCommonData, type: ConditionType) => {
      data.conditions?.[type]?.forEach((condition) => {
        if (!result[type].includes(JSON.stringify(condition))) {
          result[type].push(JSON.stringify(condition));
        }
      });
    };

    respAppPopupData.forEach((popup) => {
      if (Object.keys(popup.conditions) && Object.keys(popup.conditions).length) {
        Object.keys(popup.conditions).forEach((con) => getConditionByType(popup, con as MktCampaignConditionTypeValue));
      }
    });

    return result;
  }

  private filterAppPopupFunc<T extends AppCommonData> (item: T, conditionMap: Record<string, boolean>) {
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

        isPassValidation.push(isValidArr.some((i) => i));
      }

      if (conditionEarning && conditionEarning.length) {
        const isValidArr = conditionEarning.map((condition) => {
          return conditionMap[JSON.stringify(condition)];
        });

        isPassValidation.push(isValidArr.some((i) => i));
      }

      if (conditionNft && conditionNft.length) {
        const isValidArr = conditionNft.map((condition) => {
          return conditionMap[JSON.stringify(condition)];
        });

        isPassValidation.push(isValidArr.some((i) => i));
      }

      if (conditionCrowdloan && conditionCrowdloan.length) {
        const isValidArr = conditionCrowdloan.map((condition) => {
          return conditionMap[JSON.stringify(condition)];
        });

        isPassValidation.push(isValidArr.some((i) => i));
      }

      if (conditionHasMoney && conditionHasMoney.length) {
        const isValidArr = conditionHasMoney.map((condition) => {
          return conditionMap[JSON.stringify(condition)];
        });

        isPassValidation.push(isValidArr.some((i) => i));
      }
    }

    if (isPassValidation && isPassValidation.length) {
      return isPassValidation.some((_i) => _i);
    } else {
      return true;
    }
  }
}
