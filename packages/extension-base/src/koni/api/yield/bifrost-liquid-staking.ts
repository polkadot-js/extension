// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { COMMON_CHAIN_SLUGS } from '@subwallet/chain-list';
import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { ExtrinsicType, NominatorMetadata, OptimalYieldPath, OptimalYieldPathParams, RequestCrossChainTransfer, RequestYieldStepSubmit, StakingStatus, StakingType, SubmitYieldStepData, UnbondingSubmitParams, UnstakingInfo, UnstakingStatus, YieldPoolInfo, YieldPositionInfo, YieldStepType } from '@subwallet/extension-base/background/KoniTypes';
import { createXcmExtrinsic } from '@subwallet/extension-base/koni/api/xcm';
import { convertDerivativeToOriginToken, YIELD_POOL_MIN_AMOUNT_PERCENT, YIELD_POOL_STAT_REFRESH_INTERVAL } from '@subwallet/extension-base/koni/api/yield/helper/utils';
import { HandleYieldStepData } from '@subwallet/extension-base/koni/api/yield/index';
import { BalanceService } from '@subwallet/extension-base/services/balance-service';
import { _STAKING_ERA_LENGTH_MAP } from '@subwallet/extension-base/services/chain-service/constants';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getAssetDecimals, _getChainNativeTokenSlug, _getTokenOnChainInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { TokenBalanceRaw } from '@subwallet/extension-base/types';
import { reformatAddress } from '@subwallet/extension-base/utils';
import fetch from 'cross-fetch';

import { SubmittableExtrinsic } from '@polkadot/api/types';
import { BN, BN_ZERO } from '@polkadot/util';

const STATS_URL = 'https://api.bifrost.app/api/site';
const BIFROST_GRAPHQL_ENDPOINT = 'https://bifrost-subsql.liebi.com/v1/graphql';
const BIFROST_EXCHANGE_RATE_REQUEST = 'query MyQuery{slp_polkadot_ratio(limit:1 where:{key:{_eq:"0"}} order_by:{timestamp:desc_nulls_first}){ratio key timestamp total_issuance token_pool}}';

export interface BifrostLiquidStakingMeta {
  apy: string,
  apyBase: string,
  apyReward: string,
  tvl: number,
  tvm: number,
  holders: number
}

export interface BifrostVtokenExchangeRateResp {
  data: {
    slp_polkadot_ratio: BifrostVtokenExchangeRate[]
  }
}

export interface BifrostVtokenExchangeRate {
  ratio: string,
  key: string,
  timestamp: string,
  total_issuance: number,
  token_pool: number
}

interface BifrostUnlockLedger {
  address: string,
  ledgerId: number
}

interface BifrostUnlockInfo {
  balance: string,
  era: number
}

export function subscribeBifrostLiquidStakingStats (poolInfo: YieldPoolInfo, substrateApi: _SubstrateApi, assetInfoMap: Record<string, _ChainAsset>, callback: (rs: YieldPoolInfo) => void) {
  async function getPoolStat () {
    const stakingMetaPromise = new Promise(function (resolve) {
      fetch(STATS_URL, {
        method: 'GET'
      }).then((res) => {
        resolve(res.json());
      }).catch(console.error);
    });

    const exchangeRatePromise = new Promise(function (resolve) {
      fetch(BIFROST_GRAPHQL_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          query: BIFROST_EXCHANGE_RATE_REQUEST
        })
      }).then((resp) => {
        resolve(resp.json());
      }).catch(console.error);
    });

    const assetInfo = assetInfoMap[poolInfo.inputAssets[0]];

    const [_stakingMeta, _exchangeRate, _minimumMint] = await Promise.all([
      stakingMetaPromise,
      exchangeRatePromise,
      substrateApi.api.query.vtokenMinting.minimumMint(_getTokenOnChainInfo(assetInfo))
    ]);

    const stakingMeta = _stakingMeta as Record<string, BifrostLiquidStakingMeta>;
    const exchangeRate = _exchangeRate as BifrostVtokenExchangeRateResp;
    const minimumMint = _minimumMint.toString();

    const vDOTStats = stakingMeta.vDOT;
    const assetDecimals = 10 ** _getAssetDecimals(assetInfo);

    // eslint-disable-next-line node/no-callback-literal
    callback({
      ...poolInfo,
      stats: {
        assetEarning: [
          {
            slug: poolInfo.rewardAssets[0],
            apy: parseFloat(vDOTStats.apyBase),
            exchangeRate: parseFloat(exchangeRate.data.slp_polkadot_ratio[0].ratio)
          }
        ],
        maxCandidatePerFarmer: 1,
        maxWithdrawalRequestPerFarmer: 1,
        minJoinPool: minimumMint,
        minWithdrawal: '0',
        totalApy: parseFloat(vDOTStats.apyBase),
        tvl: (vDOTStats.tvm * assetDecimals).toString()
      }
    });
  }

  function getStatInterval () {
    getPoolStat().catch(console.error);
  }

  getStatInterval();

  const interval = setInterval(getStatInterval, YIELD_POOL_STAT_REFRESH_INTERVAL);

  return () => {
    clearInterval(interval);
  };
}

