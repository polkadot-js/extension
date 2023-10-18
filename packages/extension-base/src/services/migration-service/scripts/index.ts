// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import DeleteChain from '@subwallet/extension-base/services/migration-service/scripts/DeleteChain';
import DeleteEarningData from '@subwallet/extension-base/services/migration-service/scripts/DeleteEarningData';
import EnableEarningChains from '@subwallet/extension-base/services/migration-service/scripts/EnableEarningChains';

import BaseMigrationJob from '../Base';
import AutoEnableChainsTokens from './AutoEnableChainsTokens';
import MigrateAuthUrls from './MigrateAuthUrls';
import MigrateAutoLock from './MigrateAutoLock';
import MigrateChainPatrol from './MigrateChainPatrol';
import MigrateEthProvider from './MigrateEthProvider';
import MigrateImportedToken from './MigrateImportedToken';
import MigrateLedgerAccount from './MigrateLedgerAccount';
import MigrateNetworkSettings from './MigrateNetworkSettings';
import MigrateSettings from './MigrateSettings';
import MigrateTokenDecimals from './MigrateTokenDecimals';
import MigrateTransactionHistory from './MigrateTransactionHistory';
import MigrateWalletReference from './MigrateWalletReference';

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
  '1.0.9-01': MigrateLedgerAccount,
  '1.0.12-02': MigrateEthProvider,
  '1.1.6-01': MigrateWalletReference,
  '1.1.7': DeleteChain,
  '1.1.13-01': MigrateTokenDecimals,
  '1.1.13-02': EnableEarningChains,
  '1.1.13-03': DeleteEarningData
  // [`${EVERYTIME}-1`]: AutoEnableChainsTokens
};
