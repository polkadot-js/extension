// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType, StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { detectTranslate } from '@subwallet/extension-base/utils';
import { CancelUnStakeParams, ClaimRewardParams, EarnParams, SendNftParams, StakeParams, SwapParams, TransactionFormBaseProps, TransferParams, UnStakeParams, WithdrawParams } from '@subwallet/extension-koni-ui/types';

import { ALL_KEY } from './common';

export const TRANSACTION_TITLE_MAP: Record<ExtrinsicType, string> = {
  [ExtrinsicType.TRANSFER_BALANCE]: detectTranslate('Transfer'),
  [ExtrinsicType.TRANSFER_XCM]: detectTranslate('Transfer'),
  [ExtrinsicType.TRANSFER_TOKEN]: detectTranslate('Transfer'),
  [ExtrinsicType.SEND_NFT]: detectTranslate('Transfer NFT'),
  [ExtrinsicType.CROWDLOAN]: detectTranslate('Crowdloan'),
  [ExtrinsicType.STAKING_JOIN_POOL]: detectTranslate('Add to stake'),
  [ExtrinsicType.STAKING_BOND]: detectTranslate('Add to stake'),
  [ExtrinsicType.STAKING_LEAVE_POOL]: detectTranslate('Unstake'),
  [ExtrinsicType.STAKING_UNBOND]: detectTranslate('Unstake'),
  [ExtrinsicType.STAKING_WITHDRAW]: detectTranslate('Withdraw'),
  [ExtrinsicType.STAKING_POOL_WITHDRAW]: detectTranslate('Withdraw'),
  [ExtrinsicType.STAKING_CANCEL_UNSTAKE]: detectTranslate('Cancel unstake'),
  [ExtrinsicType.STAKING_CLAIM_REWARD]: detectTranslate('Claim rewards'),
  [ExtrinsicType.STAKING_COMPOUNDING]: detectTranslate('Compound'),
  [ExtrinsicType.STAKING_CANCEL_COMPOUNDING]: detectTranslate('Cancel compound'),
  [ExtrinsicType.JOIN_YIELD_POOL]: detectTranslate('Start earning'), // TODO: Change this
  [ExtrinsicType.EVM_EXECUTE]: detectTranslate('Execute'),
  [ExtrinsicType.UNKNOWN]: detectTranslate('Unknown'),

  [ExtrinsicType.MINT_VDOT]: detectTranslate('Mint vDOT'), // TODO: Change this
  [ExtrinsicType.MINT_VMANTA]: detectTranslate('Mint vMANTA'), // TODO: Change this
  [ExtrinsicType.MINT_LDOT]: detectTranslate('Mint LDOT'), // TODO: Change this
  [ExtrinsicType.MINT_SDOT]: detectTranslate('Mint sDOT'), // TODO: Change this
  [ExtrinsicType.MINT_QDOT]: detectTranslate('Mint qDOT'), // TODO: Change this
  [ExtrinsicType.MINT_STDOT]: detectTranslate('Mint stDOT'), // TODO: Change this
  [ExtrinsicType.MINT_VMANTA]: detectTranslate('Mint vMANTA'), // TODO: Change this

  [ExtrinsicType.REDEEM_VDOT]: detectTranslate('Redeem vDOT'), // TODO: Change this
  [ExtrinsicType.REDEEM_VMANTA]: detectTranslate('Redeem vMANTA'), // TODO: Change this
  [ExtrinsicType.REDEEM_LDOT]: detectTranslate('Redeem lDOT'), // TODO: Change this
  [ExtrinsicType.REDEEM_SDOT]: detectTranslate('Redeem sDOT'), // TODO: Change this
  [ExtrinsicType.REDEEM_QDOT]: detectTranslate('Redeem qDOT'), // TODO: Change this
  [ExtrinsicType.REDEEM_STDOT]: detectTranslate('Redeem stDOT'), // TODO: Change this
  [ExtrinsicType.REDEEM_VMANTA]: detectTranslate('Redeem vMANTA'),

  [ExtrinsicType.UNSTAKE_VDOT]: detectTranslate('Unstake vDOT'),
  [ExtrinsicType.UNSTAKE_VMANTA]: detectTranslate('Unstake vMANTA'),
  [ExtrinsicType.UNSTAKE_LDOT]: detectTranslate('Unstake LDOT'),
  [ExtrinsicType.UNSTAKE_SDOT]: detectTranslate('Unstake sDOT'),
  [ExtrinsicType.UNSTAKE_STDOT]: detectTranslate('Unstake stDOT'),
  [ExtrinsicType.UNSTAKE_QDOT]: detectTranslate('Unstake qDOT'),
  [ExtrinsicType.UNSTAKE_VMANTA]: detectTranslate('Unstake vMANTA'),

  [ExtrinsicType.TOKEN_SPENDING_APPROVAL]: detectTranslate('Token approve'),
  [ExtrinsicType.SWAP]: detectTranslate('Swap')
};