export function getBifrostLiquidStakingPosition (substrateApi: _SubstrateApi, useAddresses: string[], chainInfo: _ChainInfo, poolInfo: YieldPoolInfo, assetInfoMap: Record<string, _ChainAsset>, positionCallback: (rs: YieldPositionInfo) => void) {
  // @ts-ignore
  const derivativeTokenSlug = poolInfo.derivativeAssets[0];
  const derivativeTokenInfo = assetInfoMap[derivativeTokenSlug];

  const inputTokenSlug = poolInfo.inputAssets[0];
  const inputTokenInfo = assetInfoMap[inputTokenSlug];

  return substrateApi.api.query.tokens.accounts.multi(useAddresses.map((address) => [address, _getTokenOnChainInfo(derivativeTokenInfo)]), async (_balance) => {
    const balances = _balance as unknown as TokenBalanceRaw[];

    const [_unlockLedgerList, _currentRelayEra] = await Promise.all([
      substrateApi.api.query.vtokenMinting.userUnlockLedger.multi(useAddresses.map((address) => [address, _getTokenOnChainInfo(inputTokenInfo)])),
      substrateApi.api.query.vtokenMinting.ongoingTimeUnit(_getTokenOnChainInfo(inputTokenInfo))
    ]);

    const currentRelayEraObj = _currentRelayEra.toPrimitive() as Record<string, number>;
    const currentRelayEra = currentRelayEraObj.Era;

    const unlockLedgerList: BifrostUnlockLedger[] = [];

    const activeBalanceMap: Record<string, BN> = {};

    for (let i = 0; i < balances.length; i++) {
      const balanceItem = balances[i];
      const address = useAddresses[i];
      const formattedAddress = reformatAddress(address);

      activeBalanceMap[formattedAddress] = balanceItem.free || BN_ZERO;

      const _unlockLedger = _unlockLedgerList[i];
      const unlockLedger = _unlockLedger.toPrimitive();

      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const unstakingLedgerIds = unlockLedger[1] as number[];

      unstakingLedgerIds.forEach((ledgerId) => {
        unlockLedgerList.push({
          address: formattedAddress,
          ledgerId
        });
      });

      // const bnTotalBalance = bnActiveBalance.add(bnUnstakingBalance);
    }

    const unlockingMap: Record<string, BifrostUnlockInfo[]> = {};

    const _unlockInfoList = await substrateApi.api.query.vtokenMinting.tokenUnlockLedger.multi(unlockLedgerList.map(({ ledgerId }) => [_getTokenOnChainInfo(inputTokenInfo), ledgerId]));

    for (let i = 0; i < _unlockInfoList.length; i++) {
      const unlockInfo = _unlockInfoList[i].toPrimitive() as unknown[];

      const owner = reformatAddress(unlockInfo[0] as string);
      const amount = (unlockInfo[1] as number).toString();
      // @ts-ignore
      const withdrawalEra = unlockInfo[2].era as number;

      if (owner in unlockingMap) {
        unlockingMap[owner].push({
          balance: amount,
          era: withdrawalEra
        });
      } else {
        unlockingMap[owner] = [
          {
            balance: amount,
            era: withdrawalEra
          }
        ];
      }
    }

    const unstakingList: UnstakingInfo[] = [];

    useAddresses.forEach((address) => {
      const formattedAddress = reformatAddress(address);

      const bnActiveBalance = activeBalanceMap[formattedAddress];

      const unlockings = unlockingMap[formattedAddress];

      if (unlockings) {
        unlockings.forEach((unlocking) => {
          const isClaimable = unlocking.era - currentRelayEra < 0;
          const remainingEra = unlocking.era - currentRelayEra;
          const waitingTime = remainingEra * _STAKING_ERA_LENGTH_MAP[poolInfo.chain];

          unstakingList.push({
            chain: poolInfo.chain,
            status: isClaimable ? UnstakingStatus.CLAIMABLE : UnstakingStatus.UNLOCKING,
            claimable: unlocking.balance,
            waitingTime: waitingTime
          } as UnstakingInfo);
        });
      }

      positionCallback({
        slug: poolInfo.slug,
        chain: chainInfo.slug,
        address,
        balance: [
          {
            slug: derivativeTokenSlug, // token slug
            activeBalance: bnActiveBalance.toString()
          }
        ],

        metadata: {
          chain: chainInfo.slug,
          type: StakingType.LIQUID_STAKING,

          status: bnActiveBalance.eq(BN_ZERO) ? StakingStatus.NOT_EARNING : StakingStatus.EARNING_REWARD,
          address,
          activeStake: bnActiveBalance.toString(),
          nominations: [],
          // unstakings: unstakingList
          unstakings: [] // TODO: Migrate with new code
        } as NominatorMetadata
      } as YieldPositionInfo);
    });
  });
}

