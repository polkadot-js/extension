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
  [ExtrinsicType.STAKING_LEAVE_POOL]: 'Remove bond',
  [ExtrinsicType.STAKING_UNBOND]: 'Remove bond',
  [ExtrinsicType.STAKING_WITHDRAW]: 'Withdraw',
  [ExtrinsicType.STAKING_POOL_WITHDRAW]: 'Withdraw',
  [ExtrinsicType.STAKING_CANCEL_UNSTAKE]: 'Cancel unstake',
  [ExtrinsicType.STAKING_CLAIM_REWARD]: 'Claim rewards',
  [ExtrinsicType.STAKING_COMPOUNDING]: 'Compound',
  [ExtrinsicType.STAKING_CANCEL_COMPOUNDING]: 'Cancel compound',
  [ExtrinsicType.EVM_EXECUTE]: 'Execute',
  [ExtrinsicType.UNKNOWN]: 'Unknown'
};
