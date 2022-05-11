// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Common from '@ethereumjs/common';
import { Transaction } from 'ethereumjs-tx';
import { Contract } from 'web3-eth-contract';

import Extension, { SEED_DEFAULT_LENGTH, SEED_LENGTHS } from '@polkadot/extension-base/background/handlers/Extension';
import { AuthUrls } from '@polkadot/extension-base/background/handlers/State';
import { createSubscription, isSubscriptionRunning, unsubscribe } from '@polkadot/extension-base/background/handlers/subscriptions';
import { AccountsWithCurrentAddress, ApiInitStatus, BackgroundWindow, BalanceJson, ChainRegistry, CrowdloanJson, CustomEvmToken, DeleteEvmTokenParams, EvmNftSubmitTransaction, EvmNftTransaction, EvmNftTransactionRequest, EvmNftTransactionResponse, EvmTokenJson, NetWorkMetadataDef, NftCollection, NftCollectionJson, NftItem, NftJson, NftTransferExtra, OptionInputAddress, PriceJson, RequestAccountCreateSuriV2, RequestAccountExportPrivateKey, RequestApi, RequestAuthorization, RequestAuthorizationPerAccount, RequestAuthorizeApproveV2, RequestCheckTransfer, RequestForgetSite, RequestFreeBalance, RequestNftForceUpdate, RequestSaveRecentAccount, RequestSeedCreateV2, RequestSeedValidateV2, RequestSettingsType, RequestTransactionHistoryAdd, RequestTransfer, RequestTransferCheckReferenceCount, RequestTransferCheckSupporting, RequestTransferExistentialDeposit, ResponseAccountCreateSuriV2, ResponseAccountExportPrivateKey, ResponseCheckTransfer, ResponseSeedCreateV2, ResponseSeedValidateV2, ResponseTransfer, StakingJson, StakingRewardJson, SupportTransferResponse, TokenInfo, TransactionHistoryItemType, TransferError, TransferErrorCode, TransferStep, ValidateEvmTokenRequest, ValidateEvmTokenResponse } from '@polkadot/extension-base/background/KoniTypes';
import { AccountJson, AuthorizeRequest, MessageTypes, RequestAccountCreateSuri, RequestAccountForget, RequestAuthorizeReject, RequestBatchRestore, RequestCurrentAccountAddress, RequestDeriveCreate, RequestJsonRestore, RequestTypes, ResponseAuthorizeList, ResponseType } from '@polkadot/extension-base/background/types';
import { initApi } from '@polkadot/extension-koni-base/api/dotsama';
import { getFreeBalance, subscribeFreeBalance } from '@polkadot/extension-koni-base/api/dotsama/balance';
import { getTokenInfo } from '@polkadot/extension-koni-base/api/dotsama/registry';
import { checkReferenceCount, checkSupportTransfer, estimateFee, getExistentialDeposit, makeTransfer } from '@polkadot/extension-koni-base/api/dotsama/transfer';
import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';
import { TRANSFER_CHAIN_ID } from '@polkadot/extension-koni-base/api/nft/config';
import { getERC20TransactionObject, getEVMTransactionObject, makeERC20Transfer, makeEVMTransfer } from '@polkadot/extension-koni-base/api/web3/transfer';
import { getERC20Contract, getERC721Contract, getWeb3Api, TestERC721Contract } from '@polkadot/extension-koni-base/api/web3/web3';
import { dotSamaAPIMap, rpcsMap, state } from '@polkadot/extension-koni-base/background/handlers/index';
import { ALL_ACCOUNT_KEY } from '@polkadot/extension-koni-base/constants';
import { reformatAddress } from '@polkadot/extension-koni-base/utils/utils';
import { createPair } from '@polkadot/keyring';
import { decodePair } from '@polkadot/keyring/pair/decode';
import { KeyringPair, KeyringPair$Json, KeyringPair$Meta } from '@polkadot/keyring/types';
import keyring from '@polkadot/ui-keyring';
import { accounts as accountsObservable } from '@polkadot/ui-keyring/observable/accounts';
import { SingleAddress, SubjectInfo } from '@polkadot/ui-keyring/observable/types';
import { assert, BN, hexToU8a, isHex, u8aToHex, u8aToString } from '@polkadot/util';
import { base64Decode, isEthereumAddress, jsonDecrypt, keyExtractSuri, mnemonicGenerate, mnemonicValidate } from '@polkadot/util-crypto';
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
  private cancelSubscriptionMap: Record<string, () => void> = {};

  private cancelSubscription (id: string): boolean {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    if (isSubscriptionRunning(id)) {
      unsubscribe(id);
    }

    if (this.cancelSubscriptionMap[id]) {
      this.cancelSubscriptionMap[id]();

      delete this.cancelSubscriptionMap[id];
    }

    return true;
  }

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

  private accountsGetAll (id: string, port: chrome.runtime.Port): string {
    const cb = createSubscription<'pri(accounts.subscribeAccountsInputAddress)'>(id, port);
    const subscription = keyring.keyringOption.optionsSubject.subscribe((options): void => {
      const optionsInputAddress: OptionInputAddress = {
        options
      };

      cb(optionsInputAddress);
    });

    this.cancelSubscriptionMap[id] = subscription.unsubscribe;

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return id;
  }

  private saveRecentAccountId ({ accountId }: RequestSaveRecentAccount): SingleAddress {
    return keyring.saveRecent(accountId);
  }

  private triggerAccountsSubscription (): boolean {
    const accountsSubject = accountsObservable.subject;

    accountsSubject.next(accountsSubject.getValue());

    return true;
  }

  private _getAuthListV2 (): Promise<AuthUrls> {
    return new Promise<AuthUrls>((resolve, reject) => {
      state.getAuthorize((rs: AuthUrls) => {
        const accounts = accountsObservable.subject.getValue();
        const addressList = Object.keys(accounts).filter((address) => accounts[address].type !== 'ethereum');
        const urlList = Object.keys(rs);

        if (Object.keys(rs[urlList[0]].isAllowedMap).toString() !== addressList.toString()) {
          urlList.forEach((url) => {
            addressList.forEach((address) => {
              if (!Object.keys(rs[url].isAllowedMap).includes(address)) {
                rs[url].isAllowedMap[address] = false;
              }
            });

            Object.keys(rs[url].isAllowedMap).forEach((address) => {
              if (!addressList.includes(address)) {
                delete rs[url].isAllowedMap[address];
              }
            });
          });

          state.setAuthorize(rs);
        }

        resolve(rs);
      });
    });
  }

  private authorizeSubscribeV2 (id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pri(authorize.requestsV2)'>(id, port);
    const subscription = state.authSubjectV2.subscribe((requests: AuthorizeRequest[]): void =>
      cb(requests)
    );

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      subscription.unsubscribe();
    });

    return true;
  }

  private async getAuthListV2 (): Promise<ResponseAuthorizeList> {
    const authList = await this._getAuthListV2();

    return { list: authList };
  }

  private authorizeApproveV2 ({ accounts, id }: RequestAuthorizeApproveV2): boolean {
    const queued = state.getAuthRequestV2(id);

    assert(queued, 'Unable to find request');

    const { resolve } = queued;

    resolve({ accounts, result: true });

    return true;
  }

  private authorizeRejectV2 ({ id }: RequestAuthorizeReject): boolean {
    const queued = state.getAuthRequestV2(id);

    assert(queued, 'Unable to find request');

    const { reject } = queued;

    reject(new Error('Rejected'));

    return true;
  }

  private _forgetSite (url: string, callBack?: (value: AuthUrls) => void) {
    state.getAuthorize((value) => {
      assert(value, 'The source is not known');

      delete value[url];

      state.setAuthorize(value, () => {
        callBack && callBack(value);
      });
    });
  }

  private forgetSite (data: RequestForgetSite, id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pri(authorize.forgetSite)'>(id, port);

    this._forgetSite(data.url, (items) => {
      cb(items);
    });

    return true;
  }

  private _forgetAllSite (callBack?: (value: AuthUrls) => void) {
    state.getAuthorize((value) => {
      assert(value, 'The source is not known');

      value = {};

      state.setAuthorize(value, () => {
        callBack && callBack(value);
      });
    });
  }

  private forgetAllSite (id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pri(authorize.forgetAllSite)'>(id, port);

    this._forgetAllSite((items) => {
      cb(items);
    });

    return true;
  }

  private _changeAuthorizationAll (connectValue: boolean, callBack?: (value: AuthUrls) => void) {
    state.getAuthorize((value) => {
      assert(value, 'The source is not known');

      Object.keys(value).forEach((url) => {
        // eslint-disable-next-line no-return-assign
        Object.keys(value[url].isAllowedMap).forEach((address) => value[url].isAllowedMap[address] = connectValue);
      });
      state.setAuthorize(value, () => {
        callBack && callBack(value);
      });
    });
  }

  private changeAuthorizationAll (data: RequestAuthorization, id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pri(authorize.changeSite)'>(id, port);

    this._changeAuthorizationAll(data.connectValue, (items) => {
      cb(items);
    });

    return true;
  }

  private _changeAuthorization (url: string, connectValue: boolean, callBack?: (value: AuthUrls) => void) {
    state.getAuthorize((value) => {
      assert(value, 'The source is not known');

      // eslint-disable-next-line no-return-assign
      Object.keys(value[url].isAllowedMap).forEach((address) => value[url].isAllowedMap[address] = connectValue);
      state.setAuthorize(value, () => {
        callBack && callBack(value);
      });
    });
  }

  private changeAuthorization (data: RequestAuthorization, id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pri(authorize.changeSite)'>(id, port);

    this._changeAuthorization(data.url, data.connectValue, (items) => {
      cb(items);
    });

    return true;
  }

  private _changeAuthorizationPerAcc (address: string, connectValue: boolean, url: string, callBack?: (value: AuthUrls) => void) {
    state.getAuthorize((value) => {
      assert(value, 'The source is not known');

      value[url].isAllowedMap[address] = connectValue;
      state.setAuthorize(value, () => {
        callBack && callBack(value);
      });
    });
  }

  private changeAuthorizationPerAcc (data: RequestAuthorizationPerAccount, id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pri(authorize.changeSitePerAccount)'>(id, port);

    this._changeAuthorizationPerAcc(data.address, data.connectValue, data.url, (items) => {
      cb(items);
    });

    return true;
  }

  private getSettings (): Promise<RequestSettingsType> {
    return new Promise<RequestSettingsType>((resolve, reject) => {
      state.getSettings((rs) => {
        resolve(rs);
      });
    });
  }

  private toggleBalancesVisibility (id: string, port: chrome.runtime.Port) {
    const cb = createSubscription<'pri(currentAccount.changeBalancesVisibility)'>(id, port);

    state.getSettings((value) => {
      const updateValue = {
        ...value,
        isShowBalance: !value.isShowBalance
      };

      state.setSettings(updateValue, () => {
        // eslint-disable-next-line node/no-callback-literal
        cb(updateValue);
      });
    });

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
    });

    return true;
  }

  private async subscribeSettings (id: string, port: chrome.runtime.Port) {
    const cb = createSubscription<'pri(currentAccount.subscribeSettings)'>(id, port);

    const balancesVisibilitySubscription = state.subscribeSettingsSubject().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      balancesVisibilitySubscription.unsubscribe();
    });

    return await this.getSettings();
  }

  private saveAccountAllLogo (data: string, id: string, port: chrome.runtime.Port) {
    const cb = createSubscription<'pri(currentAccount.saveAccountAllLogo)'>(id, port);

    state.getSettings((value) => {
      const updateValue = {
        ...value,
        accountAllLogo: data
      };

      state.setSettings(updateValue, () => {
        // eslint-disable-next-line node/no-callback-literal
        cb(updateValue);
      });
    });

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
    });

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

  private saveCurrentAccountAddress (data: RequestCurrentAccountAddress, id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pri(currentAccount.saveAddress)'>(id, port);

    this._saveCurrentAccountAddress(data.address, () => {
      cb(data);
    });

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
    });

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

  private _addAddressToAuthList (address: string): void {
    state.getAuthorize((value) => {
      if (value && Object.keys(value).length) {
        Object.keys(value).forEach((url) => {
          value[url].isAllowedMap[address] = false;
        });

        state.setAuthorize(value);
      }
    });
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
        this._addAddressToAuthList(address);
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

    state.getAuthorize((value) => {
      if (value && Object.keys(value).length) {
        Object.keys(value).forEach((url) => {
          delete value[url].isAllowedMap[address];
        });

        state.setAuthorize(value);
      }
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
      this._addAddressToAuthList(address);
    });

    return true;
  }

  private jsonRestoreV2 ({ address, file, password }: RequestJsonRestore): void {
    const isPasswordValidated = this.validatePassword(file, password);

    if (isPasswordValidated) {
      try {
        this._saveCurrentAccountAddress(address, () => {
          keyring.restoreAccount(file, password);
          this._addAddressToAuthList(address);
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

  private getNftCollection (): Promise<NftCollectionJson> {
    return new Promise<NftCollectionJson>((resolve) => {
      state.getNftCollectionSubscription((rs: NftCollectionJson) => {
        resolve(rs);
      });
    });
  }

  private subscribeNftCollection (id: string, port: chrome.runtime.Port): Promise<NftCollectionJson | null> {
    const cb = createSubscription<'pri(nftCollection.getSubscription)'>(id, port);
    const nftCollectionSubscription = state.subscribeNftCollection().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      nftCollectionSubscription.unsubscribe();
    });

    return this.getNftCollection();
  }

  private getNft (): Promise<NftJson> {
    return new Promise<NftJson>((resolve) => {
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
    const nftCollectionJson = state.getNftCollection();
    const filteredCollections: NftCollection[] = [];
    const filteredItems: NftItem[] = [];
    const remainedItems: NftItem[] = [];
    let itemCount = 0; // count item left in collection

    for (const collection of nftCollectionJson.nftCollectionList) {
      if (collection.chain === request.chain && collection.collectionId === request.collectionId) {
        selectedNftCollection = collection;
        break;
      }
    }

    if (!request.isSendingSelf) {
      for (const item of nftJson.nftList) {
        if (item.chain === request.chain && item.collectionId === request.collectionId) {
          if (item.id !== request.nft.id) {
            itemCount += 1;
            filteredItems.push(item);
            remainedItems.push(item);
          }
        } else {
          filteredItems.push(item);
        }
      }

      state.setNft({
        nftList: filteredItems
      } as NftJson);

      if (itemCount <= 0) {
        for (const collection of nftCollectionJson.nftCollectionList) {
          if (collection.chain !== request.chain || collection.collectionId !== request.collectionId) {
            filteredCollections.push(collection);
          }
        }

        state.setNftCollection({
          ready: true,
          nftCollectionList: filteredCollections
        } as NftCollectionJson);
      }
    } else {
      for (const item of nftJson.nftList) {
        if (item.chain === request.chain && item.collectionId === request.collectionId) {
          remainedItems.push(item);
        }
      }
    }

    state.setNftTransfer({
      cronUpdate: false,
      forceUpdate: true,
      selectedNftCollection,
      nftItems: remainedItems
    });

    console.log('force update nft state done');

    return true;
  }

  private async validateTransfer (networkKey: string, token: string | undefined, from: string, to: string, password: string | undefined, value: string | undefined, transferAll: boolean | undefined): Promise<[Array<TransferError>, KeyringPair | undefined, BN | undefined, TokenInfo | undefined]> {
    const errors = [] as Array<TransferError>;
    let keypair: KeyringPair | undefined;
    let transferValue;

    if (!transferAll) {
      try {
        if (value === undefined) {
          errors.push({
            code: TransferErrorCode.INVALID_VALUE,
            message: 'Require transfer value'
          });
        }

        if (value) {
          transferValue = new BN(value);
        }
      } catch (e) {
        errors.push({
          code: TransferErrorCode.INVALID_VALUE,
          // @ts-ignore
          message: String(e.message)
        });
      }
    }

    try {
      keypair = keyring.getPair(from);

      if (password) {
        keypair.unlock(password);
      }
    } catch (e) {
      errors.push({
        code: TransferErrorCode.KEYRING_ERROR,
        // @ts-ignore
        message: String(e.message)
      });
    }

    let tokenInfo: TokenInfo | undefined;

    if (token) {
      tokenInfo = await getTokenInfo(networkKey, dotSamaAPIMap[networkKey].api, token);

      if (!tokenInfo) {
        errors.push({
          code: TransferErrorCode.INVALID_TOKEN,
          message: 'Not found token from registry'
        });
      }

      if (isEthereumAddress(from) && isEthereumAddress(to) && !tokenInfo?.isMainToken && !(tokenInfo?.erc20Address)) {
        errors.push({
          code: TransferErrorCode.INVALID_TOKEN,
          message: 'Not found ERC20 address for this token'
        });
      }
    }

    return [errors, keypair, transferValue, tokenInfo];
  }

  private async checkTransfer ({ from, networkKey, to, token, transferAll, value }: RequestCheckTransfer): Promise<ResponseCheckTransfer> {
    const [errors, fromKeyPair, valueNumber, tokenInfo] = await this.validateTransfer(networkKey, token, from, to, undefined, value, transferAll);

    let fee = '0';
    let feeSymbol;
    let fromAccountFree = '0';
    let toAccountFree = '0';

    if (isEthereumAddress(from) && isEthereumAddress(to)) {
      [fromAccountFree, toAccountFree] = await Promise.all(
        [getFreeBalance(networkKey, from, token), getFreeBalance(networkKey, to, token)]
      );
      const txVal: string = transferAll ? fromAccountFree : (value || '0');

      // Estimate with EVM API
      if (tokenInfo && !tokenInfo.isMainToken && tokenInfo.erc20Address) {
        [,, fee] = await getERC20TransactionObject(tokenInfo.erc20Address, networkKey, from, to, txVal, !!transferAll);
      } else {
        [,, fee] = await getEVMTransactionObject(networkKey, to, txVal, !!transferAll);
      }
    } else {
      // Estimate with DotSama API
      [[fee, feeSymbol], fromAccountFree, toAccountFree] = await Promise.all(
        [
          estimateFee(networkKey, fromKeyPair, to, value, !!transferAll, tokenInfo),
          getFreeBalance(networkKey, from, token),
          getFreeBalance(networkKey, to, token)
        ]
      );
    }

    const fromAccountFreeNumber = new BN(fromAccountFree);
    const feeNumber = fee ? new BN(fee) : undefined;

    if (!transferAll && value && feeNumber && valueNumber) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      if (fromAccountFreeNumber.lt(feeNumber.add(valueNumber))) {
        errors.push({
          code: TransferErrorCode.NOT_ENOUGH_VALUE,
          message: 'Not enough balance free to make transfer'
        });
      }
    }

    return {
      errors,
      fromAccountFree: fromAccountFree,
      toAccountFree: toAccountFree,
      estimateFee: fee,
      feeSymbol
    } as ResponseCheckTransfer;
  }

  private makeTransferCallback (
    address: string,
    networkKey: string,
    token: string | undefined,
    portCallback: (res: ResponseTransfer) => void): (res: ResponseTransfer) => void {
    return (res: ResponseTransfer) => {
      // !res.isFinalized to prevent duplicate action
      if (!res.isFinalized && res.txResult && res.extrinsicHash) {
        state.setTransactionHistory(address, networkKey, {
          time: Date.now(),
          networkKey,
          change: res.txResult.change,
          changeSymbol: res.txResult.changeSymbol || token,
          fee: res.txResult.fee,
          feeSymbol: res.txResult.feeSymbol,
          isSuccess: res.step.valueOf() === TransferStep.SUCCESS.valueOf(),
          action: 'send',
          extrinsicHash: res.extrinsicHash
        });
      }

      portCallback(res);
    };
  }

  private async makeTransfer (id: string, port: chrome.runtime.Port, { from, networkKey, password, to, token, transferAll, value }: RequestTransfer): Promise<Array<TransferError>> {
    const cb = createSubscription<'pri(accounts.transfer)'>(id, port);
    const [errors, fromKeyPair, , tokenInfo] = await this.validateTransfer(networkKey, token, from, to, password, value, transferAll);

    if (errors.length) {
      setTimeout(() => {
        this.cancelSubscription(id);
      }, 500);

      // todo: add condition to lock KeyPair (for example: not remember password)
      fromKeyPair && fromKeyPair.lock();

      return errors;
    }

    if (fromKeyPair) {
      let transferProm: Promise<void> | undefined;

      if (isEthereumAddress(from) && isEthereumAddress(to)) {
        // Make transfer with EVM API
        const { privateKey } = this.accountExportPrivateKey({ address: from, password });

        if (tokenInfo && !tokenInfo.isMainToken && tokenInfo.erc20Address) {
          transferProm = makeERC20Transfer(
            tokenInfo.erc20Address, networkKey, from, to, privateKey, value || '0', !!transferAll,
            this.makeTransferCallback(from, networkKey, token, cb)
          );
        } else {
          transferProm = makeEVMTransfer(
            networkKey, to, privateKey, value || '0', !!transferAll,
            this.makeTransferCallback(from, networkKey, token, cb)
          );
        }
      } else {
        // Make transfer with Dotsama API
        transferProm = makeTransfer(
          networkKey, to, fromKeyPair, value || '0', !!transferAll, tokenInfo,
          this.makeTransferCallback(from, networkKey, token, cb)
        );
      }

      transferProm.then(() => {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Start transfer ${transferAll ? 'all' : value} from ${from} to ${to}`);

        // todo: add condition to lock KeyPair
        fromKeyPair.lock();
      })
        .catch((e) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,node/no-callback-literal,@typescript-eslint/no-unsafe-member-access
          cb({ step: TransferStep.ERROR, errors: [({ code: TransferErrorCode.TRANSFER_ERROR, message: e.message })] });
          console.error('Transfer error', e);
          setTimeout(() => {
            unsubscribe(id);
          }, 500);

          // todo: add condition to lock KeyPair
          fromKeyPair.lock();
        });
    }

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
    });

    return errors;
  }

  private async evmNftGetTransaction ({ networkKey, params, recipientAddress, senderAddress }: EvmNftTransactionRequest): Promise<EvmNftTransaction> {
    const contractAddress = params.contractAddress as string;
    const tokenId = params.tokenId as string;

    try {
      const web3 = getWeb3Api(networkKey);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const contract = new web3.eth.Contract(TestERC721Contract, contractAddress);

      const [fromAccountTxCount, gasPriceGwei] = await Promise.all([
        web3.eth.getTransactionCount(senderAddress),
        web3.eth.getGasPrice()
      ]);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
      const gasLimit = await contract.methods.safeTransferFrom(
        senderAddress,
        recipientAddress,
        tokenId
      ).estimateGas({
        from: senderAddress
      });

      const rawTransaction = {
        nonce: '0x' + fromAccountTxCount.toString(16),
        from: senderAddress,
        gasPrice: web3.utils.toHex(gasPriceGwei),
        gasLimit: web3.utils.toHex(gasLimit as number),
        to: contractAddress,
        value: '0x00',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
        data: contract.methods.safeTransferFrom(senderAddress, recipientAddress, tokenId).encodeABI()
      };
      // @ts-ignore
      const estimatedFee = (gasLimit * parseFloat(gasPriceGwei)) / (10 ** NETWORKS[networkKey].decimals);
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      const feeString = estimatedFee.toString() + ' ' + NETWORKS[networkKey].nativeToken;

      return {
        tx: rawTransaction,
        estimatedFee: feeString
      };
    } catch (e) {
      console.error('error handling web3 transfer nft', e);

      return {
        tx: null,
        estimatedFee: null
      };
    }
  }

  private async evmNftSubmitTransaction (id: string, port: chrome.runtime.Port, { networkKey, password, rawTransaction, recipientAddress, senderAddress }: EvmNftSubmitTransaction): Promise<EvmNftTransactionResponse> {
    const updateState = createSubscription<'pri(evmNft.submitTransaction)'>(id, port);
    let parsedPrivateKey = '';
    const txState = {
      isSendingSelf: reformatAddress(senderAddress, 1) === reformatAddress(recipientAddress, 1)
    } as EvmNftTransactionResponse;

    try {
      const { privateKey } = this.accountExportPrivateKey({ address: senderAddress, password });

      parsedPrivateKey = privateKey.slice(2);
      txState.passwordError = null;
      updateState(txState);
    } catch (e) {
      txState.passwordError = 'Error unlocking account with password';
      updateState(txState);

      port.onDisconnect.addListener((): void => {
        unsubscribe(id);
      });

      return txState;
    }

    try {
      const web3 = getWeb3Api(networkKey);

      const common = Common.forCustomChain('mainnet', {
        name: networkKey,
        networkId: TRANSFER_CHAIN_ID[networkKey],
        chainId: TRANSFER_CHAIN_ID[networkKey]
      }, 'petersburg');
      // @ts-ignore
      const tx = new Transaction(rawTransaction, { common });

      tx.sign(Buffer.from(parsedPrivateKey, 'hex'));
      const callHash = tx.serialize();

      txState.callHash = callHash.toString('hex');
      updateState(txState);

      await web3.eth.sendSignedTransaction('0x' + callHash.toString('hex'))
        .then((receipt: Record<string, any>) => {
          if (receipt.status) {
            txState.status = receipt.status as boolean;
          }

          if (receipt.transactionHash) {
            txState.transactionHash = receipt.transactionHash as string;
          }

          updateState(txState);
        });
    } catch (e) {
      console.error('transfer nft error', e);
      txState.txError = true;
      updateState(txState);
    }

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
    });

    return txState;
  }

  private subscribeEvmTokenState (id: string, port: chrome.runtime.Port): EvmTokenJson {
    const cb = createSubscription<'pri(evmTokenState.getSubscription)'>(id, port);

    const evmTokenSubscription = state.subscribeEvmToken().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      evmTokenSubscription.unsubscribe();
    });

    return state.getEvmTokenState();
  }

  private getEvmTokenState () {
    return state.getEvmTokenState();
  }

  private upsertEvmToken (data: CustomEvmToken) {
    state.upsertEvmToken(data);

    return true;
  }

  private deleteEvmToken (data: DeleteEvmTokenParams[]) {
    state.deleteEvmTokens(data);

    return true;
  }

  private async validateEvmToken (data: ValidateEvmTokenRequest): Promise<ValidateEvmTokenResponse> {
    const evmTokenState = state.getEvmTokenState();
    let isExist = false;

    for (const token of evmTokenState[data.type]) {
      if (token.smartContract === data.smartContract && token.type === data.type && token.chain === data.chain) {
        isExist = true;
        break;
      }
    }

    if (isExist) {
      return {
        name: '',
        symbol: '',
        isExist
      };
    }

    let tokenContract: Contract;
    let name: string;
    let decimals: number | undefined;
    let symbol: string;

    if (data.type === 'erc721') {
      tokenContract = getERC721Contract(data.chain, data.smartContract);

      const [_name, _symbol] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        tokenContract.methods.name().call() as string,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        tokenContract.methods.symbol().call() as string
      ]);

      name = _name;
      symbol = _symbol;
    } else {
      tokenContract = getERC20Contract(data.chain, data.smartContract);
      const [_name, _decimals, _symbol] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        tokenContract.methods.name().call() as string,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        tokenContract.methods.decimals().call() as number,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        tokenContract.methods.symbol().call() as string
      ]);

      name = _name;
      decimals = _decimals;
      symbol = _symbol;
    }

    return {
      name,
      decimals,
      symbol,
      isExist
    };
  }

  private async subscribeAddressFreeBalance ({ address, networkKey, token }: RequestFreeBalance, id: string, port: chrome.runtime.Port): Promise<string> {
    const cb = createSubscription<'pri(freeBalance.subscribe)'>(id, port);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
    this.cancelSubscriptionMap[id] = await subscribeFreeBalance(networkKey, address, token, cb);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return id;
  }

  private async transferCheckReferenceCount ({ address, networkKey }: RequestTransferCheckReferenceCount): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
    return await checkReferenceCount(networkKey, address);
  }

  private async transferCheckSupporting ({ networkKey, token }: RequestTransferCheckSupporting): Promise<SupportTransferResponse> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
    return await checkSupportTransfer(networkKey, token);
  }

  private async transferGetExistentialDeposit ({ networkKey, token }: RequestTransferExistentialDeposit): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
    return await getExistentialDeposit(networkKey, token);
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public override async handle<TMessageType extends MessageTypes> (id: string, type: TMessageType, request: RequestTypes[TMessageType], port: chrome.runtime.Port): Promise<ResponseType<TMessageType>> {
    switch (type) {
      case 'pri(api.init)':
        return this.apiInit(request as RequestApi);
      case 'pri(authorize.changeSiteAll)':
        return this.changeAuthorizationAll(request as RequestAuthorization, id, port);
      case 'pri(authorize.changeSite)':
        return this.changeAuthorization(request as RequestAuthorization, id, port);
      case 'pri(authorize.changeSitePerAccount)':
        return this.changeAuthorizationPerAcc(request as RequestAuthorizationPerAccount, id, port);
      case 'pri(authorize.forgetSite)':
        return this.forgetSite(request as RequestForgetSite, id, port);
      case 'pri(authorize.forgetAllSite)':
        return this.forgetAllSite(id, port);
      case 'pri(authorize.approveV2)':
        return this.authorizeApproveV2(request as RequestAuthorizeApproveV2);
      case 'pri(authorize.rejectV2)':
        return this.authorizeRejectV2(request as RequestAuthorizeReject);
      case 'pri(authorize.requestsV2)':
        return this.authorizeSubscribeV2(id, port);
      case 'pri(authorize.listV2)':
        return this.getAuthListV2();
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
      case 'pri(accounts.subscribeAccountsInputAddress)':
        return this.accountsGetAll(id, port);
      case 'pri(accounts.saveRecent)':
        return this.saveRecentAccountId(request as RequestSaveRecentAccount);
      case 'pri(accounts.triggerSubscription)':
        return this.triggerAccountsSubscription();
      case 'pri(currentAccount.saveAddress)':
        return this.saveCurrentAccountAddress(request as RequestCurrentAccountAddress, id, port);
      case 'pri(currentAccount.changeBalancesVisibility)':
        return this.toggleBalancesVisibility(id, port);
      case 'pri(currentAccount.subscribeSettings)':
        return this.subscribeSettings(id, port);
      case 'pri(currentAccount.saveAccountAllLogo)':
        return this.saveAccountAllLogo(request as string, id, port);
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
      case 'pri(nftCollection.getNftCollection)':
        return await this.getNftCollection();
      case 'pri(nftCollection.getSubscription)':
        return await this.subscribeNftCollection(id, port);
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
      case 'pri(accounts.checkTransfer)':
        return await this.checkTransfer(request as RequestCheckTransfer);
      case 'pri(accounts.transfer)':
        return await this.makeTransfer(id, port, request as RequestTransfer);
      case 'pri(evmNft.getTransaction)':
        return this.evmNftGetTransaction(request as EvmNftTransactionRequest);
      case 'pri(evmNft.submitTransaction)':
        return this.evmNftSubmitTransaction(id, port, request as EvmNftSubmitTransaction);
      case 'pri(evmTokenState.getSubscription)':
        return this.subscribeEvmTokenState(id, port);
      case 'pri(evmTokenState.getEvmTokenState)':
        return this.getEvmTokenState();
      case 'pri(evmTokenState.upsertEvmTokenState)':
        return this.upsertEvmToken(request as CustomEvmToken);
      case 'pri(evmTokenState.deleteMany)':
        return this.deleteEvmToken(request as DeleteEvmTokenParams[]);
      case 'pri(transfer.checkReferenceCount)':
        return await this.transferCheckReferenceCount(request as RequestTransferCheckReferenceCount);
      case 'pri(transfer.checkSupporting)':
        return await this.transferCheckSupporting(request as RequestTransferCheckSupporting);
      case 'pri(transfer.getExistentialDeposit)':
        return await this.transferGetExistentialDeposit(request as RequestTransferExistentialDeposit);
      case 'pri(freeBalance.subscribe)':
        return this.subscribeAddressFreeBalance(request as RequestFreeBalance, id, port);
      case 'pri(subscription.cancel)':
        return this.cancelSubscription(request as string);
      case 'pri(evmTokenState.validateEvmToken)':
        return await this.validateEvmToken(request as ValidateEvmTokenRequest);
      default:
        return super.handle(id, type, request, port);
    }
  }
}
