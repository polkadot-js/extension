// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseMigrationJob from '@subwallet/extension-base/koni/migration/Base';

export default class ChangeRouteToHome extends BaseMigrationJob {
  public override async run (): Promise<void> {
    const deletedRoutes = [
      '/account/import-evm-token',
      '/account/import-evm-nft',
      '/account/evm-token-setting',
      '/account/evm-token-edit',
      '/account/import-evm-token',
      '/account/import-evm-nft',
      '/account/evm-token-setting',
      '/account/evm-token-edit'
    ];
    const currentRoute = window.localStorage.getItem('popupNavigation');

    if (currentRoute !== null && deletedRoutes.includes(currentRoute)) {
      window.localStorage.setItem('popupNavigation', '/');
    }

    return Promise.resolve();
  }
}
