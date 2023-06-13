// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import AutoEnableChainsTokens from '@subwallet/extension-base/services/migration-service/scripts/AutoEnableChainsTokens';
import MigrateAuthUrls from '@subwallet/extension-base/services/migration-service/scripts/MigrateAuthUrls';
import MigrateAutoLock from '@subwallet/extension-base/services/migration-service/scripts/MigrateAutoLock';
import MigrateChainPatrol from '@subwallet/extension-base/services/migration-service/scripts/MigrateChainPatrol';
import MigrateImportedToken from '@subwallet/extension-base/services/migration-service/scripts/MigrateImportedToken';
import MigrateNetworkSettings from '@subwallet/extension-base/services/migration-service/scripts/MigrateNetworkSettings';
import MigrateSettings from '@subwallet/extension-base/services/migration-service/scripts/MigrateSettings';
import MigrateTransactionHistory from '@subwallet/extension-base/services/migration-service/scripts/MigrateTransactionHistory';
import MigrateLedgerAccount from '@subwallet/extension-base/services/migration-service/scripts/MirgrateLedgerAccount';

import BaseMigrationJob from '../Base';

export const EVERYTIME = '__everytime__';

export default <Record<string, typeof BaseMigrationJob>> {
  '1.0.1-11': MigrateNetworkSettings,
  '1.0.1-20': MigrateImportedToken,
  '1.0.1-30': MigrateTransactionHistory,
  '1.0.1-40': AutoEnableChainsTokens,
  '1.0.1-50': MigrateSettings,
  '1.0.1-60': MigrateAuthUrls,
  '1.0.3-01': MigrateAutoLock,
  '1.0.3-02': MigrateChainPatrol,
  '1.0.9-01': MigrateLedgerAccount
  // [`${EVERYTIME}-1`]: AutoEnableChainsTokens
};
