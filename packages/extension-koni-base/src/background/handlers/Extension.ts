// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Extension from '@polkadot/extension-base/background/handlers/Extension';
import { createSubscription, unsubscribe } from '@polkadot/extension-base/background/handlers/subscriptions';
import { AccountsWithCurrentAddress, BackgroundWindow, BalanceJson, ChainRegistry, CrowdloanJson, NetWorkMetadataDef, NftJson, PriceJson, RequestApi, RequestTransactionHistoryAdd, RequestTransactionHistoryGet, RequestTransactionHistoryGetByMultiNetworks, StakingJson } from '@polkadot/extension-base/background/KoniTypes';
import { AccountJson, MessageTypes, RequestAccountCreateSuri, RequestBatchRestore, RequestCurrentAccountAddress, RequestDeriveCreate, RequestJsonRestore, RequestTypes, ResponseType } from '@polkadot/extension-base/background/types';
import { ApiInitStatus, initApi } from '@polkadot/extension-koni-base/api/dotsama';
import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';
import { rpcsMap, state } from '@polkadot/extension-koni-base/background/handlers/index';
import { ALL_ACCOUNT_KEY } from '@polkadot/extension-koni-base/constants';
import { createPair } from '@polkadot/keyring';
import { KeyringPair, KeyringPair$Json, KeyringPair$Meta } from '@polkadot/keyring/types';
import keyring from '@polkadot/ui-keyring';
import { accounts as accountsObservable } from '@polkadot/ui-keyring/observable/accounts';
import { SubjectInfo } from '@polkadot/ui-keyring/observable/types';
import { hexToU8a, isHex, u8aToString } from '@polkadot/util';
import { base64Decode, jsonDecrypt } from '@polkadot/util-crypto';
import { EncryptedJson, KeypairType, Prefix } from '@polkadot/util-crypto/types';

const bWindow = window as unknown as BackgroundWindow;

const ETH_DERIVE_DEFAULT = "/m/44'/60'/0'/0/0";

function getSuri (seed: string, type?: KeypairType): string {
  return type === 'ethereum'
    ? `${seed}${ETH_DERIVE_DEFAULT}`
    : seed;
}

function transformAccounts (accounts: SubjectInfo): AccountJson[] {
  return Object.values(accounts).map(({ json: { address, meta }, type }): AccountJson => ({
    address,
    ...meta,
    type
  }));
}

const ACCOUNT_ALL_JSON: AccountJson = {
  address: ALL_ACCOUNT_KEY,
  name: 'All'
};

export default class KoniExtension extends Extension {
  public decodeAddress = (key: string | Uint8Array, ignoreChecksum?: boolean, ss58Format?: Prefix): Uint8Array => {
    return keyring.decodeAddress(key, ignoreChecksum, ss58Format);
  };

  public encodeAddress = (key: string | Uint8Array, ss58Format?: Prefix): string => {
    return keyring.encodeAddress(key, ss58Format);
  };

