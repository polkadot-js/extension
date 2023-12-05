// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { OptimalYieldPath, OptimalYieldPathParams } from '@subwallet/extension-base/background/KoniTypes';
import { PalletStakingStakingLedger } from '@subwallet/extension-base/koni/api/staking/bonding/relayChain';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { _getTokenOnChainAssetId } from '@subwallet/extension-base/services/chain-service/utils';
import { EarningStatus, LiquidYieldPoolInfo, YieldPoolGroup, YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/types';

import { BN, BN_ZERO } from '@polkadot/util';

import BaseLiquidStakingPoolHandler from './base';

interface BlockHeader {
  number: number
}

export default class ParallelLiquidStakingPoolHandler extends BaseLiquidStakingPoolHandler {
  protected readonly description: string;
  protected readonly group: YieldPoolGroup;
  protected readonly name: string;
  protected readonly altInputAssets: string[] = ['polkadot-NATIVE-DOT'];
  protected readonly derivativeAssets: string[] = ['parallel-LOCAL-sDOT'];
  protected readonly inputAssets: string[] = ['parallel-LOCAL-DOT'];
  protected readonly rewardAssets: string[] = ['parallel-LOCAL-DOT'];
  protected readonly feeAssets: string[] = ['parallel-NATIVE-PARA'];
  public slug: string;

  constructor (state: KoniState, chain: string) {
    super(state, chain);

    const chainInfo = this.chainInfo;

    this.slug = `DOT___liquid_staking___${chain}`;
    this.name = `${chainInfo.name} Liquid Staking`;
    this.description = 'Stake DOT to earn yield on sDOT';
    this.group = YieldPoolGroup.DOT;
  }

  /* Subscribe pool info */

  async getPoolStat (): Promise<LiquidYieldPoolInfo> {
    const substrateApi = await this.substrateApi.isReady;

    const [_exchangeRate, _currentBlockHeader, _currentTimestamp, _stakingLedgers] = await Promise.all([
      substrateApi.api.query.liquidStaking.exchangeRate(),
      substrateApi.api.rpc.chain.getHeader(),
      substrateApi.api.query.timestamp.now(),
      substrateApi.api.query.liquidStaking.stakingLedgers.entries()
    ]);

    let tvl = BN_ZERO;

    for (const _stakingLedger of _stakingLedgers) {
      const _ledger = _stakingLedger[1];
      const ledger = _ledger.toPrimitive() as unknown as PalletStakingStakingLedger;

      tvl = tvl.add(new BN(ledger.total.toString()));
    }

    const exchangeRate = _exchangeRate.toPrimitive() as number;
    const currentBlockHeader = _currentBlockHeader.toPrimitive() as unknown as BlockHeader;
    const currentTimestamp = _currentTimestamp.toPrimitive() as number;

    const beginBlock = currentBlockHeader.number - ((24 * 60 * 60) / 6) * 14;
    const _beginBlockHash = await substrateApi.api.rpc.chain.getBlockHash(beginBlock);
    const beginBlockHash = _beginBlockHash.toString();

    const [_beginTimestamp, _beginExchangeRate] = await Promise.all([
      substrateApi.api.query.timestamp.now.at(beginBlockHash),
      substrateApi.api.query.liquidStaking.exchangeRate.at(beginBlockHash)
    ]);

    const beginTimestamp = _beginTimestamp.toPrimitive() as number;
    const beginExchangeRate = _beginExchangeRate.toPrimitive() as number;
    const decimals = 10 ** 18;

    const apy = (exchangeRate / beginExchangeRate) ** (365 * 24 * 60 * 60000 / (currentTimestamp - beginTimestamp)) - 1;

    return {
      ...this.defaultInfo,

      metadata: {
        isAvailable: true,
        allowCancelUnstaking: false,
        assetEarning: [
          {
            slug: this.rewardAssets[0],
            apy: apy * 100,
            exchangeRate: exchangeRate / decimals
          }
        ],
        maxCandidatePerFarmer: 1,
        maxWithdrawalRequestPerFarmer: 1,
        minJoinPool: '10000000000',
        minWithdrawal: '5000000000',
        totalApy: apy * 100,
        tvl: tvl.toString()
      }
    };
  }

  /* Subscribe pool info */

  /* Subscribe pool position */

  async subscribePoolPosition (useAddresses: string[], resultCallback: (rs: YieldPositionInfo) => void): Promise<VoidFunction> {
    let cancel = false;

    const substrateApi = this.substrateApi;

    await substrateApi.isReady;

    const derivativeTokenSlug = this.derivativeAssets[0];
    const derivativeTokenInfo = this.state.getAssetBySlug(derivativeTokenSlug);

    const unsub = await substrateApi.api.query.assets.account.multi(useAddresses.map((address) => [_getTokenOnChainAssetId(derivativeTokenInfo), address]), (balances) => {
      if (cancel) {
        unsub();

        return;
      }

      for (let i = 0; i < balances.length; i++) {
        const b = balances[i];
        const address = useAddresses[i];
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
        const bdata = b?.toHuman();

        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
        const addressBalance = bdata && bdata.balance ? new BN(String(bdata?.balance).replaceAll(',', '') || '0') : BN_ZERO;

        const result: YieldPositionInfo = {
          ...super.defaultInfo,
          type: YieldPoolType.LIQUID_STAKING,
          address,
          balance: [
            {
              slug: derivativeTokenSlug, // token slug
              activeBalance: addressBalance.toString()
            }
          ],
          status: EarningStatus.EARNING_REWARD,
          activeStake: addressBalance.toString(),
          nominations: [],
          unstakings: []
        };

        resultCallback(result);
      }
    });

    return () => {
      cancel = true;
      unsub();
    };
  }

  /* Subscribe pool position */

  generateOptimalPath (params: OptimalYieldPathParams): Promise<OptimalYieldPath> {
    throw new Error('Need handle');
  }
}
