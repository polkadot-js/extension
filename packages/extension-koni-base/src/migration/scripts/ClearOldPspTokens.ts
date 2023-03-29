// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CustomTokenJson } from '@subwallet/extension-base/background/KoniTypes';
import BaseMigrationJob from '@subwallet/extension-koni-base/migration/Base';
import CustomEvmTokenStore from '@subwallet/extension-koni-base/stores/CustomEvmToken';

export default class ClearOldPspTokens extends BaseMigrationJob {
  public override async run (): Promise<void> {
    new CustomEvmTokenStore().get('EvmToken', (oldData) => {
      new CustomEvmTokenStore().set('EvmToken', {
        erc20: oldData.erc20,
        erc721: oldData.erc721,
        psp22: [],
        psp34: []
      } as CustomTokenJson);
    });

    return Promise.resolve();
  }
}
