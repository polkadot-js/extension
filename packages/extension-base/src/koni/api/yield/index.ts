// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { YieldPoolInfo, YieldPoolType, YieldWithdrawalMethod } from '@subwallet/extension-base/background/KoniTypes';
import { _ChainBaseApi } from '@subwallet/extension-base/services/chain-service/types';

// only apply for DOT right now, will need to scale up

export async function getYieldPoolInfo (chain: string, type: YieldPoolType, chainApi: _ChainBaseApi): Promise<YieldPoolInfo> {
  if (type.includes(YieldPoolType.NATIVE_STAKING)) {
    return await getNativeStakingYieldInfo();
  }

  return {
    apy: 0, // in percentage, annually
    tvl: '0', // in tokens
    inputAssets: [],
    rewardAssets: [],
    withdrawalMethods: [],
    description: '',
    name: '',
    type: YieldPoolType.LENDING
  } as YieldPoolInfo;
}

export async function getNativeStakingYieldInfo (): Promise<YieldPoolInfo> {
  return {
    apy: 0, // in percentage, annually
    tvl: '0', // in tokens
    inputAssets: [],
    rewardAssets: [],
    withdrawalMethods: [],
    description: '',
    name: '',
    type: YieldPoolType.LENDING
  } as YieldPoolInfo;
}
