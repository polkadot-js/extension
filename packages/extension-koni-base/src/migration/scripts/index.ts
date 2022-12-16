// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import ChangeRouteToHome from '@subwallet/extension-koni-base/migration/scripts/ChangeRouteToHome';
import RemoveWrongCrowdloan from '@subwallet/extension-koni-base/migration/scripts/RemoveWrongCrowdloan';
import ResetTransactionHistoryEventIdx from '@subwallet/extension-koni-base/migration/scripts/ResetTransactionHistoryEventIdx';

import BaseMigrationJob from '../Base';
import ClearOldStorage from './ClearOldStorage';
import ConvertTransactionHistoryFromChromeStorageToIndexedDB from './ConvertTransactionHistoryFromChromeStorageToIndexedDB';

export default <Record<string, typeof BaseMigrationJob>> {
  // '0.5.3-2': FixMissingTransactionHistory,
  '0.5.3-3': ConvertTransactionHistoryFromChromeStorageToIndexedDB,
  // '0.5.3-3-1': ConvertTransactionHistoryFromChromeStorageToIndexedDB, // Can run multiple times with diffrent key
  '0.5.6-1': ClearOldStorage,
  '0.6.6-1': ChangeRouteToHome,
  '0.7.2-1': RemoveWrongCrowdloan,
  '0.7.5-0': ResetTransactionHistoryEventIdx
};
