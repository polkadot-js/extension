// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Extension, { SEED_DEFAULT_LENGTH, SEED_LENGTHS } from '@polkadot/extension-base/background/handlers/Extension';
import { createSubscription, unsubscribe } from '@polkadot/extension-base/background/handlers/subscriptions';
import { AccountsWithCurrentAddress, ApiInitStatus, BackgroundWindow, BalanceJson, ChainRegistry, CrowdloanJson, NetWorkMetadataDef, NftCollection, NftItem, NftJson, NftTransferExtra, PriceJson, RequestAccountCreateSuriV2, RequestAccountExportPrivateKey, RequestApi, RequestNftForceUpdate, RequestSeedCreateV2, RequestSeedValidateV2, RequestTransactionHistoryAdd, ResponseAccountCreateSuriV2, ResponseAccountExportPrivateKey, ResponseSeedCreateV2, ResponseSeedValidateV2, StakingJson, StakingRewardJson, TransactionHistoryItemType } from '@polkadot/extension-base/background/KoniTypes';
import { AccountJson, MessageTypes, RequestAccountCreateSuri, RequestAccountForget, RequestBatchRestore, RequestCurrentAccountAddress, RequestDeriveCreate, RequestJsonRestore, RequestTypes, ResponseType } from '@polkadot/extension-base/background/types';
import { initApi } from '@polkadot/extension-koni-base/api/dotsama';
import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';
import { rpcsMap, state } from '@polkadot/extension-koni-base/background/handlers/index';
import { ALL_ACCOUNT_KEY } from '@polkadot/extension-koni-base/constants';
import { createPair } from '@polkadot/keyring';
import { decodePair } from '@polkadot/keyring/pair/decode';
import { KeyringPair, KeyringPair$Json, KeyringPair$Meta } from '@polkadot/keyring/types';
import keyring from '@polkadot/ui-keyring';
import { accounts as accountsObservable } from '@polkadot/ui-keyring/observable/accounts';
import { SubjectInfo } from '@polkadot/ui-keyring/observable/types';
import { assert, hexToU8a, isHex, u8aToHex, u8aToString } from '@polkadot/util';
import { base64Decode, jsonDecrypt, keyExtractSuri, mnemonicGenerate, mnemonicValidate } from '@polkadot/util-crypto';
import { EncryptedJson, KeypairType, Prefix } from '@polkadot/util-crypto/types';

const bWindow = window as unknown as BackgroundWindow;

