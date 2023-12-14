// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType, ExtrinsicType, NominationInfo, StakeCancelWithdrawalParams, UnstakingInfo } from '@subwallet/extension-base/background/KoniTypes';
import { getEarningStatusByNominations } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { _STAKING_ERA_LENGTH_MAP } from '@subwallet/extension-base/services/chain-service/constants';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenSlug } from '@subwallet/extension-base/services/chain-service/utils';
import { EarningStatus, NormalYieldPoolInfo, PalletDappsStakingAccountLedger, PalletDappsStakingDappInfo, RuntimeDispatchInfo, SubmitJoinNativeStaking, TransactionData, UnstakingStatus, ValidatorInfo, YieldPoolInfo, YieldPositionInfo, YieldTokenBaseInfo } from '@subwallet/extension-base/types';
import { balanceFormatter, formatNumber, isUrl, parseRawNumber, reformatAddress } from '@subwallet/extension-base/utils';
import fetch from 'cross-fetch';

import { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import { UnsubscribePromise } from '@polkadot/api-base/types/base';
import { Codec } from '@polkadot/types/types';
import { BN, BN_ZERO } from '@polkadot/util';
import { isEthereumAddress } from '@polkadot/util-crypto';

import BaseParaNativeStakingPoolHandler from './base-para';

const convertAddress = (address: string) => {
  return isEthereumAddress(address) ? address.toLowerCase() : address;
};

export default class AstarNativeStakingPoolHandler extends BaseParaNativeStakingPoolHandler {
  /* Subscribe pool info */

  async subscribePoolInfo (callback: (data: YieldPoolInfo) => void): Promise<VoidFunction> {
    let cancel = false;
    const chainInfo = this.chainInfo;
    const nativeToken = this.nativeToken;
    const defaultData = this.defaultInfo;

    const aprPromise = new Promise((resolve) => {
      fetch(`https://api.astar.network/api/v1/${this.chain}/dapps-staking/apr`, {
        method: 'GET'
      }).then((resp) => {
        resolve(resp.json());
      }).catch(console.error);
    });

    const timeout = new Promise((resolve) => {
      const id = setTimeout(() => {
        clearTimeout(id);
        resolve(null);
      }, 8000);
    });

    const aprRacePromise = Promise.race([
      timeout,
      aprPromise
    ]); // need race because API often timeout

    /**
     * @todo Discuss more
     * */
    const [aprInfo, substrateApi] = await Promise.all([
      aprRacePromise,
      this.substrateApi.isReady
    ]);

    const unsub = await (substrateApi.api.query.dappsStaking.currentEra((_currentEra: Codec) => {
      if (cancel) {
        unsub();

        return;
      }

      const era = _currentEra.toString();
      const minDelegatorStake = substrateApi.api.consts.dappsStaking.minimumStakingAmount.toString();
      const unstakingDelay = substrateApi.api.consts.dappsStaking.unbondingPeriod.toString();

      const unstakingPeriod = parseInt(unstakingDelay) * _STAKING_ERA_LENGTH_MAP[this.chain];
      const minToHuman = formatNumber(minDelegatorStake, nativeToken.decimals || 0, balanceFormatter);

      const data: NormalYieldPoolInfo = {
        // TODO
        ...defaultData,
        description: this.description.replaceAll('{{amount}}', minToHuman),
        type: this.type,
        metadata: {
          isAvailable: true,
          maxCandidatePerFarmer: 100, // temporary fix for Astar, there's no limit for now
          maxWithdrawalRequestPerFarmer: 1, // by default
          minJoinPool: minDelegatorStake,
          farmerCount: 0, // TODO recheck
          era: parseInt(era),
          assetEarning: [
            {
              slug: _getChainNativeTokenSlug(chainInfo),
              apy: aprInfo !== null ? aprInfo as number : undefined
            }
          ],
          tvl: undefined, // TODO recheck
          totalApy: aprInfo !== null ? aprInfo as number : undefined, // TODO recheck
          unstakingPeriod,
          allowCancelUnstaking: false,
          minWithdrawal: '0'
        }
      };

      callback(data);
    }) as unknown as UnsubscribePromise);

    return () => {
      cancel = true;
      unsub();
    };
  }

  /* Subscribe pool info */

  /* Subscribe pool position */

  async parseNominatorMetadata (chainInfo: _ChainInfo, address: string, substrateApi: _SubstrateApi, ledger: PalletDappsStakingAccountLedger): Promise<Pick<YieldPositionInfo, 'activeStake' | 'balance' | 'isBondedBefore' | 'nominations' | 'status' | 'unstakings'>> {
    const nominationList: NominationInfo[] = [];
    const unstakingList: UnstakingInfo[] = [];

    const allDappsReq = new Promise((resolve) => {
      fetch(`https://api.astar.network/api/v1/${chainInfo.slug}/dapps-staking/dapps`, {
        method: 'GET'
      }).then((resp) => {
        resolve(resp.json());
      }).catch(console.error);
    });

    const [_allDapps, _era, _stakerInfo] = await Promise.all([
      allDappsReq,
      substrateApi.api.query.dappsStaking.currentEra(),
      substrateApi.api.query.dappsStaking.generalStakerInfo.entries(address)
    ]);

    const currentEra = _era.toString();
    const minDelegatorStake = substrateApi.api.consts.dappsStaking.minimumStakingAmount.toString();
    const allDapps = _allDapps as PalletDappsStakingDappInfo[];

    let bnTotalActiveStake = BN_ZERO;

    if (_stakerInfo.length > 0) {
      const dAppInfoMap: Record<string, PalletDappsStakingDappInfo> = {};

      allDapps.forEach((dappInfo) => {
        dAppInfoMap[convertAddress(dappInfo.address)] = dappInfo;
      });

      for (const item of _stakerInfo) {
        const data = item[0].toHuman() as unknown as any[];
        const stakedDapp = data[1] as Record<string, string>;
        const stakeData = item[1].toPrimitive() as Record<string, Record<string, string>[]>;
        const stakeList = stakeData.stakes;

        const _dappAddress = stakedDapp.Evm ? stakedDapp.Evm.toLowerCase() : stakedDapp.Wasm;
        const dappAddress = convertAddress(_dappAddress);
        const currentStake = stakeList.slice(-1)[0].staked.toString() || '0';

        const bnCurrentStake = new BN(currentStake);

        if (bnCurrentStake.gt(BN_ZERO)) {
          const dappEarningStatus = bnCurrentStake.gt(BN_ZERO) && bnCurrentStake.gte(new BN(minDelegatorStake)) ? EarningStatus.EARNING_REWARD : EarningStatus.NOT_EARNING;

          bnTotalActiveStake = bnTotalActiveStake.add(bnCurrentStake);
          const dappInfo = dAppInfoMap[dappAddress];

          nominationList.push({
            status: dappEarningStatus,
            chain: chainInfo.slug,
            validatorAddress: dappAddress,
            activeStake: currentStake,
            validatorMinStake: '0',
            validatorIdentity: dappInfo?.name,
            hasUnstaking: false // cannot get unstaking info by dapp
          });
        }
      }
    }

    const unlockingChunks = ledger.unbondingInfo.unlockingChunks;

    if (unlockingChunks.length > 0) {
      for (const unlockingChunk of unlockingChunks) {
        const isClaimable = unlockingChunk.unlockEra - parseInt(currentEra) < 0;
        const remainingEra = unlockingChunk.unlockEra - parseInt(currentEra);
        const waitingTime = remainingEra * _STAKING_ERA_LENGTH_MAP[chainInfo.slug];

        unstakingList.push({
          chain: chainInfo.slug,
          status: isClaimable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
          claimable: unlockingChunk.amount.toString(),
          waitingTime
        });
      }
    }

    if (nominationList.length === 0 && unstakingList.length === 0) {
      return {
        status: EarningStatus.NOT_STAKING,
        balance: [{
          slug: this.nativeToken.slug,
          activeBalance: '0'
        }],
        isBondedBefore: false,
        activeStake: '0',
        nominations: [],
        unstakings: []
      };
    }

    const stakingStatus = getEarningStatusByNominations(bnTotalActiveStake, nominationList);
    const activeStake = bnTotalActiveStake.toString();

    return {
      status: stakingStatus,
      balance: [{
        slug: this.nativeToken.slug,
        activeBalance: activeStake
      }],
      isBondedBefore: true,
      activeStake: activeStake,
      nominations: nominationList,
      unstakings: unstakingList
    };
  }

  async subscribePoolPosition (useAddresses: string[], resultCallback: (rs: YieldPositionInfo) => void): Promise<VoidFunction> {
    let cancel = false;
    const substrateApi = await this.substrateApi.isReady;
    const nativeToken = this.nativeToken;
    const defaultInfo = this.defaultInfo;
    const chainInfo = this.chainInfo;

    const unsub = await substrateApi.api.query.dappsStaking.ledger.multi(useAddresses, async (ledgers: Codec[]) => {
      if (cancel) {
        unsub();

        return;
      }

      if (ledgers) {
        await Promise.all(ledgers.map(async (_ledger, i) => {
          const owner = reformatAddress(useAddresses[i], 42);

          const ledger = _ledger.toPrimitive() as unknown as PalletDappsStakingAccountLedger;

          if (ledger && ledger.locked > 0) {
            const nominatorMetadata = await this.parseNominatorMetadata(chainInfo, owner, substrateApi, ledger);

            resultCallback({
              ...defaultInfo,
              ...nominatorMetadata,
              address: owner,
              type: this.type
            });
          } else {
            resultCallback({
              ...defaultInfo,
              type: this.type,
              address: owner,
              balance: [
                {
                  slug: nativeToken.slug,
                  activeBalance: '0'
                }
              ],
              status: EarningStatus.NOT_STAKING,
              activeStake: '0',
              nominations: [],
              unstakings: []
            });
          }
        }));
      }
    });

    return () => {
      cancel = true;
      unsub();
    };
  }

  /* Subscribe pool position */

  /* Get pool targets */

  async getPoolTargets (): Promise<ValidatorInfo[]> {
    const chainApi = await this.substrateApi.isReady;
    const rawMaxStakerPerContract = (chainApi.api.consts.dappsStaking.maxNumberOfStakersPerContract).toHuman() as string;

    const allDappsInfo: ValidatorInfo[] = [];
    const maxStakerPerContract = parseRawNumber(rawMaxStakerPerContract);

    const allDappsReq = new Promise((resolve) => {
      fetch(`https://api.astar.network/api/v1/${this.chain}/dapps-staking/dapps`, {
        method: 'GET'
      }).then((resp) => {
        resolve(resp.json());
      }).catch(console.error);
    });

    const [_era, _allDapps] = await Promise.all([
      chainApi.api.query.dappsStaking.currentEra(),
      allDappsReq
    ]);

    const era = parseRawNumber(_era.toHuman() as string);
    const allDapps = _allDapps as Record<string, any>[];

    await Promise.all(allDapps.map(async (dapp) => {
      const dappName = dapp.name as string;
      const dappAddress = dapp.address as string;
      const dappIcon = isUrl(dapp.iconUrl as string) ? dapp.iconUrl as string : undefined;
      const contractParam = isEthereumAddress(dappAddress) ? { Evm: dappAddress } : { Wasm: dappAddress };
      const _contractInfo = await chainApi.api.query.dappsStaking.contractEraStake(contractParam, era);
      const contractInfo = _contractInfo.toPrimitive() as Record<string, any>;
      let totalStake = '0';
      let stakerCount = 0;

      if (contractInfo !== null) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
        totalStake = contractInfo?.total?.toString();
        stakerCount = contractInfo.numberOfStakers as number;
      }

      allDappsInfo.push({
        commission: 0,
        expectedReturn: 0,
        address: convertAddress(dappAddress),
        totalStake: totalStake,
        ownStake: '0',
        otherStake: totalStake.toString(),
        nominatorCount: stakerCount,
        blocked: false,
        isVerified: false,
        minBond: '0',
        icon: dappIcon,
        identity: dappName,
        chain: this.chain,
        isCrowded: stakerCount >= maxStakerPerContract
      });
    }));

    return allDappsInfo;
  }

  /* Get pool targets */

  /* Join pool action */

  async createJoinExtrinsic (data: SubmitJoinNativeStaking, positionInfo?: YieldPositionInfo, bondDest = 'Staked'): Promise<[TransactionData, YieldTokenBaseInfo]> {
    const { address, amount, selectedValidators: targetValidators } = data;
    const chainApi = await this.substrateApi.isReady;
    const binaryAmount = new BN(amount);
    const dappInfo = targetValidators[0];

    const dappParam = isEthereumAddress(dappInfo.address) ? { Evm: dappInfo.address } : { Wasm: dappInfo.address };
    const extrinsic = chainApi.api.tx.dappsStaking.bondAndStake(dappParam, binaryAmount);
    const tokenSlug = this.nativeToken.slug;
    const feeInfo = await extrinsic.paymentInfo(address);
    const fee = feeInfo.toPrimitive() as unknown as RuntimeDispatchInfo;

    return [extrinsic, { slug: tokenSlug, amount: fee.partialFee.toString() }];
  }

  /* Join pool action */

  /* Leave pool action */

  async handleYieldUnstake (amount: string, address: string, selectedTarget?: string): Promise<[ExtrinsicType, TransactionData]> {
    const chainApi = await this.substrateApi.isReady;
    const binaryAmount = new BN(amount);

    if (!selectedTarget) {
      return Promise.reject(new TransactionError(BasicTxErrorType.INVALID_PARAMS));
    }

    const dappParam = isEthereumAddress(selectedTarget) ? { Evm: selectedTarget } : { Wasm: selectedTarget };

    const extrinsic = chainApi.api.tx.dappsStaking.unbondAndUnstake(dappParam, binaryAmount);

    return [ExtrinsicType.STAKING_LEAVE_POOL, extrinsic];
  }

  /* Leave pool action */

  /* Other action */

  async handleYieldCancelUnstake (params: StakeCancelWithdrawalParams): Promise<TransactionData> {
    return Promise.reject(new TransactionError(BasicTxErrorType.UNSUPPORTED));
  }

  async handleYieldWithdraw (address: string, unstakingInfo: UnstakingInfo): Promise<TransactionData> {
    const chainApi = await this.substrateApi.isReady;

    return chainApi.api.tx.dappsStaking.withdrawUnbonded();
  }

  override async handleYieldClaimReward (address: string, bondReward?: boolean) {
    const apiPromise = await this.substrateApi.isReady;

    const [_stakedDapps, _currentEra] = await Promise.all([
      apiPromise.api.query.dappsStaking.generalStakerInfo.entries(address),
      apiPromise.api.query.dappsStaking.currentEra()
    ]);

    const currentEra = parseRawNumber(_currentEra.toHuman() as string);
    const transactions: SubmittableExtrinsic[] = [];

    for (const item of _stakedDapps) {
      const data = item[0].toHuman() as any[];
      const stakedDapp = data[1] as Record<string, string>;
      const stakeData = item[1].toHuman() as Record<string, Record<string, string>[]>;
      const stakes = stakeData.stakes;
      const dappAddress = isEthereumAddress(stakedDapp.Evm) ? stakedDapp.Evm.toLowerCase() : stakedDapp.Evm;

      let numberOfUnclaimedEra = 0;
      const maxTx = 50;

      for (let i = 0; i < stakes.length; i++) {
        const { era, staked } = stakes[i];
        const bnStaked = new BN(staked.replaceAll(',', ''));
        const parsedEra = parseRawNumber(era);

        if (bnStaked.eq(new BN(0))) {
          continue;
        }

        const nextEraData = stakes[i + 1] ?? null;
        const nextEra = nextEraData && parseRawNumber(nextEraData.era);
        const isLastEra = i === stakes.length - 1;
        const eraToClaim = isLastEra ? currentEra - parsedEra : nextEra - parsedEra;

        numberOfUnclaimedEra += eraToClaim;
      }

      const dappParam = isEthereumAddress(dappAddress) ? { Evm: dappAddress } : { Wasm: dappAddress };

      for (let i = 0; i < Math.min(numberOfUnclaimedEra, maxTx); i++) {
        const tx = apiPromise.api.tx.dappsStaking.claimStaker(dappParam);

        transactions.push(tx);
      }
    }

    return apiPromise.api.tx.utility.batch(transactions);
  }

  /* Other actions */
}
