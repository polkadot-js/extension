// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Network, PalletName } from '@subwallet/extension-base/services/chain-service/handler/manta/MantaBaseWallet';
import { MantaPayWallet } from '@subwallet/extension-base/services/chain-service/handler/manta/MantaPayWallet';

import { ApiPromise } from '@polkadot/api';

export class MantaChainHandler {
  private mantaWalletMap: Record<string, MantaPayWallet> = {};

  public getMantaWalletByChain (chain: string) {
    return this.mantaWalletMap[chain];
  }

  public setMantaWallet (chain: string, wallet: MantaPayWallet) {
    this.mantaWalletMap[chain] = wallet;
  }

  public async initMantaPayWallet (chain: string, api: ApiPromise, palletName: PalletName = 'mantaPay') {
    const network = chain.charAt(0).toUpperCase() + chain.slice(1);

    const mantaPayWallet = await MantaPayWallet.init(api, network as Network, palletName);

    this.setMantaWallet(chain, mantaPayWallet);
  }
}
