// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
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

export interface EarnParams extends TransactionFormBaseProps {
  slug: string;
  target: string;
  value: string;
  redirectFromPreview: boolean;
  hasPreSelectTarget: boolean;
}

export interface UnStakeParams extends TransactionFormBaseProps {
  value: string;
  validator: string;
  slug: string;
  fastLeave: boolean;
}

export interface CancelUnStakeParams extends TransactionFormBaseProps {
  unstake: string,
  slug: string;
}

export interface WithdrawParams extends TransactionFormBaseProps {
  slug: string;
}

export interface ClaimRewardParams extends TransactionFormBaseProps {
  slug: string;
  bondReward: boolean;
}

export interface SwapParams extends TransactionFormBaseProps {
  fromAmount: string,
  fromTokenSlug: string;
  toTokenSlug: string;
  recipient?: string;
}
