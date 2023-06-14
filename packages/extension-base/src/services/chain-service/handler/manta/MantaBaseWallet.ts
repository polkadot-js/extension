// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Wallet as WasmWallet } from 'manta-extension-sdk/dist/browser/wallet/crate/pkg/manta_wasm_wallet';

import { Address, Checkpoint } from 'manta-extension-sdk/dist/browser/interfaces';
import LedgerApi from 'manta-extension-sdk/dist/browser/ledger-api';
import { getLedgerSyncedCount } from 'manta-extension-sdk/dist/browser/utils';

import { ApiPromise } from '@polkadot/api';
import { BN, u8aToBn } from '@polkadot/util';
import { base58Encode } from '@polkadot/util-crypto';

export type PalletName = 'mantaPay' | 'mantaSBT';

export type Network = 'Dolphin' | 'Calamari' | 'Manta';

export class MantaBaseWallet {
  // base
  wasm: unknown;
  fullParameters: unknown;
  multiProvingContext: unknown;
  api: ApiPromise;

  // private
  palletName: PalletName;
  wasmWallet: WasmWallet;
  ledgerApi: LedgerApi;
  network: Network;

  initialSyncIsFinished = false;
  isBindAuthorizationContext = false;

  constructor (wasm: unknown, fullParameters: unknown, multiProvingContext: unknown, api: ApiPromise, network: Network, palletName: PalletName, wasmWallet: WasmWallet, ledgerApi: LedgerApi) {
    this.wasm = wasm;
    this.fullParameters = fullParameters;
    this.multiProvingContext = multiProvingContext;
    this.api = api;
    this.network = network;
    this.palletName = palletName;
    this.wasmWallet = wasmWallet;
    this.ledgerApi = ledgerApi;
  }

  protected getWasmNetWork (): any {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return
    return this.wasm.Network.from_string(`"${this.network}"`);
  }

  loadUserSeedPhrase (seedPhrase: string) {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
    const wasmSeedPhrase = this.wasm.mnemonic_from_phrase(seedPhrase);
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
    const accountTable = this.wasm.accounts_from_mnemonic(wasmSeedPhrase);

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-argument
    this.wasmWallet.load_accounts(accountTable, this.getWasmNetWork());
    this.isBindAuthorizationContext = true;
  }

  setNetwork (network: Network) {
    this.network = network;
    const storageData = null;

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-argument
    const wasmSigner = new this.wasm.Signer(
      this.fullParameters,
      this.multiProvingContext,
      storageData
    );

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-argument
    const wasmLedger = new this.wasm.PolkadotJsLedger(this.ledgerApi);

    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-argument
    this.wasmWallet.set_network(wasmLedger, wasmSigner, this.getWasmNetWork());
  }

  /// This method is optimized based on initialWalletSync
  ///
  /// Requirements: Must be called once after creating an instance of PrivateWallet
  /// and must be called before walletSync().
  /// If it is a new wallet (the current solution is that the native token is 0),
  /// you can call this method to save initialization time
  async initialNewAccountWalletSync (): Promise<boolean> {
    if (!this.isBindAuthorizationContext) {
      throw new Error('No ViewingKey');
    }

    await this.api.isReady;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    await this.wasmWallet.initial_sync(this.getWasmNetWork());
    // TODO: save state to local
    this.initialSyncIsFinished = true;

    return true;
  }

  private async syncPartialWallet (): Promise<{
    success: boolean;
    continue: boolean;
  }> {
    try {
      const syncType =
        this.palletName === 'mantaSBT' ? 'sbt_sync_partial' : 'sync_partial';

      await this.api.isReady;
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-argument
      const result = await this.wasmWallet[syncType](this.getWasmNetWork());

      // TODO: save state to db
      // await this.saveStateToLocal();
      return {
        success: true,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        continue: Object.keys(result)[0] === 'Continue'
      };
    } catch (ex) {
      console.error('Sync partial failed.', ex);

      return {
        success: false,
        continue: true
      };
    }
  }

  private async loopSyncPartialWallet (isInitial: boolean): Promise<boolean> {
    if (!this.isBindAuthorizationContext) {
      throw new Error('No ViewingKey');
    }

    if (isInitial) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      await this.wasmWallet.reset_state(this.getWasmNetWork());
    }

    let syncResult = null;
    let retryTimes = 0;

    do {
      console.log('Sync partial start');
      syncResult = await this.syncPartialWallet();
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      console.log(`Sync partial end, success: ${syncResult.success}, continue: ${syncResult.continue}`);

      if (!syncResult.success) {
        await new Promise((resolve) => {
          setTimeout(resolve, 600);
        });
        retryTimes += 1;
      } else {
        retryTimes = 0;
      }

      if (retryTimes > 5) {
        throw new Error('Sync partial failed');
      }
    } while (syncResult && syncResult.continue);

    if (isInitial) {
      this.initialSyncIsFinished = true;
    }

    return true;
  }

  /// Pulls data from the ledger, synchronizing the currently connected wallet and
  /// balance state. This method runs until all the ledger data has arrived at and
  /// has been synchronized with the wallet.
  async walletSync (): Promise<boolean> {
    if (!this.initialSyncIsFinished) {
      throw new Error('Must call initialWalletSync before walletSync!');
    }

    return await this.loopSyncPartialWallet(false);
  }

  /// Performs full wallet recovery. Restarts `self` with an empty state and
  /// performs a synchronization against the signer and ledger to catch up to
  /// the current checkpoint and balance state.
  ///
  /// Requirements: Must be called once after creating an instance of PrivateWallet
  /// and must be called before walletSync().
  /// If it is a new wallet (the current solution is that the native token is 0),
  /// you can call initialNewAccountWalletSync to save initialization time
  async initialWalletSync (): Promise<boolean> {
    return await this.loopSyncPartialWallet(true);
  }

  async getLedgerTotalCount () {
    await this.api.isReady;
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const totalCount = await this.api.rpc[this.palletName].pull_ledger_total_count();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return u8aToBn(totalCount).toNumber();
  }

  getLedgerCurrentCount (checkpoint: Checkpoint) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return getLedgerSyncedCount(checkpoint);
  }

  /// Returns the ZkAddress (Zk Address) of the currently connected manta-signer instance.
  async getZkAddress (): Promise<Address> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-argument
    const zkAddressRaw = await this.wasmWallet.address(this.getWasmNetWork());
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    const zkAddressBytes = [...zkAddressRaw.receiving_key];

    return base58Encode(zkAddressBytes);
  }

  /// Returns the zk balance of the currently connected zkAddress for the currently
  /// connected network.
  getZkBalance (assetId: BN): BN {
    const balanceString = this.wasmWallet.balance(
      assetId.toString(),
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      this.getWasmNetWork()
    );

    return new BN(balanceString);
  }

  /// Returns the multi zk balance of the currently connected zkAddress for the currently
  /// connected network.
  getMultiZkBalance (assetIds: BN[]): BN[] {
    return assetIds.map((assetId) => {
      const balanceString = this.wasmWallet.balance(
        assetId.toString(),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        this.getWasmNetWork()
      );

      return new BN(balanceString);
    });
  }
}
