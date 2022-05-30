// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Common from '@ethereumjs/common';
import Extension, { SEED_DEFAULT_LENGTH, SEED_LENGTHS } from '@subwallet/extension-base/background/handlers/Extension';
import { AuthUrls } from '@subwallet/extension-base/background/handlers/State';
import { createSubscription, isSubscriptionRunning, unsubscribe } from '@subwallet/extension-base/background/handlers/subscriptions';
import { AccountsWithCurrentAddress, ApiProps, BalanceJson, ChainRegistry, CrowdloanJson, CustomEvmToken, DeleteEvmTokenParams, DisableNetworkResponse, EvmNftSubmitTransaction, EvmNftTransaction, EvmNftTransactionRequest, EvmTokenJson, NETWORK_ERROR, NetWorkGroup, NetworkJson, NftCollection, NftCollectionJson, NftItem, NftJson, NftTransactionResponse, NftTransferExtra, OptionInputAddress, PriceJson, RequestAccountCreateSuriV2, RequestAccountExportPrivateKey, RequestAuthorization, RequestAuthorizationPerAccount, RequestAuthorizeApproveV2, RequestBatchRestoreV2, RequestCheckCrossChainTransfer, RequestCheckTransfer, RequestCrossChainTransfer, RequestDeriveCreateV2, RequestForgetSite, RequestFreeBalance, RequestJsonRestoreV2, RequestNftForceUpdate, RequestSaveRecentAccount, RequestSeedCreateV2, RequestSeedValidateV2, RequestSettingsType, RequestTransactionHistoryAdd, RequestTransfer, RequestTransferCheckReferenceCount, RequestTransferCheckSupporting, RequestTransferExistentialDeposit, ResponseAccountCreateSuriV2, ResponseAccountExportPrivateKey, ResponseCheckCrossChainTransfer, ResponseCheckTransfer, ResponsePrivateKeyValidateV2, ResponseSeedCreateV2, ResponseSeedValidateV2, ResponseTransfer, StakingJson, StakingRewardJson, SubstrateNftSubmitTransaction, SubstrateNftTransaction, SubstrateNftTransactionRequest, SupportTransferResponse, ThemeTypes, TokenInfo, TransactionHistoryItemType, TransferError, TransferErrorCode, TransferStep, ValidateEvmTokenRequest, ValidateEvmTokenResponse, ValidateNetworkRequest, ValidateNetworkResponse } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson, AuthorizeRequest, MessageTypes, RequestAccountForget, RequestAuthorizeReject, RequestCurrentAccountAddress, RequestTypes, ResponseAuthorizeList, ResponseType } from '@subwallet/extension-base/background/types';
import { initApi } from '@subwallet/extension-koni-base/api/dotsama';
import { getFreeBalance, subscribeFreeBalance } from '@subwallet/extension-koni-base/api/dotsama/balance';
import { getTokenInfo } from '@subwallet/extension-koni-base/api/dotsama/registry';
import { checkReferenceCount, checkSupportTransfer, estimateCrossChainFee, estimateFee, getExistentialDeposit, makeCrossChainTransfer, makeTransfer } from '@subwallet/extension-koni-base/api/dotsama/transfer';
import { SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME } from '@subwallet/extension-koni-base/api/nft/config';
import { acalaTransferHandler, getNftTransferExtrinsic, isRecipientSelf, quartzTransferHandler, rmrkTransferHandler, statemineTransferHandler, uniqueTransferHandler, unlockAccount } from '@subwallet/extension-koni-base/api/nft/transfer';
import { getERC20TransactionObject, getEVMTransactionObject, makeERC20Transfer, makeEVMTransfer } from '@subwallet/extension-koni-base/api/web3/transfer';
import { ERC721Contract, getERC20Contract, getERC721Contract, initWeb3Api } from '@subwallet/extension-koni-base/api/web3/web3';
import { state } from '@subwallet/extension-koni-base/background/handlers/index';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-koni-base/constants';
import { isValidProvider, reformatAddress } from '@subwallet/extension-koni-base/utils/utils';
import { Transaction } from 'ethereumjs-tx';
import { Contract } from 'web3-eth-contract';