export async function getBifrostLiquidStakingExtrinsic (address: string, params: OptimalYieldPathParams, path: OptimalYieldPath, currentStep: number, requestData: RequestYieldStepSubmit, balanceService: BalanceService): Promise<HandleYieldStepData> {
  const inputData = requestData.data as SubmitYieldStepData;

  if (path.steps[currentStep].type === YieldStepType.XCM) {
    const destinationTokenSlug = params.poolInfo.inputAssets[0];
    const originChainInfo = params.chainInfoMap[COMMON_CHAIN_SLUGS.POLKADOT];
    const originTokenSlug = _getChainNativeTokenSlug(originChainInfo);
    const originTokenInfo = params.assetInfoMap[originTokenSlug];
    const destinationTokenInfo = params.assetInfoMap[destinationTokenSlug];
    const substrateApi = params.substrateApiMap[originChainInfo.slug];

    const inputTokenBalance = await balanceService.getTokenFreeBalance(params.address, destinationTokenInfo.originChain, destinationTokenSlug);
    const bnInputTokenBalance = new BN(inputTokenBalance.value);

    const xcmFee = path.totalFee[currentStep].amount || '0';
    const bnXcmFee = new BN(xcmFee);
    const bnAmount = new BN(inputData.amount);

    const bnTotalAmount = bnAmount.sub(bnInputTokenBalance).add(bnXcmFee);

    const extrinsic = await createXcmExtrinsic({
      chainInfoMap: params.chainInfoMap,
      destinationTokenInfo,
      originTokenInfo,
      recipient: address,
      sendingValue: bnTotalAmount.toString(),
      substrateApi
    });

    const xcmData: RequestCrossChainTransfer = {
      originNetworkKey: originChainInfo.slug,
      destinationNetworkKey: destinationTokenInfo.originChain,
      from: address,
      to: address,
      value: bnTotalAmount.toString(),
      tokenSlug: originTokenSlug,
      showExtraWarning: true
    };

    return {
      txChain: originChainInfo.slug,
      extrinsicType: ExtrinsicType.TRANSFER_XCM,
      extrinsic,
      txData: xcmData,
      transferNativeAmount: bnTotalAmount.toString()
    };
  }

  const substrateApi = await params.substrateApiMap[params.poolInfo.chain].isReady;
  const inputTokenSlug = params.poolInfo.inputAssets[0];
  const inputTokenInfo = params.assetInfoMap[inputTokenSlug];
  const extrinsic = substrateApi.api.tx.vtokenMinting.mint(_getTokenOnChainInfo(inputTokenInfo), inputData.amount, undefined);

  return {
    txChain: params.poolInfo.chain,
    extrinsicType: ExtrinsicType.MINT_VDOT,
    extrinsic,
    txData: requestData,
    transferNativeAmount: '0'
  };
}

export async function getBifrostLiquidStakingRedeem (params: OptimalYieldPathParams, amount: string): Promise<[ExtrinsicType, SubmittableExtrinsic<'promise'>]> {
  const substrateApi = await params.substrateApiMap[params.poolInfo.chain].isReady;
  // @ts-ignore
  // const rewardTokenSlug = params.poolInfo.derivativeAssets[0];
  // const rewardTokenInfo = params.assetInfoMap[rewardTokenSlug];

  // const extrinsic = substrateApi.api.tx.vtokenMinting.redeem(_getTokenOnChainInfo(rewardTokenInfo), amount);

  const derivativeTokenSlug = params.poolInfo.derivativeAssets?.[0] || '';
  const originTokenSlug = params.poolInfo.inputAssets[0] || '';

  const derivativeTokenInfo = params.assetInfoMap[derivativeTokenSlug];
  const originTokenInfo = params.assetInfoMap[originTokenSlug];

  const formattedMinAmount = convertDerivativeToOriginToken(amount, params.poolInfo, derivativeTokenInfo, originTokenInfo);
  const weightedMinAmount = Math.floor(YIELD_POOL_MIN_AMOUNT_PERCENT[params.poolInfo.slug] * formattedMinAmount);

  const extrinsic = substrateApi.api.tx.stablePool.swap(0, 1, 0, amount, weightedMinAmount);

  return [ExtrinsicType.REDEEM_VDOT, extrinsic];
}

export async function getBifrostLiquidStakingDefaultUnstake (params: UnbondingSubmitParams, substrateApi: _SubstrateApi, poolInfo: YieldPoolInfo, assetInfoMap: Record<string, _ChainAsset>): Promise<SubmittableExtrinsic<'promise'>> {
  const chainApi = await substrateApi.isReady;

  const rewardTokenSlug = poolInfo?.derivativeAssets?.[0] || '';
  const rewardTokenInfo = assetInfoMap[rewardTokenSlug];

  return chainApi.api.tx.vtokenMinting.redeem(_getTokenOnChainInfo(rewardTokenInfo), params.amount);
}
