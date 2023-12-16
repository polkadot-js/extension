// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { EarningRewardItem, HandleYieldStepData, OptimalYieldPath, OptimalYieldPathParams, RequestBondingSubmit, SubmitJoinNativeStaking, SubmitYieldJoinData, TransactionData, ValidatorInfo, YieldPoolGroup, YieldPoolType, YieldPositionInfo, YieldStepBaseInfo, YieldStepType, YieldTokenBaseInfo } from '@subwallet/extension-base/types';

import { noop } from '@polkadot/util';

import BasePoolHandler from '../base';

export default abstract class BaseNativeStakingPoolHandler extends BasePoolHandler {
  public readonly type = YieldPoolType.NATIVE_STAKING;
  protected readonly description: string;
  protected readonly group: YieldPoolGroup;
  protected readonly name: string;
  public slug: string;

  constructor (state: KoniState, chain: string) {
    super(state, chain);

    const _chainAsset = this.nativeToken;
    const _chainInfo = this.chainInfo;

    const symbol = _chainAsset.symbol;

    const poolGroup = (): YieldPoolGroup => {
      if (symbol.includes('DOT')) {
        return YieldPoolGroup.DOT;
      } else if (symbol.includes('KSM')) {
        return YieldPoolGroup.KSM;
      } else {
        return YieldPoolGroup.OTHER;
      }
    };

    this.slug = `${symbol}___native_staking___${_chainInfo.slug}`;
    this.name = `${_chainInfo.name} Native Staking`;
    this.description = `Start staking with just {{amount}} ${symbol}`;
    this.group = poolGroup();
  }

  /* Get pool reward */

  async getPoolReward (useAddresses: string[], callBack: (rs: EarningRewardItem) => void): Promise<VoidFunction> {
    return new Promise((resolve) => resolve(noop));
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
      transferNativeAmount: amount
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
