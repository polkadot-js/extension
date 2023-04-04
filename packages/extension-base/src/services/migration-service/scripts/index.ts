// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import MigrateImportedToken from '@subwallet/extension-base/services/migration-service/scripts/MigrateImportedToken';
import MigrateNetworkSettings from '@subwallet/extension-base/services/migration-service/scripts/MigrateNetworkSettings';

import BaseMigrationJob from '../Base';

export default <Record<string, typeof BaseMigrationJob>> {
  '1.0.1-11': MigrateNetworkSettings,
  '1.0.1-20': MigrateImportedToken
  // '1.0.1-0': ClearOldStorage
};
