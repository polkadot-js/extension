// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseMigrationJob from '../Base';
import ConvertTransactionHistoryFromChromeStorageToIndexedDB from './ConvertTransactionHistoryFromChromeStorageToIndexedDB';
// import FixMissingTransactionHistory from './FixMissingTransactionHistory';

export default <Record<string, typeof BaseMigrationJob>> {
  // '0.5.3-2': FixMissingTransactionHistory,
  '0.5.3-3': ConvertTransactionHistoryFromChromeStorageToIndexedDB,
  '0.5.3-3-1': ConvertTransactionHistoryFromChromeStorageToIndexedDB
};
