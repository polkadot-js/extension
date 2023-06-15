// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import DatabaseService from '@subwallet/extension-base/services/storage-service/DatabaseService';
import { BaseWallet, interfaces, MantaPayWallet } from 'manta-extension-sdk';

export class MantaPrivateHandler {
  private currentAddress = '';
  private dbService: DatabaseService;
  private _privateWallet: MantaPayWallet | undefined = undefined;

  constructor (dbService: DatabaseService) {
    this.dbService = dbService;
  }

  public get privateWallet () {
    return this._privateWallet;
  }

  private async saveLedgerState (palletName: interfaces.PalletName, network: interfaces.Network, data: any): Promise<boolean> {
    console.log('save data with dbService for current account', this.currentAddress);

    await this.dbService.setMantaPayLedger({
      key: `storage_state_${palletName}_${network}_${this.currentAddress}`,
      ...data
    });

    return true;
  }

  private async getLedgerState (palletName: interfaces.PalletName, network: interfaces.Network): Promise<any> {
    const result = await this.dbService.getMantaPayLedger(`storage_state_${palletName}_${network}_${this.currentAddress}`);
    return result;
  }

  public async initMantaPay (providerUrl: string, network: string) {
    const networkParam = network.charAt(0).toUpperCase() + network.slice(1); // Manta || Calamari || Dolphin

    const baseWallet = await BaseWallet.init({
      apiEndpoint: providerUrl,
      loggingEnabled: true,
      provingFilePath: './manta-pay/proving',
      parametersFilePath: './manta-pay/parameters',
      saveStorageStateToLocal: this.saveLedgerState,
      getStorageStateFromLocal: this.getLedgerState
    });

    this._privateWallet = MantaPayWallet.init(networkParam as interfaces.Network, baseWallet);

    return this._privateWallet.api;
  }
}