const ETH_DERIVE_DEFAULT = '/m/44\'/60\'/0\'/0/0';

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

  private accountExportPrivateKey ({ address, password }: RequestAccountExportPrivateKey): ResponseAccountExportPrivateKey {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const exportedJson = keyring.backupAccount(keyring.getPair(address), password);
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const decoded = decodePair(password, base64Decode(exportedJson.encoded), exportedJson.encoding.type);

    return {
      privateKey: u8aToHex(decoded.secretKey)
    };
  }

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

  private async accountsCreateSuriV2 ({ genesisHash, name, password, suri: _suri, types }: RequestAccountCreateSuriV2): Promise<ResponseAccountCreateSuriV2> {
    const addressDict = {} as Record<KeypairType, string>;

    types?.forEach((type) => {
      const suri = getSuri(_suri, type);
      const address = keyring.createFromUri(suri, {}, type).address;

      addressDict[type] = address;
      const newAccountName = type === 'ethereum' ? `${name} - EVM` : name;

      this._saveCurrentAccountAddress(address, () => {
        keyring.addUri(suri, password, { genesisHash, name: newAccountName }, type);
      });
    });

    await new Promise<void>((resolve) => {
      state.addAccountRef(Object.values(addressDict), () => {
        resolve();
      });
    });

    return addressDict;
  }

  private async accountsForgetOverride ({ address }: RequestAccountForget): Promise<boolean> {
    keyring.forgetAccount(address);
    await new Promise<void>((resolve) => {
      state.removeAccountRef(address, () => {
        resolve();
      });
    });

    return true;
  }

  private seedCreateV2 ({ length = SEED_DEFAULT_LENGTH, seed: _seed, types }: RequestSeedCreateV2): ResponseSeedCreateV2 {
    const seed = _seed || mnemonicGenerate(length);
    const rs = { seed: seed, addressMap: {} } as ResponseSeedCreateV2;

    types?.forEach((type) => {
      rs.addressMap[type] = keyring.createFromUri(getSuri(seed, type), {}, type).address;
    });

    console.log('linkMapOK');

    state.getAccountRefMap((map) => {
      console.log('linkMap', map);
    });

    return rs;
  }

  private seedValidateV2 ({ suri, types }: RequestSeedValidateV2): ResponseSeedValidateV2 {
    const { phrase } = keyExtractSuri(suri);

    if (isHex(phrase)) {
      assert(isHex(phrase, 256), 'Hex seed needs to be 256-bits');
    } else {
      // sadly isHex detects as string, so we need a cast here
      assert(SEED_LENGTHS.includes((phrase).split(' ').length), `Mnemonic needs to contain ${SEED_LENGTHS.join(', ')} words`);
      assert(mnemonicValidate(phrase), 'Not a valid mnemonic seed');
    }

    const rs = { seed: suri, addressMap: {} } as ResponseSeedValidateV2;

    types && types.forEach((type) => {
      rs.addressMap[type] = keyring.createFromUri(getSuri(suri, type), {}, type).address;
    });

    return rs;
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

  private getNftTransfer (): Promise<NftTransferExtra> {
    return new Promise<NftTransferExtra>((resolve, reject) => {
      state.getNftTransferSubscription((rs: NftTransferExtra) => {
        resolve(rs);
      });
    });
  }

  private async subscribeNftTransfer (id: string, port: chrome.runtime.Port): Promise<NftTransferExtra> {
    const cb = createSubscription<'pri(nftTransfer.getSubscription)'>(id, port);
    const nftTransferSubscription = state.subscribeNftTransfer().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      nftTransferSubscription.unsubscribe();
    });

    return this.getNftTransfer();
  }

  private getNft (): Promise<NftJson> {
    return new Promise<NftJson>((resolve, reject) => {
      state.getNftSubscription((rs: NftJson) => {
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

  private getStakingReward (): Promise<StakingRewardJson> {
    return new Promise<StakingRewardJson>((resolve, reject) => {
      state.getStakingReward((rs: StakingRewardJson) => {
        resolve(rs);
      });
    });
  }

  private subscribeStakingReward (id: string, port: chrome.runtime.Port): Promise<StakingRewardJson | null> {
    const cb = createSubscription<'pri(stakingReward.getSubscription)'>(id, port);
    const stakingRewardSubscription = state.subscribeStakingReward().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      stakingRewardSubscription.unsubscribe();
    });

    return this.getStakingReward();
  }

  private getStaking (): StakingJson {
    return state.getStaking();
  }

  private subscribeStaking (id: string, port: chrome.runtime.Port): StakingJson {
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
      const { chain, genesisHash, groups, icon, isEthereum, paraId, ss58Format } = NETWORKS[networkKey];

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
        groups,
        isEthereum: !!isEthereum,
        paraId,
        isAvailable
      });
    });

    return result;
  }

  private apiInit ({ networkKey }: RequestApi): ApiInitStatus {
    const { apisMap } = bWindow.pdotApi;

    // eslint-disable-next-line no-prototype-builtins
    if (!rpcsMap.hasOwnProperty(networkKey) || !rpcsMap[networkKey]) {
      console.log('not support');

      return ApiInitStatus.NOT_SUPPORT;
    }

    if (apisMap[networkKey]) {
      console.log('existed');

      return ApiInitStatus.ALREADY_EXIST;
    }

    apisMap[networkKey] = initApi(networkKey, rpcsMap[networkKey]);

    return ApiInitStatus.SUCCESS;
  }

  private subscribeHistory (id: string, port: chrome.runtime.Port): Record<string, TransactionHistoryItemType[]> {
    const cb = createSubscription<'pri(transaction.history.getSubscription)'>(id, port);

    const historySubscription = state.subscribeHistory().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      historySubscription.unsubscribe();
    });

    return state.getHistoryMap();
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

  private setNftTransfer (request: NftTransferExtra): boolean {
    state.setNftTransfer(request);

    return true;
  }

  private forceUpdateNftState (request: RequestNftForceUpdate): boolean {
    let selectedNftCollection: NftCollection = { collectionId: '' };
    const nftJson = state.getNft();
    const oldTotal = nftJson.total;
    const newNftList: NftCollection[] = [];

    if (!request.isSendingSelf) {
      for (const collection of nftJson.nftList) {
        if (collection.collectionId === request.collectionId) {
          // @ts-ignore
          // eslint-disable-next-line array-callback-return
          const filtered: NftItem[] = [];

          collection.nftItems?.forEach((item) => {
            if (item.id !== request.nft.id) {
              filtered.push(item);
            }
          });

          selectedNftCollection = {
            collectionId: collection.collectionId,
            collectionName: collection.collectionName,
            image: collection.image,
            nftItems: filtered
          } as NftCollection;

          if (filtered.length > 0) {
            newNftList.push(selectedNftCollection);
          }
        } else { newNftList.push(collection); }
      }

      state.setNft({
        ready: true,
        total: oldTotal - 1,
        nftList: newNftList
      } as NftJson);
    } else {
      for (const collection of nftJson.nftList) {
        if (collection.collectionId === request.collectionId) {
          selectedNftCollection = collection;
          break;
        }
      }
    }

    state.setNftTransfer({
      cronUpdate: false,
      forceUpdate: true,
      selectedNftCollection
    });

    console.log('force update nft state done');

    return true;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public override async handle<TMessageType extends MessageTypes> (id: string, type: TMessageType, request: RequestTypes[TMessageType], port: chrome.runtime.Port): Promise<ResponseType<TMessageType>> {
    switch (type) {
      case 'pri(api.init)':
        return this.apiInit(request as RequestApi);
      case 'pri(accounts.create.suriV2)':
        return await this.accountsCreateSuriV2(request as RequestAccountCreateSuri);
      case 'pri(accounts.forget)':
        return await this.accountsForgetOverride(request as RequestAccountForget);
      case 'pri(seed.createV2)':
        return this.seedCreateV2(request as RequestSeedCreateV2);
      case 'pri(seed.validateV2)':
        return this.seedValidateV2(request as RequestSeedValidateV2);
      case 'pri(accounts.exportPrivateKey)':
        return this.accountExportPrivateKey(request as RequestAccountExportPrivateKey);
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
        return this.getStaking();
      case 'pri(staking.getSubscription)':
        return this.subscribeStaking(id, port);
      case 'pri(stakingReward.getStakingReward)':
        return this.getStakingReward();
      case 'pri(stakingReward.getSubscription)':
        return this.subscribeStakingReward(id, port);
      case 'pri(transaction.history.add)':
        return this.updateTransactionHistory(request as RequestTransactionHistoryAdd, id, port);
      case 'pri(transaction.history.getSubscription)':
        return this.subscribeHistory(id, port);
      case 'pri(nft.forceUpdate)':
        return this.forceUpdateNftState(request as RequestNftForceUpdate);
      case 'pri(nftTransfer.getNftTransfer)':
        return this.getNftTransfer();
      case 'pri(nftTransfer.getSubscription)':
        return this.subscribeNftTransfer(id, port);
      case 'pri(nftTransfer.setNftTransfer)':
        return this.setNftTransfer(request as NftTransferExtra);
      default:
        return super.handle(id, type, request, port);
    }
  }
}
