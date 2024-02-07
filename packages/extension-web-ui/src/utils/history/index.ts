// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransactionHistoryItem } from '@subwallet/extension-base/background/KoniTypes';

export function isAbleToShowFee (item: TransactionHistoryItem): boolean {
  return !!(item.fee && item.fee.value && item.fee.value !== '0');
}
