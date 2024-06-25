// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType, ChainType, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { EarningRewardHistoryItem, EarningRewardItem, HandleYieldStepData, OptimalYieldPath, OptimalYieldPathParams, RequestBondingSubmit, SubmitJoinNativeStaking, SubmitYieldJoinData, TransactionData, ValidatorInfo, YieldPoolMethodInfo, YieldPoolType, YieldPositionInfo, YieldStepBaseInfo, YieldStepType, YieldTokenBaseInfo } from '@subwallet/extension-base/types';

import { noop } from '@polkadot/util';

import BasePoolHandler from '../base';

export default abstract class BaseNativeStakingPoolHandler extends BasePoolHandler {
  public readonly type = YieldPoolType.NATIVE_STAKING;
  protected readonly name: string;
  protected readonly shortName: string;
  public slug: string;
  protected readonly availableMethod: YieldPoolMethodInfo = {
    join: true,
    defaultUnstake: true,
    fastUnstake: false,
    cancelUnstake: true,
    withdraw: true,
    claimReward: false
  };

  constructor (state: KoniState, chain: string) {
    super(state, chain);

    const _chainAsset = this.nativeToken;
    const _chainInfo = this.chainInfo;

    const symbol = _chainAsset.symbol;

    this.slug = `${symbol}___native_staking___${_chainInfo.slug}`;
    this.name = `${_chainInfo.name} Native Staking`;
    this.shortName = _chainInfo.name.replaceAll(' Relay Chain', '');
  }

  protected getDescription (amount = '0'): string {
    const _chainAsset = this.nativeToken;
    const symbol = _chainAsset.symbol;

    return `Start staking with just {{amount}} ${symbol}`.replace('{{amount}}', amount);
  }

  /* Get pool reward */

  async getPoolReward (useAddresses: string[], callBack: (rs: EarningRewardItem) => void): Promise<VoidFunction> {
    return new Promise((resolve) => resolve(noop));
  }

  async getPoolRewardHistory (useAddresses: string[], callBack: (rs: EarningRewardHistoryItem) => void): Promise<VoidFunction> {
    let cancel = false;
    const haveSubscanService = this.state.subscanService.checkSupportedSubscanChain(this.chain);

    if (haveSubscanService) {
      for (const address of useAddresses) {
        if (cancel) {
          break;
        }

        try {
          const rs = await this.state.subscanService.getRewardHistoryList(this.chain, address);
          const items = rs?.list;

          if (items) {
            for (const item of items) {
              const now = new Date();
              const isMillisecond = now.getTime().toString().length === item.block_timestamp.toString().length;
              const timeStamp = isMillisecond ? item.block_timestamp : item.block_timestamp * 1000;

              const data: EarningRewardHistoryItem = {
                slug: this.slug,
                type: this.type,
                chain: this.chain,
                address: address,
                group: this.group,
                blockTimestamp: timeStamp,
                amount: item.amount,
                eventIndex: item.event_index
              };

              callBack(data);
            }
          }
        } catch (e) {
          console.error(e);
        }
      }
    }

    return () => {
      cancel = false;
    };
  }

  /* Get pool reward */

  /* Join pool action */

  get defaultSubmitStep (): YieldStepBaseInfo {
    return [
      {
        name: 'Nominate validators',
        type: YieldStepType.NOMINATE
      },
      {
        slug: this.nativeToken.slug,
        amount: '0'
      }
    ];
  }

  abstract createJoinExtrinsic (data: SubmitJoinNativeStaking, positionInfo?: YieldPositionInfo, bondDest?: string): Promise<[TransactionData, YieldTokenBaseInfo]>

  protected async getSubmitStep (params: OptimalYieldPathParams): Promise<YieldStepBaseInfo> {
    const { address, amount, slug, targets } = params;
    const selectedValidators = !targets ? [] : targets as ValidatorInfo[];
    const data: SubmitJoinNativeStaking = {
      amount,
      address,
      slug,
      selectedValidators
    };
    const positionInfo = await this.getPoolPosition(address);
    const [, fee] = await this.createJoinExtrinsic(data, positionInfo);

    return [
      this.defaultSubmitStep[0],
      fee
    ];
  }

  async handleYieldJoin (_data: SubmitYieldJoinData, path: OptimalYieldPath, currentStep: number): Promise<HandleYieldStepData> {
    const data = _data as SubmitJoinNativeStaking;
    const { address, amount, selectedValidators } = data;
    const positionInfo = await this.getPoolPosition(address);
    const [extrinsic] = await this.createJoinExtrinsic(data, positionInfo);

    const bondingData: RequestBondingSubmit = {
      poolPosition: positionInfo,
      slug: this.slug,
      amount,
      address,
      selectedValidators
    };

    return {
      txChain: this.chain,
      extrinsicType: ExtrinsicType.STAKING_BOND,
      extrinsic,
      txData: bondingData,
      transferNativeAmount: amount,
      chainType: ChainType.SUBSTRATE
    };
  }

  /* Join pool action */

  /* Leave pool action */

  async handleYieldRedeem (amount: string, address: string, selectedTarget?: string): Promise<[ExtrinsicType, TransactionData]> {
    return Promise.reject(new TransactionError(BasicTxErrorType.UNSUPPORTED));
  }

  /* Leave pool action */

  /* Other action */

  async handleYieldClaimReward (address: string, bondReward?: boolean): Promise<TransactionData> {
    return Promise.reject(new TransactionError(BasicTxErrorType.UNSUPPORTED));
  }

  /* Other actions */
}
