// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import AutoEnableChainsTokens from '@subwallet/extension-base/services/migration-service/scripts/AutoEnableChainsTokens';
import MigrateAuthUrls from '@subwallet/extension-base/services/migration-service/scripts/MigrateAuthUrls';
import MigrateImportedToken from '@subwallet/extension-base/services/migration-service/scripts/MigrateImportedToken';
import MigrateNetworkSettings from '@subwallet/extension-base/services/migration-service/scripts/MigrateNetworkSettings';
import MigrateSettings from '@subwallet/extension-base/services/migration-service/scripts/MigrateSettings';
import MigrateTransactionHistory from '@subwallet/extension-base/services/migration-service/scripts/MigrateTransactionHistory';

import BaseMigrationJob from '../Base';

export const EVERYTIME = '__everytime__';

export default <Record<string, typeof BaseMigrationJob>> {
  '1.0.1-11': MigrateNetworkSettings,
  '1.0.1-20': MigrateImportedToken,
  '1.0.1-30': MigrateTransactionHistory,
  '1.0.1-40': AutoEnableChainsTokens,
  '1.0.1-50': MigrateSettings,
  '1.0.1-60': MigrateAuthUrls
  // [`${EVERYTIME}-1`]: AutoEnableChainsTokens
};
