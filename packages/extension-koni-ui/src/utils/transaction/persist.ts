// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { CANCEL_UN_YIELD_TRANSACTION, CLAIM_YIELD_TRANSACTION, CURRENT_PAGE, NFT_TRANSACTION, STAKE_TRANSACTION, TRANSFER_TRANSACTION, UN_YIELD_TRANSACTION, WITHDRAW_YIELD_TRANSACTION, YIELD_TRANSACTION } from '@subwallet/extension-koni-ui/constants';

import { removeStorage } from '../common';

export const detectTransactionPersistKey = (type?: ExtrinsicType): string => {
  switch (type) {
    case ExtrinsicType.SEND_NFT:
      return NFT_TRANSACTION;
    case ExtrinsicType.TRANSFER_BALANCE:
    case ExtrinsicType.TRANSFER_TOKEN:
    case ExtrinsicType.TRANSFER_XCM:
      return TRANSFER_TRANSACTION;
    case ExtrinsicType.STAKING_BOND:
    case ExtrinsicType.STAKING_JOIN_POOL:
      return STAKE_TRANSACTION;
    case ExtrinsicType.STAKING_UNBOND:
    case ExtrinsicType.STAKING_LEAVE_POOL:
      return UN_YIELD_TRANSACTION;
    case ExtrinsicType.STAKING_CANCEL_UNSTAKE:
      return CANCEL_UN_YIELD_TRANSACTION;
    case ExtrinsicType.STAKING_WITHDRAW:
    case ExtrinsicType.STAKING_POOL_WITHDRAW:
      return WITHDRAW_YIELD_TRANSACTION;
    case ExtrinsicType.STAKING_CLAIM_REWARD:
      return CLAIM_YIELD_TRANSACTION;
    case ExtrinsicType.JOIN_YIELD_POOL:
      return YIELD_TRANSACTION;
    default:
      return '';
  }
};

export const removeTransactionPersist = (type?: ExtrinsicType) => {
  const key = detectTransactionPersistKey(type);

  if (key) {
    removeStorage(key);
  }

  window.localStorage.setItem(CURRENT_PAGE, '/home/tokens');
};