  private accountsGetAllWithCurrentAddress (id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pri(accounts.subscribeWithCurrentAddress)'>(id, port);
    const subscription = accountsObservable.subject.subscribe((storedAccounts: SubjectInfo): void => {
      const transformedAccounts = transformAccounts(storedAccounts);

      const accounts: AccountJson[] = transformedAccounts && transformedAccounts.length
        ? [
          {
            ...ACCOUNT_ALL_JSON
          },
          ...transformedAccounts
        ]
        : [];

      console.log('storedAccounts====', storedAccounts);
      console.log('accounts====', accounts);

      const accountsWithCurrentAddress: AccountsWithCurrentAddress = {
        accounts
      };

      state.getCurrentAccount((accountInfo) => {
        if (accountInfo) {
          accountsWithCurrentAddress.currentAddress = accountInfo.address;
        }

        cb(accountsWithCurrentAddress);
      });
    });

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      subscription.unsubscribe();
    });

    return true;
  }

  private triggerAccountsSubscription (): boolean {
    const accountsSubject = accountsObservable.subject;

    accountsSubject.next(accountsSubject.getValue());

    return true;
  }

  private _saveCurrentAccountAddress (address: string, callback?: () => void) {
    state.getCurrentAccount((accountInfo) => {
      if (!accountInfo) {
        accountInfo = {
          address
        };
      } else {
        accountInfo.address = address;
      }

      state.setCurrentAccount(accountInfo, callback);
    });
  }

  private saveCurrentAccountAddress ({ address }: RequestCurrentAccountAddress): boolean {
    this._saveCurrentAccountAddress(address);

    return true;
  }

  private getPrice (): Promise<PriceJson> {
    return new Promise<PriceJson>((resolve, reject) => {
      state.getPrice((rs: PriceJson) => {
        resolve(rs);
      });
    });
  }

  private subscribePrice (id: string, port: chrome.runtime.Port): Promise<PriceJson> {
    const cb = createSubscription<'pri(price.getSubscription)'>(id, port);

    const priceSubscription = state.subscribePrice().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      priceSubscription.unsubscribe();
    });

    return this.getPrice();
  }

  private getBalance (): BalanceJson {
    return state.getBalance();
  }

  private subscribeBalance (id: string, port: chrome.runtime.Port): BalanceJson {
    const cb = createSubscription<'pri(balance.getSubscription)'>(id, port);

    const balanceSubscription = state.subscribeBalance().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      balanceSubscription.unsubscribe();
    });

    return this.getBalance();
  }

  private getCrowdloan (): CrowdloanJson {
    return state.getCrowdloan();
  }

  private subscribeCrowdloan (id: string, port: chrome.runtime.Port): CrowdloanJson {
    const cb = createSubscription<'pri(crowdloan.getSubscription)'>(id, port);

    const balanceSubscription = state.subscribeCrowdloan().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      balanceSubscription.unsubscribe();
    });

    return this.getCrowdloan();
  }

  private getChainRegistryMap (): Record<string, ChainRegistry> {
    return state.getChainRegistryMap();
  }

  private subscribeChainRegistry (id: string, port: chrome.runtime.Port): Record<string, ChainRegistry> {
    const cb = createSubscription<'pri(chainRegistry.getSubscription)'>(id, port);

    const subscription = state.subscribeChainRegistryMap().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      subscription.unsubscribe();
    });

    return this.getChainRegistryMap();
  }

  private validatePassword (json: KeyringPair$Json, password: string): boolean {
    const cryptoType = Array.isArray(json.encoding.content) ? json.encoding.content[1] : 'ed25519';
    const encType = Array.isArray(json.encoding.type) ? json.encoding.type : [json.encoding.type];
    const pair = createPair(
      { toSS58: this.encodeAddress, type: cryptoType as KeypairType },
      { publicKey: this.decodeAddress(json.address, true) },
      json.meta,
      isHex(json.encoded) ? hexToU8a(json.encoded) : base64Decode(json.encoded),
      encType
    );

    // unlock then lock (locking cleans secretKey, so needs to be last)
    try {
      pair.decodePkcs8(password);
      pair.lock();

      return true;
    } catch (e) {
      console.error(e);

      return false;
    }
  }

  private validatedAccountsPassword (json: EncryptedJson, password: string): boolean {
    try {
      u8aToString(jsonDecrypt(json, password));

      return true;
    } catch (e) {
      return false;
    }
  }

  private accountsCreateSuriV2 ({ genesisHash, name, password, suri: _suri, type }: RequestAccountCreateSuri): boolean {
    const suri = getSuri(_suri, type);
    const address = keyring.createFromUri(suri, {}, type).address;

    this._saveCurrentAccountAddress(address, () => {
      keyring.addUri(suri, password, { genesisHash, name }, type);
    });

    return true;
  }

  private deriveV2 (parentAddress: string, suri: string, password: string, metadata: KeyringPair$Meta): KeyringPair {
    const parentPair = keyring.getPair(parentAddress);

    try {
      parentPair.decodePkcs8(password);
    } catch (e) {
      throw new Error('invalid password');
    }

    try {
      return parentPair.derive(suri, metadata);
    } catch (err) {
      throw new Error(`"${suri}" is not a valid derivation path`);
    }
  }

  private derivationCreateV2 ({ genesisHash, name, parentAddress, parentPassword, password, suri }: RequestDeriveCreate): boolean {
    const childPair = this.deriveV2(parentAddress, suri, parentPassword, {
      genesisHash,
      name,
      parentAddress,
      suri
    });

    const address = childPair.address;

    this._saveCurrentAccountAddress(address, () => {
      keyring.addPair(childPair, password);
    });

    return true;
  }

  private jsonRestoreV2 ({ address, file, password }: RequestJsonRestore): void {
    const isPasswordValidated = this.validatePassword(file, password);

    if (isPasswordValidated) {
      try {
        this._saveCurrentAccountAddress(address, () => {
          keyring.restoreAccount(file, password);
        });
      } catch (error) {
        throw new Error((error as Error).message);
      }
    } else {
      throw new Error('Unable to decode using the supplied passphrase');
    }
  }

  private batchRestoreV2 ({ address, file, password }: RequestBatchRestore): void {
    const isPasswordValidated = this.validatedAccountsPassword(file, password);

    if (isPasswordValidated) {
      try {
        this._saveCurrentAccountAddress(address, () => {
          keyring.restoreAccounts(file, password);
        });
      } catch (error) {
        throw new Error((error as Error).message);
      }
    } else {
      throw new Error('Unable to decode using the supplied passphrase');
    }
  }

  private getNft (): Promise<NftJson> {
    return new Promise<NftJson>((resolve, reject) => {
      state.getNft((rs: NftJson) => {
        resolve(rs);
      });
    });
  }

  private async subscribeNft (id: string, port: chrome.runtime.Port): Promise<NftJson | null> {
    const cb = createSubscription<'pri(nft.getSubscription)'>(id, port);
    const nftSubscription = state.subscribeNft().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      nftSubscription.unsubscribe();
    });

    return this.getNft();
  }

  private getStaking (): Promise<StakingJson> {
    return new Promise<StakingJson>((resolve, reject) => {
      state.getStaking((rs: StakingJson) => {
        resolve(rs);
      });
    });
  }

  private async subscribeStaking (id: string, port: chrome.runtime.Port): Promise<StakingJson | null> {
    const cb = createSubscription<'pri(staking.getSubscription)'>(id, port);
    const stakingSubscription = state.subscribeStaking().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      stakingSubscription.unsubscribe();
    });

    return this.getStaking();
  }

  // todo: add custom network metadata to here
  private networkMetadataList (): NetWorkMetadataDef[] {
    const result: NetWorkMetadataDef[] = [];

    Object.keys(NETWORKS).forEach((networkKey) => {
      const { chain, genesisHash, group, icon, isEthereum, paraId, ss58Format } = NETWORKS[networkKey];

      let isAvailable = true;

      // todo: add more logic in further update
      if (!genesisHash || genesisHash.toLowerCase() === 'unknown') {
        isAvailable = false;
      }

      result.push({
        chain,
        networkKey,
        genesisHash,
        icon: isEthereum ? 'ethereum' : (icon || 'polkadot'),
        ss58Format,
        group,
        isEthereum: !!isEthereum,
        paraId,
        isAvailable
      });
    });

    return result;
  }

  private apiInit ({ networkKey }: RequestApi): ApiInitStatus {
    const { apisMap } = bWindow.pdotApi;

    if (!rpcsMap.hasOwnProperty(networkKey) || !rpcsMap[networkKey]) {
      return ApiInitStatus.NOT_SUPPORT;
    }

    if (apisMap[networkKey]) {
      return ApiInitStatus.ALREADY_EXIST;
    }

    apisMap[networkKey] = initApi(rpcsMap[networkKey]);

    return ApiInitStatus.SUCCESS;
  }

  private getTransactionHistoryByMultiNetworks ({ address, networkKeys }: RequestTransactionHistoryGetByMultiNetworks, id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pri(transaction.history.getByMultiNetwork)'>(id, port);

    state.getTransactionHistoryByMultiNetworks(address, networkKeys, (items) => {
      cb(items);
    });

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
    });

    return true;
  }

  private getTransactionHistory ({ address, networkKey }: RequestTransactionHistoryGet, id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pri(transaction.history.get)'>(id, port);

    state.getTransactionHistory(address, networkKey, (items) => {
      cb(items);
    });

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
    });

    return true;
  }

  private updateTransactionHistory ({ address, item, networkKey }: RequestTransactionHistoryAdd, id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pri(transaction.history.add)'>(id, port);

    state.setTransactionHistory(address, networkKey, item, (items) => {
      cb(items);
    });

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
    });

    return true;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public override async handle<TMessageType extends MessageTypes> (id: string, type: TMessageType, request: RequestTypes[TMessageType], port: chrome.runtime.Port): Promise<ResponseType<TMessageType>> {
    switch (type) {
      case 'pri(api.init)':
        return this.apiInit(request as RequestApi);
      case 'pri(accounts.create.suriV2)':
        return this.accountsCreateSuriV2(request as RequestAccountCreateSuri);
      case 'pri(accounts.subscribeWithCurrentAddress)':
        return this.accountsGetAllWithCurrentAddress(id, port);
      case 'pri(accounts.triggerSubscription)':
        return this.triggerAccountsSubscription();
      case 'pri(currentAccount.saveAddress)':
        return this.saveCurrentAccountAddress(request as RequestCurrentAccountAddress);
      case 'pri(price.getPrice)':
        return await this.getPrice();
      case 'pri(price.getSubscription)':
        return await this.subscribePrice(id, port);
      case 'pri(balance.getBalance)':
        return this.getBalance();
      case 'pri(balance.getSubscription)':
        return this.subscribeBalance(id, port);
      case 'pri(crowdloan.getCrowdloan)':
        return this.getCrowdloan();
      case 'pri(crowdloan.getSubscription)':
        return this.subscribeCrowdloan(id, port);
      case 'pri(derivation.createV2)':
        return this.derivationCreateV2(request as RequestDeriveCreate);
      case 'pri(json.restoreV2)':
        return this.jsonRestoreV2(request as RequestJsonRestore);
      case 'pri(json.batchRestoreV2)':
        return this.batchRestoreV2(request as RequestBatchRestore);
      case 'pri(networkMetadata.list)':
        return this.networkMetadataList();
      case 'pri(chainRegistry.getSubscription)':
        return this.subscribeChainRegistry(id, port);
      case 'pri(nft.getNft)':
        return await this.getNft();
      case 'pri(nft.getSubscription)':
        return await this.subscribeNft(id, port);
      case 'pri(staking.getStaking)':
        return await this.getStaking();
      case 'pri(staking.getSubscription)':
        return await this.subscribeStaking(id, port);
      case 'pri(transaction.history.add)':
        return this.updateTransactionHistory(request as RequestTransactionHistoryAdd, id, port);
      case 'pri(transaction.history.get)':
        return this.getTransactionHistory(request as RequestTransactionHistoryGet, id, port);
      case 'pri(transaction.history.getByMultiNetwork)':
        return this.getTransactionHistoryByMultiNetworks(request as RequestTransactionHistoryGetByMultiNetworks, id, port);
      default:
        return super.handle(id, type, request, port);
    }
  }
}
