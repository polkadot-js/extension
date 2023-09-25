// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakingType } from '@subwallet/extension-base/background/KoniTypes';

export interface TransactionFormBaseProps {
  from: string,
  chain: string
  asset: string
}

export interface TransferParams extends TransactionFormBaseProps {
  to: string;
  destChain: string;
  value: string;
  defaultSlug: string;
}

export interface SendNftParams extends TransactionFormBaseProps {
  to: string;
  collectionId: string;
  itemId: string;
}

export interface StakeParams extends TransactionFormBaseProps {
  value: string;
  nominate: string;
  pool: string;
  type: StakingType;
  defaultChain: string;
  defaultType: StakingType | 'all'
}

export interface UnStakeParams extends TransactionFormBaseProps {
  value: string;
  validator: string;
  type: StakingType;
}

export interface CancelUnStakeParams extends TransactionFormBaseProps {
  unstake: string;
  type: StakingType;
}

export interface WithdrawParams extends TransactionFormBaseProps {
  type: StakingType;
}

export interface ClaimRewardParams extends TransactionFormBaseProps {
  type: StakingType;
  bondReward: boolean;
}

export interface YieldParams extends TransactionFormBaseProps, Record<`amount-${number}`, string> {
  method: string;
  nominate: string;
  pool: string;
}