import { createPair } from '@polkadot/keyring';
import { decodePair } from '@polkadot/keyring/pair/decode';
import { KeyringPair, KeyringPair$Json, KeyringPair$Meta } from '@polkadot/keyring/types';
import { ChainType } from '@polkadot/types/interfaces';
import { keyring } from '@polkadot/ui-keyring';
import { accounts as accountsObservable } from '@polkadot/ui-keyring/observable/accounts';
import { SingleAddress, SubjectInfo } from '@polkadot/ui-keyring/observable/types';
import { assert, BN, hexToU8a, isHex, u8aToHex, u8aToString } from '@polkadot/util';
import { base64Decode, isEthereumAddress, jsonDecrypt, keyExtractSuri, mnemonicGenerate, mnemonicValidate } from '@polkadot/util-crypto';
import { EncryptedJson, KeypairType, Prefix } from '@polkadot/util-crypto/types';

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

  private saveTheme (data: ThemeTypes, id: string, port: chrome.runtime.Port) {
    const cb = createSubscription<'pri(currentAccount.saveTheme)'>(id, port);

    state.getSettings((value) => {
      const updateValue = {
        ...value,
        theme: data
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

  private _addAddressToAuthList (address: string, isAllowed: boolean): void {
    state.getAuthorize((value) => {
      if (value && Object.keys(value).length) {
        Object.keys(value).forEach((url) => {
          value[url].isAllowedMap[address] = isAllowed;
        });

        state.setAuthorize(value);
      }
    });
  }

  private _addAddressesToAuthList (addresses: string[], isAllowed: boolean): void {
    state.getAuthorize((value) => {
      if (value && Object.keys(value).length) {
        Object.keys(value).forEach((url) => {
          addresses.forEach((address) => {
            value[url].isAllowedMap[address] = isAllowed;
          });
        });

        state.setAuthorize(value);
      }
    });
  }

  private async accountsCreateSuriV2 ({ genesisHash, isAllowed, name, password, suri: _suri, types }: RequestAccountCreateSuriV2): Promise<ResponseAccountCreateSuriV2> {
    const addressDict = {} as Record<KeypairType, string>;

    types?.forEach((type) => {
      const suri = getSuri(_suri, type);
      const address = keyring.createFromUri(suri, {}, type).address;

      addressDict[type] = address;
      const newAccountName = type === 'ethereum' ? `${name} - EVM` : name;

      this._saveCurrentAccountAddress(address, () => {
        keyring.addUri(suri, password, { genesisHash, name: newAccountName }, type);
        this._addAddressToAuthList(address, isAllowed);
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

  private _checkValidatePrivateKey ({ suri, types }: RequestSeedValidateV2, autoAddPrefix = false): ResponsePrivateKeyValidateV2 {
    const { phrase } = keyExtractSuri(suri);
    const rs = { autoAddPrefix: autoAddPrefix, addressMap: {} } as ResponsePrivateKeyValidateV2;

    types && types.forEach((type) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      rs.addressMap[type] = '';
    });

    if (isHex(phrase) && isHex(phrase, 256)) {
      types && types.forEach((type) => {
        rs.addressMap[type] = keyring.createFromUri(getSuri(suri, type), {}, type).address;
      });
    } else {
      rs.autoAddPrefix = false;
      assert(false, 'Not valid private key');
    }

    return rs;
  }

  private metamaskPrivateKeyValidateV2 ({ suri, types }: RequestSeedValidateV2): ResponsePrivateKeyValidateV2 {
    const isValidSuri = suri.startsWith('0x');

    if (isValidSuri) {
      return this._checkValidatePrivateKey({ suri, types });
    } else {
      return this._checkValidatePrivateKey({ suri: `0x${suri}`, types }, true);
    }
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

  private derivationCreateV2 ({ genesisHash, isAllowed, name, parentAddress, parentPassword, password, suri }: RequestDeriveCreateV2): boolean {
    const childPair = this.deriveV2(parentAddress, suri, parentPassword, {
      genesisHash,
      name,
      parentAddress,
      suri
    });

    const address = childPair.address;

    this._saveCurrentAccountAddress(address, () => {
      keyring.addPair(childPair, password);
      this._addAddressToAuthList(address, isAllowed);
    });

    return true;
  }

  private jsonRestoreV2 ({ address, file, isAllowed, password }: RequestJsonRestoreV2): void {
    const isPasswordValidated = this.validatePassword(file, password);

    if (isPasswordValidated) {
      try {
        this._saveCurrentAccountAddress(address, () => {
          keyring.restoreAccount(file, password);
          this._addAddressToAuthList(address, isAllowed);
        });
      } catch (error) {
        throw new Error((error as Error).message);
      }
    } else {
      throw new Error('Unable to decode using the supplied passphrase');
    }
  }

  private batchRestoreV2 ({ accountsInfo, file, isAllowed, password }: RequestBatchRestoreV2): void {
    const addressList: string[] = accountsInfo.map((acc) => acc.address);
    const isPasswordValidated = this.validatedAccountsPassword(file, password);

    if (isPasswordValidated) {
      try {
        this._saveCurrentAccountAddress(addressList[0], () => {
          keyring.restoreAccounts(file, password);
          this._addAddressesToAuthList(addressList, isAllowed);
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
    const dotSamaApiMap = state.getDotSamaApiMap();
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
      tokenInfo = await getTokenInfo(networkKey, dotSamaApiMap[networkKey].api, token);

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
    const dotSamaApiMap = state.getDotSamaApiMap();
    const web3ApiMap = state.getApiMap().web3;

    let fee = '0';
    let feeSymbol;
    let fromAccountFree = '0';
    let toAccountFree = '0';

    if (isEthereumAddress(from) && isEthereumAddress(to)) {
      // @ts-ignore
      [fromAccountFree, toAccountFree] = await Promise.all([
        getFreeBalance(networkKey, from, dotSamaApiMap, web3ApiMap, token),
        getFreeBalance(networkKey, to, dotSamaApiMap, web3ApiMap, token)
      ]);
      const txVal: string = transferAll ? fromAccountFree : (value || '0');

      // Estimate with EVM API
      if (tokenInfo && !tokenInfo.isMainToken && tokenInfo.erc20Address) {
        [,, fee] = await getERC20TransactionObject(tokenInfo.erc20Address, networkKey, from, to, txVal, !!transferAll, web3ApiMap);
      } else {
        [,, fee] = await getEVMTransactionObject(networkKey, to, txVal, !!transferAll, web3ApiMap);
      }
    } else {
      // Estimate with DotSama API
      [[fee, feeSymbol], fromAccountFree, toAccountFree] = await Promise.all(
        [
          estimateFee(networkKey, fromKeyPair, to, value, !!transferAll, dotSamaApiMap, tokenInfo),
          getFreeBalance(networkKey, from, dotSamaApiMap, web3ApiMap, token),
          getFreeBalance(networkKey, to, dotSamaApiMap, web3ApiMap, token)
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

  private async validateCrossChainTransfer (
    originalNetworkKey: string,
    destinationNetworkKey: string,
    token: string,
    from: string, to: string,
    password: string | undefined,
    value: string): Promise<[Array<TransferError>, KeyringPair | undefined, BN | undefined, TokenInfo | undefined]> {
    const dotSamaApiMap = state.getDotSamaApiMap();
    const errors = [] as Array<TransferError>;
    let keypair: KeyringPair | undefined;
    const transferValue = new BN(value);

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

    const tokenInfo: TokenInfo | undefined = await getTokenInfo(originalNetworkKey, dotSamaApiMap[originalNetworkKey].api, token);

    if (!tokenInfo) {
      errors.push({
        code: TransferErrorCode.INVALID_TOKEN,
        message: 'Not found token from registry'
      });
    }

    return [errors, keypair, transferValue, tokenInfo];
  }

  private async checkCrossChainTransfer ({ destinationNetworkKey,
    from,
    originalNetworkKey,
    to,
    token,
    value }: RequestCheckCrossChainTransfer): Promise<ResponseCheckCrossChainTransfer> {
    const [errors, fromKeyPair, valueNumber, tokenInfo] =
      await this.validateCrossChainTransfer(originalNetworkKey, destinationNetworkKey, token, from, to, undefined, value);
    const dotSamaApiMap = state.getDotSamaApiMap();
    const web3ApiMap = state.getApiMap().web3;
    let fee = '0';
    let feeSymbol;
    let fromAccountFree = '0';

    // todo: Case ETH using web3 js

    if (tokenInfo && fromKeyPair) {
      [[fee, feeSymbol], fromAccountFree] = await Promise.all([
        estimateCrossChainFee(
          originalNetworkKey,
          destinationNetworkKey,
          to,
          fromKeyPair,
          value,
          dotSamaApiMap,
          tokenInfo,
          state.getNetworkMap()
        ),
        getFreeBalance(originalNetworkKey, from, dotSamaApiMap, web3ApiMap, token)
      ]);
    }

    const fromAccountFreeNumber = new BN(fromAccountFree);
    const feeNumber = fee ? new BN(fee) : undefined;

    if (value && feeNumber && valueNumber) {
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
      estimateFee: fee,
      feeSymbol
    };
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
        const web3ApiMap = state.getApiMap().web3;

        if (tokenInfo && !tokenInfo.isMainToken && tokenInfo.erc20Address) {
          transferProm = makeERC20Transfer(
            tokenInfo.erc20Address, networkKey, from, to, privateKey, value || '0', !!transferAll, web3ApiMap,
            this.makeTransferCallback(from, networkKey, token, cb)
          );
        } else {
          transferProm = makeEVMTransfer(
            networkKey, to, privateKey, value || '0', !!transferAll, web3ApiMap,
            this.makeTransferCallback(from, networkKey, token, cb)
          );
        }
      } else {
        // Make transfer with Dotsama API
        transferProm = makeTransfer(
          networkKey, to, fromKeyPair, value || '0', !!transferAll, state.getDotSamaApiMap(), tokenInfo,
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

  private async makeCrossChainTransfer (id: string, port: chrome.runtime.Port,
    { destinationNetworkKey, from, originalNetworkKey, password, to, token, value }: RequestCrossChainTransfer): Promise<Array<TransferError>> {
    const cb = createSubscription<'pri(accounts.crossChainTransfer)'>(id, port);
    const [errors, fromKeyPair, , tokenInfo] = await this.validateCrossChainTransfer(
      originalNetworkKey,
      destinationNetworkKey,
      token, from, to, password, value);

    if (errors.length) {
      setTimeout(() => {
        this.cancelSubscription(id);
      }, 500);

      // todo: add condition to lock KeyPair (for example: not remember password)
      fromKeyPair && fromKeyPair.lock();

      return errors;
    }

    if (fromKeyPair && tokenInfo) {
      let transferProm: Promise<void> | undefined;

      // todo: Case ETH using web3 js

      // eslint-disable-next-line prefer-const
      transferProm = makeCrossChainTransfer(
        originalNetworkKey, destinationNetworkKey,
        to, fromKeyPair,
        value || '0',
        state.getDotSamaApiMap(),
        tokenInfo,
        state.getNetworkMap(),
        this.makeTransferCallback(from, originalNetworkKey, token, cb)
      );

      transferProm.then(() => {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Start cross-chain transfer ${value} from ${from} to ${to}`);

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
    const networkMap = state.getNetworkMap();

    try {
      const web3ApiMap = state.getWeb3ApiMap();
      const web3 = web3ApiMap[networkKey];
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      const contract = new web3.eth.Contract(ERC721Contract, contractAddress);

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
      const estimatedFee = (gasLimit * parseFloat(gasPriceGwei)) / (10 ** networkMap[networkKey].decimals);
      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      const feeString = estimatedFee.toString() + ' ' + networkMap[networkKey].nativeToken;

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

  private async evmNftSubmitTransaction (id: string, port: chrome.runtime.Port, { networkKey, password, rawTransaction, recipientAddress, senderAddress }: EvmNftSubmitTransaction): Promise<NftTransactionResponse> {
    const updateState = createSubscription<'pri(evmNft.submitTransaction)'>(id, port);
    let parsedPrivateKey = '';
    const network = state.getNetworkMapByKey(networkKey);
    const txState = {
      isSendingSelf: reformatAddress(senderAddress, 1) === reformatAddress(recipientAddress, 1)
    } as NftTransactionResponse;

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
      const web3ApiMap = state.getWeb3ApiMap();
      const web3 = web3ApiMap[networkKey];

      const common = Common.forCustomChain('mainnet', {
        name: networkKey,
        networkId: network.evmChainId as number,
        chainId: network.evmChainId as number
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
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      if (e.toString().includes('Error: Returned error: insufficient funds for gas * price + value')) {
        txState.balanceError = true;
      } else {
        txState.txError = true;
      }

      updateState(txState);
    }

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
    });

    return txState;
  }

  private getNetworkMap (): Record<string, NetworkJson> {
    return state.getNetworkMap();
  }

  private subscribeNetworkMap (id: string, port: chrome.runtime.Port): Record<string, NetworkJson> {
    const cb = createSubscription<'pri(networkMap.getSubscription)'>(id, port);
    const networkMapSubscription = state.subscribeNetworkMap().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
      networkMapSubscription.unsubscribe();
    });

    return this.getNetworkMap();
  }

  private validateProvider (targetProviders: string[], _isEthereum: boolean) {
    let error: NETWORK_ERROR = NETWORK_ERROR.NONE;
    const currentNetworks = this.getNetworkMap();
    const allExistedProviders: Record<string, string | boolean>[] = [];
    let conflictKey = '';
    let conflictChain = '';

    // get all providers
    for (const [key, value] of Object.entries(currentNetworks)) {
      Object.values(value.providers).forEach((provider) => {
        allExistedProviders.push({ key, provider, isEthereum: value.isEthereum || false });
      });

      if (value.customProviders) {
        Object.values(value.customProviders).forEach((provider) => {
          allExistedProviders.push({ key, provider, isEthereum: value.isEthereum || false });
        });
      }
    }

    for (const _provider of targetProviders) {
      if (!isValidProvider(_provider)) {
        error = NETWORK_ERROR.INVALID_PROVIDER;
        break;
      }

      for (const { isEthereum, key, provider } of allExistedProviders) {
        if (provider === _provider && isEthereum === _isEthereum) {
          error = NETWORK_ERROR.EXISTED_PROVIDER;
          conflictKey = key as string;
          conflictChain = currentNetworks[key as string].chain;
          break;
        }
      }
    }

    return { error, conflictKey, conflictChain };
  }

  private validateGenesisHash (genesisHash: string) {
    let error: NETWORK_ERROR = NETWORK_ERROR.NONE;
    let conflictKey = '';
    let conflictChain = '';
    const currentNetworks = this.getNetworkMap();

    for (const network of Object.values(currentNetworks)) {
      if (network.genesisHash === genesisHash) {
        error = NETWORK_ERROR.EXISTED_NETWORK;
        conflictKey = network.key;
        conflictChain = network.chain;
        break;
      }
    }

    return { error, conflictKey, conflictChain };
  }

  private async upsertNetworkMap (data: NetworkJson): Promise<boolean> {
    try {
      return await state.upsertNetworkMap(data);
    } catch (e) {
      return false;
    }
  }

  private removeNetworkMap (networkKey: string): boolean {
    const currentNetworkMap = this.getNetworkMap();

    if (!(networkKey in currentNetworkMap)) {
      return false;
    }

    if (currentNetworkMap[networkKey].active) {
      return false;
    }

    return state.removeNetworkMap(networkKey);
  }

  private async disableNetworkMap (networkKey: string): Promise<DisableNetworkResponse> {
    const currentNetworkMap = this.getNetworkMap();

    if (!(networkKey in currentNetworkMap)) {
      return {
        success: false
      };
    }

    const success = await state.disableNetworkMap(networkKey);

    return {
      success
    };
  }

  private enableNetworkMap (networkKey: string): boolean {
    const networkMap = this.getNetworkMap();

    if (!(networkKey in networkMap)) {
      return false;
    }

    return state.enableNetworkMap(networkKey);
  }

  private async validateNetwork ({ existedNetwork, isEthereum, provider }: ValidateNetworkRequest): Promise<ValidateNetworkResponse> {
    let result: ValidateNetworkResponse = {
      success: false,
      key: '',
      genesisHash: '',
      ss58Prefix: '',
      networkGroup: [],
      chain: '',
      evmChainId: -1
    };

    try {
      const { conflictChain: providerConflictChain, conflictKey: providerConflictKey, error: providerError } = this.validateProvider([provider], false);

      if (providerError === NETWORK_ERROR.NONE) { // provider not duplicate
        let networkKey = '';
        const apiProps = initApi('custom', provider, isEthereum);
        const timeout = new Promise((resolve) => {
          const id = setTimeout(() => {
            clearTimeout(id);
            resolve(null);
          }, 5000);
        });

        const res = await Promise.race([
          timeout,
          apiProps.isReady
        ]); // check connection

        if (res !== null) { // test connection ok
          // get all necessary information
          const api = res as ApiProps;
          const { chainDecimals, chainTokens } = api.api.registry;
          const defaultToken = chainTokens[0];
          const defaultDecimal = chainDecimals[0];
          const genesisHash = api.api.genesisHash?.toHex();
          const ss58Prefix = api.api?.consts?.system?.ss58Prefix?.toString();
          let chainType: ChainType;
          let chain = '';
          let ethChainId = -1;

          if (isEthereum) {
            const web3 = initWeb3Api(provider);

            const [_chainType, _chain, _ethChainId] = await Promise.all([
              api.api.rpc.system.chainType(),
              api.api.rpc.system.chain(),
              web3.eth.getChainId()
            ]);

            chainType = _chainType;
            chain = _chain.toString();
            ethChainId = _ethChainId;

            if (existedNetwork && existedNetwork.evmChainId && existedNetwork.evmChainId !== ethChainId) {
              result.error = NETWORK_ERROR.PROVIDER_NOT_SAME_NETWORK;

              return result;
            }
          } else {
            const [_chainType, _chain] = await Promise.all([
              api.api.rpc.system.chainType(),
              api.api.rpc.system.chain()
            ]);

            chainType = _chainType;
            chain = _chain.toString();
          }

          networkKey = 'custom_' + genesisHash.toString();
          let parsedChainType: NetWorkGroup = 'UNKNOWN';

          if (chainType) {
            if (chainType.type === 'Development') {
              parsedChainType = 'TEST_NET';
            } else if (chainType.type === 'Live') {
              parsedChainType = 'MAIN_NET';
            }
          }

          // handle result
          if (existedNetwork) {
            if (existedNetwork.genesisHash !== genesisHash) {
              result.error = NETWORK_ERROR.PROVIDER_NOT_SAME_NETWORK;

              return result;
            } else { // no need to validate genesisHash
              result = {
                success: true,
                key: networkKey,
                genesisHash,
                ss58Prefix,
                networkGroup: [parsedChainType],
                chain: chain ? chain.toString() : '',
                evmChainId: ethChainId,
                nativeToken: defaultToken,
                decimal: defaultDecimal
              };
            }
          } else {
            const { conflictChain: genesisConflictChain, conflictKey: genesisConflictKey, error: genesisError } = this.validateGenesisHash(genesisHash);

            if (genesisError === NETWORK_ERROR.NONE) { // check genesisHash ok
              result = {
                success: true,
                key: networkKey,
                genesisHash,
                ss58Prefix,
                networkGroup: [parsedChainType],
                chain: chain ? chain.toString() : '',
                evmChainId: ethChainId,
                nativeToken: defaultToken,
                decimal: defaultDecimal
              };
            } else {
              result.error = genesisError;
              result.conflictKey = genesisConflictKey;
              result.conflictChain = genesisConflictChain;
            }
          }

          await api.api.disconnect();
        } else {
          result.error = NETWORK_ERROR.CONNECTION_FAILURE;
        }
      } else {
        result.error = providerError;
        result.conflictChain = providerConflictChain;
        result.conflictKey = providerConflictKey;
      }

      return result;
    } catch (e) {
      console.error('Error connecting to provider', e);

      return result;
    }
  }

  private enableAllNetwork (): boolean {
    return state.enableAllNetworks();
  }

  private async disableAllNetwork (): Promise<boolean> {
    return await state.disableAllNetworks();
  }

  private async resetDefaultNetwork (): Promise<boolean> {
    return await state.resetDefaultNetwork();
  }

  private recoverDotSamaApi (networkKey: string): boolean {
    try {
      return state.refreshDotSamaApi(networkKey);
    } catch (e) {
      console.error('error recovering dotsama api', e);

      return false;
    }
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

    // check exist in evmTokenState
    for (const token of evmTokenState[data.type]) {
      if (token.smartContract.toLowerCase() === data.smartContract.toLowerCase() && token.type === data.type && token.chain === data.chain) {
        isExist = true;
        break;
      }
    }

    if (!isExist && data.type === 'erc20') {
      // check exist in chainRegistry
      const chainRegistryMap = state.getChainRegistryMap();
      const tokenMap = chainRegistryMap[data.chain].tokenMap;

      for (const token of Object.values(tokenMap)) {
        if (token?.erc20Address?.toLowerCase() === data.smartContract.toLowerCase()) {
          isExist = true;
          break;
        }
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
      tokenContract = getERC721Contract(data.chain, data.smartContract, state.getWeb3ApiMap());

      const [_name, _symbol] = await Promise.all([
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        tokenContract.methods.name().call() as string,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        tokenContract.methods.symbol().call() as string
      ]);

      name = _name;
      symbol = _symbol;
    } else {
      tokenContract = getERC20Contract(data.chain, data.smartContract, state.getWeb3ApiMap());
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
    this.cancelSubscriptionMap[id] = await subscribeFreeBalance(networkKey, address, state.getDotSamaApiMap(), state.getWeb3ApiMap(), token, cb);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return id;
  }

  private async transferCheckReferenceCount ({ address, networkKey }: RequestTransferCheckReferenceCount): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
    return await checkReferenceCount(networkKey, address, state.getDotSamaApiMap());
  }

  private async transferCheckSupporting ({ networkKey, token }: RequestTransferCheckSupporting): Promise<SupportTransferResponse> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
    return await checkSupportTransfer(networkKey, token, state.getDotSamaApiMap());
  }

  private async transferGetExistentialDeposit ({ networkKey, token }: RequestTransferExistentialDeposit): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
    return await getExistentialDeposit(networkKey, token, state.getDotSamaApiMap());
  }

  private async substrateNftGetTransaction ({ networkKey, params, recipientAddress, senderAddress }: SubstrateNftTransactionRequest): Promise<SubstrateNftTransaction> {
    switch (networkKey) {
      case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.acala:
        return await acalaTransferHandler(networkKey, state.getDotSamaApiMap(), state.getWeb3ApiMap(), senderAddress, recipientAddress, params);
      case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.karura:
        return await acalaTransferHandler(networkKey, state.getDotSamaApiMap(), state.getWeb3ApiMap(), senderAddress, recipientAddress, params);
      case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.kusama:
        return await rmrkTransferHandler(networkKey, state.getDotSamaApiMap(), state.getWeb3ApiMap(), senderAddress, recipientAddress, params);
      case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.uniqueNft:
        return await uniqueTransferHandler(networkKey, state.getDotSamaApiMap(), state.getWeb3ApiMap(), senderAddress, recipientAddress, params);
      case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.quartz:
        return await quartzTransferHandler(networkKey, state.getDotSamaApiMap(), state.getWeb3ApiMap(), senderAddress, recipientAddress, params);
      case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.opal:
        return await quartzTransferHandler(networkKey, state.getDotSamaApiMap(), state.getWeb3ApiMap(), senderAddress, recipientAddress, params);
      case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.statemine:
        return await statemineTransferHandler(networkKey, state.getDotSamaApiMap(), state.getWeb3ApiMap(), senderAddress, recipientAddress, params);
      case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.statemint:
        return await statemineTransferHandler(networkKey, state.getDotSamaApiMap(), state.getWeb3ApiMap(), senderAddress, recipientAddress, params);
      case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.bitcountry:
        return await acalaTransferHandler(networkKey, state.getDotSamaApiMap(), state.getWeb3ApiMap(), senderAddress, recipientAddress, params);
    }

    return {
      error: true,
      balanceError: false
    };
  }

  private async substrateNftSubmitTransaction (id: string, port: chrome.runtime.Port, { params, password, recipientAddress, senderAddress }: SubstrateNftSubmitTransaction): Promise<NftTransactionResponse> {
    const txState: NftTransactionResponse = { isSendingSelf: false };

    if (params === null) {
      txState.txError = true;

      return txState;
    }

    const updateState = createSubscription<'pri(substrateNft.submitTransaction)'>(id, port);
    const networkKey = params.networkKey as string;
    const extrinsic = getNftTransferExtrinsic(networkKey, state.getDotSamaApi(networkKey), senderAddress, recipientAddress, params);
    const passwordError: string | null = unlockAccount(senderAddress, password);

    if (extrinsic !== null && passwordError === null) {
      const pair = keyring.getPair(senderAddress);

      txState.isSendingSelf = isRecipientSelf(senderAddress, recipientAddress);
      txState.callHash = extrinsic.method.hash.toHex();
      updateState(txState);

      try {
        const unsubscribe = await extrinsic.signAndSend(pair, (result) => {
          if (!result || !result.status) {
            return;
          }

          if (result.status.isInBlock || result.status.isFinalized) {
            result.events
              .filter(({ event: { section } }) => section === 'system')
              .forEach(({ event: { method } }): void => {
                txState.transactionHash = extrinsic.hash.toHex();
                updateState(txState);

                if (method === 'ExtrinsicFailed') {
                  txState.status = false;
                  updateState(txState);
                } else if (method === 'ExtrinsicSuccess') {
                  txState.status = true;
                  updateState(txState);
                }
              });
          } else if (result.isError) {
            txState.txError = true;
            updateState(txState);
          }

          if (result.isCompleted) {
            unsubscribe();
          }
        });
      } catch (e) {
        console.error('error transferring nft', e);
        txState.txError = true;
        updateState(txState);
      }
    } else {
      txState.passwordError = passwordError;
      updateState(txState);
    }

    return txState;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public override async handle<TMessageType extends MessageTypes> (id: string, type: TMessageType, request: RequestTypes[TMessageType], port: chrome.runtime.Port): Promise<ResponseType<TMessageType>> {
    switch (type) {
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
        return await this.accountsCreateSuriV2(request as RequestAccountCreateSuriV2);
      case 'pri(accounts.forget)':
        return await this.accountsForgetOverride(request as RequestAccountForget);
      case 'pri(seed.createV2)':
        return this.seedCreateV2(request as RequestSeedCreateV2);
      case 'pri(seed.validateV2)':
        return this.seedValidateV2(request as RequestSeedValidateV2);
      case 'pri(privateKey.validateV2)':
        return this.metamaskPrivateKeyValidateV2(request as RequestSeedValidateV2);
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
        return await this.subscribeSettings(id, port);
      case 'pri(currentAccount.saveAccountAllLogo)':
        return this.saveAccountAllLogo(request as string, id, port);
      case 'pri(currentAccount.saveTheme)':
        return this.saveTheme(request as ThemeTypes, id, port);
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
        return this.derivationCreateV2(request as RequestDeriveCreateV2);
      case 'pri(json.restoreV2)':
        return this.jsonRestoreV2(request as RequestJsonRestoreV2);
      case 'pri(json.batchRestoreV2)':
        return this.batchRestoreV2(request as RequestBatchRestoreV2);
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
      case 'pri(accounts.checkCrossChainTransfer)':
        return await this.checkCrossChainTransfer(request as RequestCheckCrossChainTransfer);
      case 'pri(accounts.crossChainTransfer)':
        return await this.makeCrossChainTransfer(id, port, request as RequestCrossChainTransfer);
      case 'pri(evmNft.getTransaction)':
        return this.evmNftGetTransaction(request as EvmNftTransactionRequest);
      case 'pri(evmNft.submitTransaction)':
        return this.evmNftSubmitTransaction(id, port, request as EvmNftSubmitTransaction);
      case 'pri(networkMap.getSubscription)':
        return this.subscribeNetworkMap(id, port);
      case 'pri(networkMap.upsert)':
        return await this.upsertNetworkMap(request as NetworkJson);
      case 'pri(networkMap.getNetworkMap)':
        return this.getNetworkMap();
      case 'pri(networkMap.disableOne)':
        return await this.disableNetworkMap(request as string);
      case 'pri(networkMap.removeOne)':
        return this.removeNetworkMap(request as string);
      case 'pri(networkMap.enableOne)':
        return this.enableNetworkMap(request as string);
      case 'pri(apiMap.validate)':
        return await this.validateNetwork(request as ValidateNetworkRequest);
      case 'pri(networkMap.disableAll)':
        return this.disableAllNetwork();
      case 'pri(networkMap.enableAll)':
        return this.enableAllNetwork();
      case 'pri(networkMap.resetDefault)':
        return this.resetDefaultNetwork();
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
      case 'pri(substrateNft.getTransaction)':
        return await this.substrateNftGetTransaction(request as SubstrateNftTransactionRequest);
      case 'pri(substrateNft.submitTransaction)':
        return this.substrateNftSubmitTransaction(id, port, request as SubstrateNftSubmitTransaction);
      case 'pri(networkMap.recoverDotSama)':
        return this.recoverDotSamaApi(request as string);
      default:
        return super.handle(id, type, request, port);
    }
  }
}
