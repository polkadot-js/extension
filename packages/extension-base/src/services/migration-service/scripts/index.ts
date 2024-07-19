// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseMigrationJob from '../Base';
import AutoEnableSomeTokens from './databases/AutoEnableSomeTokens';
import ClearMetadataDatabase from './databases/ClearMetadataDatabase';
import MigrateAssetSetting from './databases/MigrateAssetSetting';
import MigrateEarningVersion from './databases/MigrateEarningVersion';
import ReloadMetadata from './databases/ReloadMetadata';
import MigrateEthProvider from './providers/MigrateEthProvider';
import MigratePioneerProvider from './providers/MigratePioneerProvider';
import MigrateProvidersV1M1P24 from './providers/MigrateProvidersV1M1P24';
import MigratePolygonUSDCProvider from './tokens/MigratePolygonUSDCProvider';
import AutoEnableChainsTokens from './AutoEnableChainsTokens';
import DeleteChain from './DeleteChain';
import DeleteChainStaking from './DeleteChainStaking';
import DeleteEarningData from './DeleteEarningData';
import EnableVaraChain from './EnableVaraChain';
import MigrateAuthUrls from './MigrateAuthUrls';
import MigrateAutoLock from './MigrateAutoLock';
import MigrateChainPatrol from './MigrateChainPatrol';
import MigrateImportedToken from './MigrateImportedToken';
import MigrateLedgerAccount from './MigrateLedgerAccount';
import MigrateLedgerAccountV2 from './MigrateLedgerAccountV2';
import MigrateNetworkSettings from './MigrateNetworkSettings';
import MigrateRemoveGenesisHash from './MigrateRemoveGenesisHash';
import MigrateSettings from './MigrateSettings';
import MigrateTokenDecimals from './MigrateTokenDecimals';
import MigrateTransactionHistory from './MigrateTransactionHistory';
import MigrateTransactionHistoryBySymbol from './MigrateTransactionHistoryBySymbol';
import MigrateWalletReference from './MigrateWalletReference';

export const EVERYTIME = '__everytime__';

export default <Record<string, typeof BaseMigrationJob>>{
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
  // '1.1.13-02-2': EnableEarningChains,
  '1.1.13-03': DeleteEarningData,
  '1.1.17-01': MigratePioneerProvider,
  '1.1.17-03': EnableVaraChain,
  '1.1.24-01': MigrateProvidersV1M1P24,
  '1.1.26-01': MigratePolygonUSDCProvider,
  '1.1.28-01': MigrateEarningVersion,
  '1.1.33-01': MigrateLedgerAccountV2,
  '1.1.41-01': DeleteChainStaking,
  '1.1.46-01': AutoEnableSomeTokens,
  '1.1.69-03': MigrateAssetSetting,
  '1.1.69-02': MigrateTransactionHistoryBySymbol,
  '1.2.69-01': MigrateRemoveGenesisHash,
  '1.2.13-01': ReloadMetadata,
  '1.2.14-01': ClearMetadataDatabase
  // [`${EVERYTIME}-1.1.42-02`]: MigrateTransactionHistoryBySymbol
  // [`${EVERYTIME}-1`]: AutoEnableChainsTokens
};
