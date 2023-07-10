// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';

export const TRANSACTION_TITLE_MAP: Record<ExtrinsicType, string> = {
  [ExtrinsicType.TRANSFER_BALANCE]: 'Transfer',
  [ExtrinsicType.TRANSFER_XCM]: 'Transfer',
  [ExtrinsicType.TRANSFER_TOKEN]: 'Transfer',
  [ExtrinsicType.SEND_NFT]: 'Transfer NFT',
  [ExtrinsicType.CROWDLOAN]: 'Crowdloan',
  [ExtrinsicType.STAKING_JOIN_POOL]: 'Add to bond',
  [ExtrinsicType.STAKING_BOND]: 'Add to bond',
  [ExtrinsicType.STAKING_LEAVE_POOL]: 'Unbond',
  [ExtrinsicType.STAKING_UNBOND]: 'Unbond',
  [ExtrinsicType.STAKING_WITHDRAW]: 'Withdraw',
  [ExtrinsicType.STAKING_POOL_WITHDRAW]: 'Withdraw',
  [ExtrinsicType.STAKING_LEAVE_POOL]: 'Unbond',
  [ExtrinsicType.STAKING_CANCEL_UNSTAKE]: 'Cancel unstake',
  [ExtrinsicType.STAKING_CLAIM_REWARD]: 'Claim rewards',
  [ExtrinsicType.STAKING_COMPOUNDING]: 'Compound',
  [ExtrinsicType.STAKING_CANCEL_COMPOUNDING]: 'Cancel compound',
  [ExtrinsicType.EVM_EXECUTE]: 'Execute',
  [ExtrinsicType.UNKNOWN]: 'Unknown'
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
