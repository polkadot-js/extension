// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseMigrationJob from '@subwallet/extension-base/services/migration-service/Base';
import { keyring } from '@subwallet/ui-keyring';
import SUBSCAN_CHAIN_MAP from "@subwallet/extension-base/services/subscan-service/subscan-chain-map";

export default class AutoEnableChainsTokens extends BaseMigrationJob {
  public override async run (): Promise<void> {
    const state = this.state;
    const accounts = keyring.getAccounts();
    const assetMap = this.state.chainService.getAssetRegistry();
    const promiseList = accounts.map((account) => {
      return state.subscanService.getMultiChainBalance(account.address)
        .catch((e) => {
          console.error(e);

          return null;
        });
    });

    const needEnableChains: string[] = []
    const needActiveTokens: string[] = []
    const currentAssetSettings = await state.chainService.getAssetSettings();
    const balanceDataList = await Promise.all(promiseList);
    balanceDataList.forEach((balanceData) => {
      balanceData && balanceData.forEach(({network, symbol, category}) => {
        const chain = SUBSCAN_CHAIN_MAP[network];
        if (!chain) {
          return;
        }

        const tokenKey = `${chain}-${category === 'native' ? 'NATIVE': 'LOCAL'}-${symbol.toUpperCase()}`;

        if (assetMap[tokenKey] && !currentAssetSettings[tokenKey]?.visible) {
          needEnableChains.push(chain);
          needActiveTokens.push(tokenKey);
          currentAssetSettings[tokenKey] = {visible: true};
        }
      });
    });

    if (needActiveTokens.length) {
      state.chainService.enableChains(needEnableChains);
      await state.chainService.setAssetSettings({...currentAssetSettings});
      state.updateServiceInfo();
    }

    return Promise.resolve();
  }
}
