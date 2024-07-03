// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountsStore } from '@subwallet/extension-base/stores';
import { KeyringJson } from '@subwallet/ui-keyring/types';

import { isString } from '@polkadot/util';
import { isEthereumAddress } from '@polkadot/util-crypto';

import BaseMigrationJob from '../Base';

export default class MigrateLedgerAccountV2 extends BaseMigrationJob {
  public override async run (): Promise<void> {
    try {
      return new Promise((resolve) => {
        const store = new AccountsStore();

        const update = (key: string, value: KeyringJson) => {
          if (key.startsWith('account:') && value.meta && isString(value.meta?.originGenesisHash)) {
            const newValue = { ...value };

            if (value.meta.isHardware) {
              const isEther = isEthereumAddress(value.address);

              if (isEther) {
                newValue.meta.isGeneric = true;
              } else {
                newValue.meta.isGeneric = !newValue.meta.originGenesisHash;
              }
            }

            newValue.meta.availableGenesisHashes = [value.meta.originGenesisHash];
            store.set(key, newValue);
          }
        };

        store.allMap((map: Record<string, KeyringJson>) => {
          Object.entries(map).forEach(([key, value]): void => {
            update(key, value);
          });

          resolve();
        });
      });
    } catch (e) {
      console.error(e);
    }
  }
}
