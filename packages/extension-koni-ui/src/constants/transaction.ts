// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';

export const TRANSACTION_TITLE_MAP: Record<ExtrinsicType, string> = {
  [ExtrinsicType.TRANSFER_BALANCE]: 'Transfer',
  [ExtrinsicType.TRANSFER_XCM]: 'Transfer',
  [ExtrinsicType.TRANSFER_TOKEN]: 'Transfer',
  [ExtrinsicType.SEND_NFT]: 'Transfer NFT',
  [ExtrinsicType.CROWDLOAN]: 'Crowdloan',
  [ExtrinsicType.STAKING_JOIN_POOL]: 'Add to Bond',
  [ExtrinsicType.STAKING_BOND]: 'Add to Bond',
  [ExtrinsicType.STAKING_LEAVE_POOL]: 'Remove Bond',
  [ExtrinsicType.STAKING_UNBOND]: 'Remove Bond',
  [ExtrinsicType.STAKING_WITHDRAW]: 'Withdraw',
  [ExtrinsicType.STAKING_POOL_WITHDRAW]: 'Withdraw',
  [ExtrinsicType.STAKING_LEAVE_POOL]: 'Remove Bond',
  [ExtrinsicType.STAKING_CANCEL_UNSTAKE]: 'Cancel unstake',
  [ExtrinsicType.STAKING_CLAIM_REWARD]: 'Claim reward',
  [ExtrinsicType.STAKING_COMPOUNDING]: 'Compound',
  [ExtrinsicType.STAKING_CANCEL_COMPOUNDING]: 'Cancel Compound',
  [ExtrinsicType.EVM_EXECUTE]: 'Execute',
  [ExtrinsicType.UNKNOWN]: 'Unknown'
};
