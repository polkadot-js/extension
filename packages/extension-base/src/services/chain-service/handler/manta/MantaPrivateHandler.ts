// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import DatabaseService from '@subwallet/extension-base/services/storage-service/DatabaseService';
import { BaseWallet, interfaces, MantaPayWallet } from 'manta-extension-sdk';

export class MantaPrivateHandler {
  private dbService: DatabaseService;
  private _privateWallet: MantaPayWallet | undefined = undefined;
  private currentAddress: string | undefined;

  constructor (dbService: DatabaseService) {
    this.dbService = dbService;
  }

  public setCurrentAddress (address: string) {
    this.currentAddress = address;
  }

  public getCurrentAddress () {
    return this.currentAddress;
  }

  public get privateWallet () {
    return this._privateWallet;
  }

  private async saveLedgerState (palletName: interfaces.PalletName, network: interfaces.Network, data: any): Promise<boolean> {
    try {
      const suffix = this.currentAddress ? `_${this.currentAddress}` : '';

      await this.dbService.setMantaPayLedger({
        key: `storage_state_${palletName}_${network}${suffix}`,
        ...data
      });
    } catch (e) {
      console.error('manta-pay', e);

      return false;
    }

    return true;
  }

  private async getLedgerState (palletName: interfaces.PalletName, network: interfaces.Network): Promise<any> {
    let result: any;

    try {
      const suffix = this.currentAddress ? `_${this.currentAddress}` : '';

      console.log('get ledger data', `storage_state_${palletName}_${network}${suffix}`);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      result = await this.dbService.getMantaPayLedger(`storage_state_${palletName}_${network}${suffix}`);
    } catch (e) {
      console.error(e);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return result || null;
  }

  public async initMantaPay (providerUrl: string, network: string) {
    const networkParam = network.charAt(0).toUpperCase() + network.slice(1); // Manta || Calamari || Dolphin

    const baseWallet = await BaseWallet.init({
      apiEndpoint: providerUrl,
      loggingEnabled: true,
      provingFilePath: './manta-pay/proving',
      parametersFilePath: './manta-pay/parameters',
      saveStorageStateToLocal: this.saveLedgerState.bind(this),
      getStorageStateFromLocal: this.getLedgerState.bind(this)
    });

    this._privateWallet = MantaPayWallet.init(networkParam as interfaces.Network, baseWallet);

    return this._privateWallet.api;
  }
}
