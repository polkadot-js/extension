// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MigrateProviderTarget } from './MigrateGeneralProvider';
import MigrateMultiProviders from './MigrateMultiProviders';

export default class MigrateProvidersV1M1P24 extends MigrateMultiProviders {
  targets: MigrateProviderTarget[] = [
    {
      slug: 'polkadot',
      oldProvider: 'Parity',
      newProvider: 'Dwellir'
    },
    {
      slug: 'kusama',
      oldProvider: 'Parity',
      newProvider: 'Dwellir'
    },
    {
      slug: 'moonbeam',
      oldProvider: 'OnFinality',
      newProvider: 'Moonbeam Foundation'
    },
    {
      slug: 'moonbase',
      oldProvider: 'OnFinality',
      newProvider: 'Moonbeam Foundation'
    }
  ];
}
