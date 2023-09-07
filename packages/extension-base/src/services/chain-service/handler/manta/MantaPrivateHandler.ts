// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MantaAuthorizationContext, MantaPayConfig, MantaPaySyncState } from '@subwallet/extension-base/background/KoniTypes';
import DatabaseService from '@subwallet/extension-base/services/storage-service/DatabaseService';
import { BaseWallet, interfaces, MantaPayWallet } from 'manta-extension-sdk';
import { Subject } from 'rxjs';

export class MantaPrivateHandler {
  private dbService: DatabaseService;
  private _privateWallet: MantaPayWallet | undefined = undefined;
  private currentAddress: string | undefined;
  private syncStateSubject = new Subject<MantaPaySyncState>();
  private syncState: MantaPaySyncState;

  constructor (dbService: DatabaseService) {
    this.dbService = dbService;
    this.syncState = {
      isSyncing: false,
      progress: 0
    };
    this.syncStateSubject.next(this.syncState);
  }

  public setCurrentAddress (address: string) {
    this.currentAddress = address;
  }

  public getSyncState () {
    return this.syncState;
  }

  public get privateWallet () {
    return this._privateWallet;
  }

  public subscribeSyncState () {
    return this.syncStateSubject;
  }

  public async updateMantaPayConfig (address: string, chain: string, changes: Record<string, any>) {
    await this.dbService.updateMantaPayData(`config_${chain}_${address}`, changes);
  }

  public async saveMantaPayConfig (config: MantaPayConfig) {
    await this.dbService.setMantaPayData({
      key: `config_${config.chain}_${config.address}`,
      ...config
    });
  }

  public async getMantaPayConfig (address: string, chain: string): Promise<any> {
    return this.dbService.getMantaPayData(`config_${chain}_${address}`);
  }

  public async getMantaPayFirstConfig (chain: string) {
    return this.dbService.getMantaPayFirstConfig(chain);
  }

  public async deleteMantaPayConfig (address: string, chain: string): Promise<any> {
    return this.dbService.deleteMantaPayConfig(`config_${chain}_${address}`);
  }

  public async saveMantaAuthContext (context: MantaAuthorizationContext) {
    await this.dbService.setMantaPayData({
      key: `authContext_${context.chain}_${context.address}`,
      ...context
    });
  }

  public async getMantaAuthContext (address: string, chain: string) {
    return this.dbService.getMantaPayData(`authContext_${chain}_${address}`);
  }

  public async deleteMantaAuthContext (address: string, chain: string) {
    return this.dbService.deleteMantaPayConfig(`authContext_${chain}_${address}`);
  }

  private async saveLedgerState (palletName: interfaces.PalletName, network: interfaces.Network, data: any): Promise<boolean> {
    try {
      const suffix = this.currentAddress ? `_${this.currentAddress}` : '';

      await this.dbService.setMantaPayData({
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

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      result = await this.dbService.getMantaPayData(`storage_state_${palletName}_${network}${suffix}`);
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

  public async getCurrentLedgerState () {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const ledgerState = await this.getLedgerState('mantaPay', 'Calamari');

    if (!ledgerState) {
      return 0;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    return (await this._privateWallet?.getLedgerCurrentCount(ledgerState.checkpoint)) as number;
  }

  public setSyncState (data: MantaPaySyncState) {
    this.syncState = data;

    this.syncStateSubject.next(this.syncState);
  }

  public async subscribeSyncProgress () {
    const ledgerTotalCount = (await this._privateWallet?.getLedgerTotalCount()) as number;

    const interval = setInterval(() => {
      this.getCurrentLedgerState().then((currentCount: number) => {
        const progress = Math.floor((currentCount / ledgerTotalCount) * 100);

        if (progress === 100) {
          this.syncState = {
            isSyncing: false,
            progress
          };

          clearInterval(interval);
        } else {
          this.syncState = {
            isSyncing: true,
            progress
          };
        }

        this.syncStateSubject.next(this.syncState);
      })
        .catch(console.error);
    }, 1000);

    return () => {
      interval && clearInterval(interval);
    };
  }
}
