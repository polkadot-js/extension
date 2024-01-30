// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TransactionHistoryItem } from '@subwallet/extension-base/background/KoniTypes';
import { SwIconProps } from '@subwallet/react-ui';

export interface TransactionHistoryDisplayData {
  className: string,
  typeName: string,
  name: string,
  title: string,
  icon: SwIconProps['phosphorIcon'],
}

export interface TransactionHistoryDisplayItem extends TransactionHistoryItem {
  displayData: TransactionHistoryDisplayData;
}
