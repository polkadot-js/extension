// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _AssetType } from '@subwallet/chain-list/types';
import BaseMigrationJob from '@subwallet/extension-base/services/migration-service/Base';

interface OldTokenType {
  chain: string,
  isCustom?: boolean,
  decimals: string | number,
  name: string,
  smartContract: string,
  symbol: string
}

export default class MigrateImportedToken extends BaseMigrationJob {
  public override async run (): Promise<void> {
    const state = this.state;

    return new Promise((resolve, reject) => {
      chrome.storage.local.get('EvmToken', function (items) {
        if (items && items.EvmToken) {
          const tokenMap = items.EvmToken as Record<string, OldTokenType[]>;

          Object.entries(tokenMap).forEach(([t, tokenList]) => {
            tokenList.forEach((item) => {
              try {
                item.isCustom && state.chainService.upsertCustomToken({
                  assetType: t.toUpperCase() as _AssetType,
                  decimals: item.decimals ? parseInt(item.decimals.toString()) : null,
                  hasValue: true,
                  metadata: {
                    contractAddress: item.smartContract
                  },
                  minAmount: '0',
                  multiChainAsset: null,
                  name: item.name,
                  originChain: item.chain,
                  priceId: null,
                  slug: '',
                  symbol: item.symbol || '',
                  icon: ''
                });
              } catch (e) {
                console.log(e);
              }
            });
          });
        }

        resolve();
      });
    });
  }
}