export const ALL_STAKING_ACTIONS: ExtrinsicType[] = [
  ExtrinsicType.STAKING_JOIN_POOL,
  ExtrinsicType.STAKING_BOND,
  ExtrinsicType.STAKING_LEAVE_POOL,
  ExtrinsicType.STAKING_UNBOND,
  ExtrinsicType.STAKING_WITHDRAW,
  ExtrinsicType.STAKING_POOL_WITHDRAW,
  ExtrinsicType.STAKING_LEAVE_POOL,
  ExtrinsicType.STAKING_CANCEL_UNSTAKE,
  ExtrinsicType.STAKING_CLAIM_REWARD,
  ExtrinsicType.STAKING_COMPOUNDING,
  ExtrinsicType.STAKING_CANCEL_COMPOUNDING
];

export const DEFAULT_TRANSACTION_PARAMS: TransactionFormBaseProps = {
  asset: '',
  chain: '',
  from: ''
};

export const DEFAULT_TRANSFER_PARAMS: TransferParams = {
  ...DEFAULT_TRANSACTION_PARAMS,
  defaultSlug: '',
  destChain: '',
  to: '',
  value: ''
};

export const DEFAULT_NFT_PARAMS: SendNftParams = {
  ...DEFAULT_TRANSACTION_PARAMS,
  collectionId: '',
  itemId: '',
  to: ''
};

export const DEFAULT_STAKE_PARAMS: StakeParams = {
  ...DEFAULT_TRANSACTION_PARAMS,
  nominate: '',
  pool: '',
  type: '' as StakingType,
  value: '',
  defaultChain: ALL_KEY,
  defaultType: ALL_KEY
};

export const DEFAULT_EARN_PARAMS: EarnParams = {
  ...DEFAULT_TRANSACTION_PARAMS,
  slug: '',
  target: '',
  value: ''
};

export const DEFAULT_UN_STAKE_PARAMS: UnStakeParams = {
  ...DEFAULT_TRANSACTION_PARAMS,
  slug: '',
  fastLeave: false,
  validator: '',
  value: ''
};

export const DEFAULT_CANCEL_UN_STAKE_PARAMS: CancelUnStakeParams = {
  ...DEFAULT_TRANSACTION_PARAMS,
  slug: '',
  unstake: ''
};

export const DEFAULT_WITHDRAW_PARAMS: WithdrawParams = {
  ...DEFAULT_TRANSACTION_PARAMS,
  slug: ''
};

export const DEFAULT_CLAIM_REWARD_PARAMS: ClaimRewardParams = {
  ...DEFAULT_TRANSACTION_PARAMS,
  slug: '',
  bondReward: false
};

export const DEFAULT_SWAP_PARAMS: SwapParams = {
  ...DEFAULT_TRANSACTION_PARAMS,
  fromAmount: '',
  fromTokenSlug: '',
  toTokenSlug: '',
  defaultSlug: ''
};
