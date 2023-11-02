// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import MigrateProvider from './MigrateProvider';

export default class MigrateEthProvider extends MigrateProvider {
  newProvider = 'ethereum';
  oldProvider = 'Cloudflare';
  slug = 'Llamarpc';
}
