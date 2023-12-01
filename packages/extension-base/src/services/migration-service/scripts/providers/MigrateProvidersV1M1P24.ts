// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MigrateProviderTarget } from './MigrateGeneralProvider';
import MigrateProviders from './MigrateProviders';

export default class MigrateProvidersV1M1P24 extends MigrateProviders {
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
