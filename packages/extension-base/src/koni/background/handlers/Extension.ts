// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Common from '@ethereumjs/common';
import { _ChainAsset, _ChainInfo, _MultiChainAsset } from '@subwallet/chain-list/types';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { isJsonPayload, SEED_DEFAULT_LENGTH, SEED_LENGTHS } from '@subwallet/extension-base/background/handlers/Extension';
import { withErrorLog } from '@subwallet/extension-base/background/handlers/helpers';
import { createSubscription } from '@subwallet/extension-base/background/handlers/subscriptions';
import { AccountExternalError, AccountExternalErrorCode, AccountsWithCurrentAddress, AmountData, AssetSetting, AssetSettingUpdateReq, BalanceJson, BasicTxErrorType, BondingOptionParams, BrowserConfirmationType, ChainType, CreateDeriveAccountInfo, CrowdloanJson, CurrentAccountInfo, DeriveAccountInfo, ExternalRequestPromiseStatus, ExtrinsicType, KeyringState, NftCollection, NftJson, NftTransactionRequest, NftTransactionResponse, NftTransferExtra, NominationPoolInfo, OptionInputAddress, PriceJson, RequestAccountCreateExternalV2, RequestAccountCreateHardwareMultiple, RequestAccountCreateHardwareV2, RequestAccountCreateSuriV2, RequestAccountCreateWithSecretKey, RequestAccountExportPrivateKey, RequestAccountMeta, RequestAuthorization, RequestAuthorizationBlock, RequestAuthorizationPerAccount, RequestAuthorizationPerSite, RequestAuthorizeApproveV2, RequestBatchRestoreV2, RequestBondingSubmit, RequestCameraSettings, RequestChangeMasterPassword, RequestCheckPublicAndSecretKey, RequestConfirmationComplete, RequestCrossChainTransfer, RequestDeriveCreateMultiple, RequestDeriveCreateV2, RequestDeriveCreateV3, RequestDeriveValidateV2, RequestForgetSite, RequestFreeBalance, RequestGetDeriveAccounts, RequestGetTransaction, RequestJsonRestoreV2, RequestKeyringExportMnemonic, RequestMigratePassword, RequestNftForceUpdate, RequestParseEvmContractInput, RequestParseTransactionSubstrate, RequestQrParseRLP, RequestQrSignEvm, RequestQrSignSubstrate, RequestRejectExternalRequest, RequestResolveExternalRequest, RequestSaveRecentAccount, RequestSeedCreateV2, RequestSeedValidateV2, RequestSettingsType, RequestSigningApprovePasswordV2, RequestStakeCancelWithdrawal, RequestStakeClaimReward, RequestStakePoolingBonding, RequestStakePoolingUnbonding, RequestStakeWithdrawal, RequestSubstrateNftSubmitTransaction, RequestTransfer, RequestTransferCheckReferenceCount, RequestTransferCheckSupporting, RequestTransferExistentialDeposit, RequestTuringCancelStakeCompound, RequestTuringStakeCompound, RequestUnbondingSubmit, RequestUnlockKeyring, ResponseAccountCreateSuriV2, ResponseAccountCreateWithSecretKey, ResponseAccountExportPrivateKey, ResponseAccountMeta, ResponseChangeMasterPassword, ResponseCheckPublicAndSecretKey, ResponseDeriveValidateV2, ResponseGetDeriveAccounts, ResponseKeyringExportMnemonic, ResponseMigratePassword, ResponseParseEvmContractInput, ResponseParseTransactionSubstrate, ResponsePrivateKeyValidateV2, ResponseQrParseRLP, ResponseQrSignEvm, ResponseQrSignSubstrate, ResponseRejectExternalRequest, ResponseResolveExternalRequest, ResponseSeedCreateV2, ResponseSeedValidateV2, ResponseUnlockKeyring, StakingJson, StakingRewardJson, SubstrateNftTransaction, SupportTransferResponse, ThemeNames, TransactionHistoryItem, TransactionResponse, TransferTxErrorType, ValidateNetworkRequest, ValidateNetworkResponse, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { AccountAuthType, AccountJson, AllowedPath, AuthorizeRequest, MessageTypes, MetadataRequest, RequestAccountChangePassword, RequestAccountCreateExternal, RequestAccountCreateHardware, RequestAccountCreateSuri, RequestAccountEdit, RequestAccountExport, RequestAccountForget, RequestAccountShow, RequestAccountTie, RequestAccountValidate, RequestAuthorizeCancel, RequestAuthorizeReject, RequestBatchRestore, RequestCurrentAccountAddress, RequestDeriveCreate, RequestDeriveValidate, RequestJsonRestore, RequestMetadataApprove, RequestMetadataReject, RequestSeedCreate, RequestSeedValidate, RequestSigningApproveSignature, RequestSigningCancel, RequestTypes, ResponseAccountExport, ResponseAuthorizeList, ResponseDeriveValidate, ResponseJsonGetAccountInfo, ResponseSeedCreate, ResponseSeedValidate, ResponseType, SigningRequest } from '@subwallet/extension-base/background/types';
import { TransactionWarning } from '@subwallet/extension-base/background/warnings/TransactionWarning';
import { ALL_ACCOUNT_KEY, ALL_GENESIS_HASH } from '@subwallet/extension-base/constants';
import { ALLOWED_PATH } from '@subwallet/extension-base/defaults';
import { parseSubstrateTransaction } from '@subwallet/extension-base/koni/api/dotsama/parseTransaction';
import { checkReferenceCount, checkSupportTransfer, createTransferExtrinsic } from '@subwallet/extension-base/koni/api/dotsama/transfer';
import { getNftTransferExtrinsic, isRecipientSelf } from '@subwallet/extension-base/koni/api/nft/transfer';
import { getBondingExtrinsic, getCancelWithdrawalExtrinsic, getClaimRewardExtrinsic, getNominationPoolsInfo, getUnbondingExtrinsic, getValidatorsInfo, getWithdrawalExtrinsic } from '@subwallet/extension-base/koni/api/staking/bonding';
import { getTuringCancelCompoundingExtrinsic, getTuringCompoundExtrinsic } from '@subwallet/extension-base/koni/api/staking/bonding/paraChain';
import { getPoolingBondingExtrinsic, getPoolingUnbondingExtrinsic } from '@subwallet/extension-base/koni/api/staking/bonding/relayChain';
import { getERC20TransactionObject, getERC721Transaction, getEVMTransactionObject } from '@subwallet/extension-base/koni/api/tokens/evm/transfer';
import { getPSP34Transaction, getPSP34TransferExtrinsic } from '@subwallet/extension-base/koni/api/tokens/wasm';
import { createXcmExtrinsic } from '@subwallet/extension-base/koni/api/xcm';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { _ChainState, _NetworkUpsertParams, _ValidateCustomAssetRequest, _ValidateCustomAssetResponse } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenBasicInfo, _getContractAddressOfToken, _getEvmChainId, _getSubstrateGenesisHash, _getTokenMinAmount, _isAssetSmartContractNft, _isChainEvmCompatible, _isCustomAsset, _isNativeToken, _isTokenEvmSmartContract } from '@subwallet/extension-base/services/chain-service/utils';
import { EXTENSION_REQUEST_URL } from '@subwallet/extension-base/services/request-service/constants';
import { AuthUrls } from '@subwallet/extension-base/services/request-service/types';
import { SWTransaction, SWTransactionResponse, SWTransactionResult, ValidateTransactionResponseInput } from '@subwallet/extension-base/services/transaction-service/types';
import { createTransactionFromRLP, signatureToHex, Transaction as QrTransaction } from '@subwallet/extension-base/utils/eth';
import { parseContractInput, parseEvmRlp } from '@subwallet/extension-base/utils/eth/parseTransaction';
import { MetadataDef } from '@subwallet/extension-inject/types';
import { createPair } from '@subwallet/keyring';
import { KeyringPair, KeyringPair$Json, KeyringPair$Meta } from '@subwallet/keyring/types';
import { keyring } from '@subwallet/ui-keyring';
import { accounts as accountsObservable } from '@subwallet/ui-keyring/observable/accounts';
import { SingleAddress, SubjectInfo } from '@subwallet/ui-keyring/observable/types';
import BigN from 'bignumber.js';
import { Transaction } from 'ethereumjs-tx';
import { TransactionConfig } from 'web3-core';

import { SubmittableExtrinsic } from '@polkadot/api/types';
import { TypeRegistry } from '@polkadot/types';
import { assert, BN, hexStripPrefix, hexToU8a, isAscii, isHex, u8aToHex, u8aToString } from '@polkadot/util';
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

export default class KoniExtension {
  readonly #koniState: KoniState;

  constructor (state: KoniState) {
    this.#koniState = state;
  }

  /// Clone from PolkadotJs
  private accountsCreateExternal ({ address, genesisHash, name }: RequestAccountCreateExternal): boolean {
    keyring.addExternal(address, { genesisHash, name });

    return true;
  }

  private accountsCreateHardware ({ accountIndex,
    address,
    addressOffset,
    genesisHash,
    hardwareType,
    name }: RequestAccountCreateHardware): boolean {
    keyring.addHardware(address, hardwareType, { accountIndex, addressOffset, genesisHash, name });

    return true;
  }

  private accountsCreateSuri ({ genesisHash, name, suri, type }: RequestAccountCreateSuri): boolean {
    keyring.addUri(getSuri(suri, type), { genesisHash, name }, type);

    return true;
  }

  private accountsChangePassword ({ address, newPass, oldPass }: RequestAccountChangePassword): boolean {
    const pair = keyring.getPair(address);

    assert(pair, 'Unable to find pair');

    try {
      if (!pair.isLocked) {
        pair.lock();
      }

      pair.decodePkcs8(oldPass);
    } catch (error) {
      throw new Error('oldPass is invalid');
    }

    keyring.encryptAccount(pair, newPass);

    return true;
  }

  private accountsEdit ({ address, name }: RequestAccountEdit): boolean {
    const pair = keyring.getPair(address);

    assert(pair, 'Unable to find pair');

    keyring.saveAccountMeta(pair, { ...pair.meta, name });

    return true;
  }

  private accountsExport ({ address, password }: RequestAccountExport): ResponseAccountExport {
    return { exportedJson: keyring.backupAccount(keyring.getPair(address), password) };
  }

  private accountsShow ({ address, isShowing }: RequestAccountShow): boolean {
    const pair = keyring.getPair(address);

    assert(pair, 'Unable to find pair');

    keyring.saveAccountMeta(pair, { ...pair.meta, isHidden: !isShowing });

    return true;
  }

  private accountsValidate ({ address, password }: RequestAccountValidate): boolean {
    try {
      keyring.backupAccount(keyring.getPair(address), password);

      return true;
    } catch (e) {
      return false;
    }
  }

  // FIXME This looks very much like what we have in Tabs
  private accountsSubscribe (id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pri(accounts.subscribe)'>(id, port);
    const subscription = accountsObservable.subject.subscribe((accounts: SubjectInfo): void =>
      cb(transformAccounts(accounts))
    );

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
      subscription.unsubscribe();
    });

    return true;
  }

  private metadataApprove ({ id }: RequestMetadataApprove): boolean {
    const queued = this.#koniState.getMetaRequest(id);

    assert(queued, 'Unable to find request');

    const { request, resolve } = queued;

    this.#koniState.saveMetadata(request);

    resolve(true);

    return true;
  }

  private metadataGet (genesisHash: string | null): MetadataDef | null {
    return this.#koniState.knownMetadata.find((result) => result.genesisHash === genesisHash) || null;
  }

  private metadataList (): MetadataDef[] {
    return this.#koniState.knownMetadata;
  }

  private metadataReject ({ id }: RequestMetadataReject): boolean {
    const queued = this.#koniState.getMetaRequest(id);

    assert(queued, 'Unable to find request');

    const { reject } = queued;

    reject(new Error('Rejected'));

    return true;
  }

  private metadataSubscribe (id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pri(metadata.requests)'>(id, port);
    const subscription = this.#koniState.metaSubject.subscribe((requests: MetadataRequest[]): void =>
      cb(requests)
    );

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
      subscription.unsubscribe();
    });

    return true;
  }

  private jsonRestore ({ file, password }: RequestJsonRestore): void {
    try {
      keyring.restoreAccount(file, password, true);
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }

  private batchRestore ({ file, password }: RequestBatchRestore): void {
    try {
      keyring.restoreAccounts(file, password);
    } catch (error) {
      throw new Error((error as Error).message);
    }
  }

  private jsonGetAccountInfo (json: KeyringPair$Json): ResponseJsonGetAccountInfo {
    try {
      const { address, meta: { genesisHash, name }, type } = keyring.createFromJson(json);

      return {
        address,
        genesisHash,
        name,
        type
      } as ResponseJsonGetAccountInfo;
    } catch (e) {
      console.error(e);
      throw new Error((e as Error).message);
    }
  }

  private seedCreate ({ length = SEED_DEFAULT_LENGTH, seed: _seed, type }: RequestSeedCreate): ResponseSeedCreate {
    const seed = _seed || mnemonicGenerate(length);

    return {
      address: keyring.createFromUri(getSuri(seed, type), {}, type).address,
      seed
    };
  }

  private seedValidate ({ suri, type }: RequestSeedValidate): ResponseSeedValidate {
    const { phrase } = keyExtractSuri(suri);

    if (isHex(phrase)) {
      assert(isHex(phrase, 256), 'Hex seed needs to be 256-bits');
    } else {
      // sadly isHex detects as string, so we need a cast here
      assert(SEED_LENGTHS.includes((phrase).split(' ').length), `Mnemonic needs to contain ${SEED_LENGTHS.join(', ')} words`);
      assert(mnemonicValidate(phrase), 'Not a valid mnemonic seed');
    }

    return {
      address: keyring.createFromUri(getSuri(suri, type), {}, type).address,
      suri
    };
  }

  private signingApproveSignature ({ id, signature }: RequestSigningApproveSignature): boolean {
    const queued = this.#koniState.getSignRequest(id);

    assert(queued, 'Unable to find request');

    const { resolve } = queued;

    resolve({ id, signature });

    return true;
  }

  private signingCancel ({ id }: RequestSigningCancel): boolean {
    const queued = this.#koniState.getSignRequest(id);

    assert(queued, 'Unable to find request');

    const { reject } = queued;

    reject(new Error('Cancelled'));

    return true;
  }

  // FIXME This looks very much like what we have in authorization
  private signingSubscribe (id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pri(signing.requests)'>(id, port);
    const subscription = this.#koniState.signSubject.subscribe((requests: SigningRequest[]): void =>
      cb(requests)
    );

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
      subscription.unsubscribe();
    });

    return true;
  }

  private windowOpen (path: AllowedPath): boolean {
    const url = `${chrome.extension.getURL('index.html')}#${path}`;

    if (!ALLOWED_PATH.includes(path)) {
      console.error('Not allowed to open the url:', url);

      return false;
    }

    withErrorLog(() => chrome.tabs.create({ url }));

    return true;
  }

  private derive (parentAddress: string, suri: string, password: string, metadata: KeyringPair$Meta): KeyringPair {
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

  private derivationValidate ({ parentAddress, parentPassword, suri }: RequestDeriveValidate): ResponseDeriveValidate {
    const childPair = this.derive(parentAddress, suri, parentPassword, {});

    return {
      address: childPair.address,
      suri
    };
  }

  private derivationCreate ({ genesisHash, name, parentAddress, parentPassword, suri }: RequestDeriveCreate): boolean {
    const childPair = this.derive(parentAddress, suri, parentPassword, {
      genesisHash,
      name,
      parentAddress,
      suri
    });

    keyring.addPair(childPair, true);

    return true;
  }

  ///

  private cancelSubscription (id: string): boolean {
    return this.#koniState.cancelSubscription(id);
  }

  private createUnsubscriptionHandle (id: string, unsubscribe: () => void): void {
    this.#koniState.createUnsubscriptionHandle(id, unsubscribe);
  }

  public decodeAddress = (key: string | Uint8Array, ignoreChecksum?: boolean, ss58Format?: Prefix): Uint8Array => {
    return keyring.decodeAddress(key, ignoreChecksum, ss58Format);
  };

  public encodeAddress = (key: string | Uint8Array, ss58Format?: Prefix): string => {
    return keyring.encodeAddress(key, ss58Format);
  };

  private accountExportPrivateKey ({ address,
    password }: RequestAccountExportPrivateKey): ResponseAccountExportPrivateKey {
    return this.#koniState.accountExportPrivateKey({ address, password });
  }

  private checkPublicAndSecretKey (request: RequestCheckPublicAndSecretKey): ResponseCheckPublicAndSecretKey {
    return this.#koniState.checkPublicAndSecretKey(request);
  }

  private async accountsGetAllWithCurrentAddress (id: string, port: chrome.runtime.Port): Promise<AccountsWithCurrentAddress> {
    const cb = createSubscription<'pri(accounts.subscribeWithCurrentAddress)'>(id, port);

    return await new Promise<AccountsWithCurrentAddress>((resolve): void => {
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

        setTimeout(() => {
          this.#koniState.getCurrentAccount((accountInfo) => {
            if (accountInfo) {
              accountsWithCurrentAddress.currentAddress = accountInfo.address;

              if (accountInfo.address === ALL_ACCOUNT_KEY) {
                accountsWithCurrentAddress.currentGenesisHash = accountInfo.currentGenesisHash;
              } else {
                const acc = accounts.find((a) => (a.address === accountInfo.address));

                accountsWithCurrentAddress.currentGenesisHash = acc?.genesisHash || ALL_GENESIS_HASH;
              }
            }

            resolve(accountsWithCurrentAddress);
            cb(accountsWithCurrentAddress);
          });
        }, 300);
      });

      this.createUnsubscriptionHandle(id, subscription.unsubscribe);

      port.onDisconnect.addListener((): void => {
        this.cancelSubscription(id);
      });
    });
  }

  private accountsGetAll (id: string, port: chrome.runtime.Port): string {
    const cb = createSubscription<'pri(accounts.subscribeAccountsInputAddress)'>(id, port);
    const subscription = keyring.keyringOption.optionsSubject.subscribe((options): void => {
      const optionsInputAddress: OptionInputAddress = {
        options
      };

      cb(optionsInputAddress);
    });

    this.createUnsubscriptionHandle(id, subscription.unsubscribe);

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
      this.#koniState.getAuthorize((rs: AuthUrls) => {
        const accounts = accountsObservable.subject.getValue();
        const addressList = Object.keys(accounts);
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

          this.#koniState.setAuthorize(rs);
        }

        resolve(rs);
      });
    });
  }

  private authorizeSubscribeV2 (id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pri(authorize.requestsV2)'>(id, port);
    const subscription = this.#koniState.authSubjectV2.subscribe((requests: AuthorizeRequest[]): void =>
      cb(requests)
    );

    this.createUnsubscriptionHandle(id, subscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return true;
  }

  private async getAuthListV2 (): Promise<ResponseAuthorizeList> {
    const authList = await this._getAuthListV2();

    return { list: authList };
  }

  private authorizeApproveV2 ({ accounts, id }: RequestAuthorizeApproveV2): boolean {
    const queued = this.#koniState.getAuthRequestV2(id);

    assert(queued, 'Unable to find request');

    const { resolve } = queued;

    resolve({ accounts, result: true });

    return true;
  }

  private authorizeRejectV2 ({ id }: RequestAuthorizeReject): boolean {
    const queued = this.#koniState.getAuthRequestV2(id);

    assert(queued, 'Unable to find request');

    const { reject } = queued;

    reject(new Error('Rejected'));

    return true;
  }

  private authorizeCancelV2 ({ id }: RequestAuthorizeCancel): boolean {
    const queued = this.#koniState.getAuthRequestV2(id);

    assert(queued, 'Unable to find request');

    const { reject } = queued;

    // Reject without error meaning cancel
    reject(new Error('Cancelled'));

    return true;
  }

  private _forgetSite (url: string, callBack?: (value: AuthUrls) => void) {
    this.#koniState.getAuthorize((value) => {
      assert(value, 'The source is not known');

      delete value[url];

      this.#koniState.setAuthorize(value, () => {
        callBack && callBack(value);
      });
    });
  }

  private forgetSite (data: RequestForgetSite, id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pri(authorize.forgetSite)'>(id, port);

    this._forgetSite(data.url, (items) => {
      cb(items);
    });

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return true;
  }

  private _forgetAllSite (callBack?: (value: AuthUrls) => void) {
    this.#koniState.getAuthorize((value) => {
      assert(value, 'The source is not known');

      value = {};

      this.#koniState.setAuthorize(value, () => {
        callBack && callBack(value);
      });
    });
  }

  private forgetAllSite (id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pri(authorize.forgetAllSite)'>(id, port);

    this._forgetAllSite((items) => {
      cb(items);
    });

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return true;
  }

  private getNonReadonlyAccounts (): string[] {
    const storedAccounts = accountsObservable.subject.getValue();
    const transformedAccounts = transformAccounts(storedAccounts);

    return transformedAccounts.filter((a) => !a.isReadOnly).map((a) => a.address);
  }

  private isAddressValidWithAuthType (address: string, accountAuthType?: AccountAuthType): boolean {
    if (accountAuthType === 'substrate') {
      return !isEthereumAddress(address);
    } else if (accountAuthType === 'evm') {
      return isEthereumAddress(address);
    }

    return true;
  }

  private filterAccountsByAccountAuthType (accounts: string[], accountAuthType?: AccountAuthType): string[] {
    if (accountAuthType === 'substrate') {
      return accounts.filter((address) => !isEthereumAddress(address));
    } else if (accountAuthType === 'evm') {
      return accounts.filter((address) => isEthereumAddress(address));
    } else {
      return accounts;
    }
  }

  private _changeAuthorizationAll (connectValue: boolean, callBack?: (value: AuthUrls) => void) {
    this.#koniState.getAuthorize((value) => {
      assert(value, 'The source is not known');

      const nonReadonlyAccounts = this.getNonReadonlyAccounts();

      Object.keys(value).forEach((url) => {
        const targetAccounts = this.filterAccountsByAccountAuthType(nonReadonlyAccounts, value[url].accountAuthType);

        targetAccounts.forEach((address) => {
          value[url].isAllowedMap[address] = connectValue;
        });
      });
      this.#koniState.setAuthorize(value, () => {
        callBack && callBack(value);
      });
    });
  }

  private changeAuthorizationAll (data: RequestAuthorization, id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pri(authorize.changeSite)'>(id, port);

    this._changeAuthorizationAll(data.connectValue, (items) => {
      cb(items);
    });

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return true;
  }

  private _changeAuthorization (url: string, connectValue: boolean, callBack?: (value: AuthUrls) => void) {
    this.#koniState.getAuthorize((value) => {
      assert(value[url], 'The source is not known');

      const nonReadonlyAccounts = this.getNonReadonlyAccounts();
      const targetAccounts = this.filterAccountsByAccountAuthType(nonReadonlyAccounts, value[url].accountAuthType);

      targetAccounts.forEach((address) => {
        value[url].isAllowedMap[address] = connectValue;
      });
      this.#koniState.setAuthorize(value, () => {
        callBack && callBack(value);
      });
    });
  }

  public toggleAuthorization2 (url: string): Promise<ResponseAuthorizeList> {
    return new Promise((resolve) => {
      this.#koniState.getAuthorize((value) => {
        assert(value[url], 'The source is not known');

        value[url].isAllowed = !value[url].isAllowed;

        this.#koniState.setAuthorize(value, () => {
          resolve({ list: value });
        });
      });
    });
  }

  private changeAuthorization (data: RequestAuthorization, id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pri(authorize.changeSite)'>(id, port);

    this._changeAuthorization(data.url, data.connectValue, (items) => {
      cb(items);
    });

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return true;
  }

  private _changeAuthorizationPerAcc (address: string, connectValue: boolean, url: string, callBack?: (value: AuthUrls) => void) {
    this.#koniState.getAuthorize((value) => {
      assert(value, 'The source is not known');

      if (this.isAddressValidWithAuthType(address, value[url].accountAuthType)) {
        value[url].isAllowedMap[address] = connectValue;

        console.log('Devbu: ', value);

        this.#koniState.setAuthorize(value, () => {
          callBack && callBack(value);
        });
      } else {
        callBack && callBack(value);
      }
    });
  }

  private _changeAuthorizationBlock (connectValue: boolean, id: string) {
    this.#koniState.getAuthorize((value) => {
      assert(value, 'The source is not known');

      value[id].isAllowed = connectValue;

      console.log('Devbu: ', value);

      this.#koniState.setAuthorize(value);
    });
  }

  private _changeAuthorizationPerSite (values: Record<string, boolean>, id: string) {
    this.#koniState.getAuthorize((value) => {
      assert(value, 'The source is not known');

      value[id].isAllowedMap = values;

      console.log('Devbu: ', value);

      this.#koniState.setAuthorize(value);
    });
  }

  private changeAuthorizationPerAcc (data: RequestAuthorizationPerAccount, id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pri(authorize.changeSitePerAccount)'>(id, port);

    this._changeAuthorizationPerAcc(data.address, data.connectValue, data.url, (items) => {
      cb(items);
    });

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return true;
  }

  private changeAuthorizationPerSite (data: RequestAuthorizationPerSite): boolean {
    this._changeAuthorizationPerSite(data.values, data.id);

    return true;
  }

  private changeAuthorizationBlock (data: RequestAuthorizationBlock): boolean {
    this._changeAuthorizationBlock(data.connectedValue, data.id);

    return true;
  }

  private async getSettings (): Promise<RequestSettingsType> {
    return await new Promise((resolve) => {
      this.#koniState.getSettings((value) => {
        resolve(value);
      });
    });
  }

  private toggleBalancesVisibility (id: string, port: chrome.runtime.Port) {
    const cb = createSubscription<'pri(settings.changeBalancesVisibility)'>(id, port);

    this.#koniState.getSettings((value) => {
      const updateValue = {
        ...value,
        isShowBalance: !value.isShowBalance
      };

      this.#koniState.setSettings(updateValue, () => {
        // eslint-disable-next-line node/no-callback-literal
        cb(updateValue);
      });
    });

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return true;
  }

  private saveAccountAllLogo (data: string, id: string, port: chrome.runtime.Port) {
    const cb = createSubscription<'pri(settings.saveAccountAllLogo)'>(id, port);

    this.#koniState.getSettings((value) => {
      const updateValue = {
        ...value,
        accountAllLogo: data
      };

      this.#koniState.setSettings(updateValue, () => {
        // eslint-disable-next-line node/no-callback-literal
        cb(updateValue);
      });
    });

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return true;
  }

  private saveTheme (data: ThemeNames, id: string, port: chrome.runtime.Port) {
    const cb = createSubscription<'pri(settings.saveTheme)'>(id, port);

    this.#koniState.setTheme(data, cb);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return true;
  }

  private setCamera ({ camera }: RequestCameraSettings) {
    this.#koniState.setCamera(camera);

    return true;
  }

  private saveBrowserConfirmationType (data: BrowserConfirmationType, id: string, port: chrome.runtime.Port) {
    const cb = createSubscription<'pri(settings.saveBrowserConfirmationType)'>(id, port);

    this.#koniState.setBrowserConfirmationType(data, cb);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return true;
  }

  private async subscribeSettings (id: string, port: chrome.runtime.Port) {
    const cb = createSubscription<'pri(settings.subscribe)'>(id, port);

    const balancesVisibilitySubscription = this.#koniState.subscribeSettingsSubject().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    this.createUnsubscriptionHandle(id, balancesVisibilitySubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return await this.getSettings();
  }

  private async subscribeAuthUrls (id: string, port: chrome.runtime.Port): Promise<AuthUrls> {
    const cb = createSubscription<'pri(authorize.subscribe)'>(id, port);

    const authorizeUrlSubscription = this.#koniState.subscribeAuthorizeUrlSubject().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    this.createUnsubscriptionHandle(id, authorizeUrlSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return await this.#koniState.getAuthList();
  }

  private _saveCurrentAccountAddress (address: string, callback?: (data: CurrentAccountInfo) => void) {
    this.#koniState.getCurrentAccount((accountInfo) => {
      if (!accountInfo) {
        accountInfo = {
          address,
          currentGenesisHash: ALL_GENESIS_HASH,
          allGenesisHash: ALL_GENESIS_HASH || undefined
        };
      } else {
        accountInfo.address = address;

        if (address !== ALL_ACCOUNT_KEY) {
          const currentKeyPair = keyring.getAccount(address);

          accountInfo.currentGenesisHash = currentKeyPair?.meta.genesisHash as string || ALL_GENESIS_HASH;
        } else {
          accountInfo.currentGenesisHash = accountInfo.allGenesisHash || ALL_GENESIS_HASH;
        }
      }

      this.#koniState.setCurrentAccount(accountInfo, () => {
        callback && callback(accountInfo);
      });
    });
  }

  private updateCurrentAccountAddress (address: string): boolean {
    this._saveCurrentAccountAddress(address, () => {
      this.triggerAccountsSubscription();
    });

    return true;
  }

  private saveCurrentAccountAddress (data: RequestCurrentAccountAddress, id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pri(currentAccount.saveAddress)'>(id, port);

    this._saveCurrentAccountAddress(data.address, cb);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return true;
  }

  private getAssetSetting (): Promise<Record<string, AssetSetting>> {
    return new Promise<Record<string, AssetSetting>>((resolve, reject) => {
      this.#koniState.getAssetSettings((rs: Record<string, AssetSetting>) => {
        resolve(rs);
      });
    });
  }

  private subscribeAssetSetting (id: string, port: chrome.runtime.Port): Promise<Record<string, AssetSetting>> {
    const cb = createSubscription<'pri(assetSetting.getSubscription)'>(id, port);

    const assetSettingSubscription = this.#koniState.subscribeAssetSettings().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    this.createUnsubscriptionHandle(id, assetSettingSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.getAssetSetting();
  }

  private updateAssetSetting (params: AssetSettingUpdateReq): boolean {
    try {
      this.#koniState.updateAssetSetting(params.tokenSlug, params.assetSetting);

      return true;
    } catch (e) {
      console.error('Error updating asset setting', e);

      return false;
    }
  }

  private async getPrice (): Promise<PriceJson> {
    return this.#koniState.priceService.getPrice();
  }

  private subscribePrice (id: string, port: chrome.runtime.Port): Promise<PriceJson> {
    const cb = createSubscription<'pri(price.getSubscription)'>(id, port);

    const priceSubscription = this.#koniState.priceService.getPriceSubject()
      .subscribe((rs) => {
        cb(rs);
      });

    this.createUnsubscriptionHandle(id, priceSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.getPrice();
  }

  private getBalance (reset?: boolean): BalanceJson {
    return this.#koniState.getBalance(reset);
  }

  private subscribeBalance (id: string, port: chrome.runtime.Port): BalanceJson {
    const cb = createSubscription<'pri(balance.getSubscription)'>(id, port);

    const balanceSubscription = this.#koniState.subscribeBalance().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    this.createUnsubscriptionHandle(id, balanceSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.getBalance(true);
  }

  private getCrowdloan (reset?: boolean): CrowdloanJson {
    return this.#koniState.getCrowdloan(reset);
  }

  private subscribeCrowdloan (id: string, port: chrome.runtime.Port): CrowdloanJson {
    const cb = createSubscription<'pri(crowdloan.getSubscription)'>(id, port);

    const crowdloanSubscription = this.#koniState.subscribeCrowdloan().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    this.createUnsubscriptionHandle(id, crowdloanSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.getCrowdloan(true);
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
    this.#koniState.getAuthorize((value) => {
      if (value && Object.keys(value).length) {
        Object.keys(value).forEach((url) => {
          if (this.isAddressValidWithAuthType(address, value[url].accountAuthType)) {
            value[url].isAllowedMap[address] = isAllowed;
          }
        });

        this.#koniState.setAuthorize(value);
      }
    });
  }

  private _addAddressesToAuthList (addresses: string[], isAllowed: boolean): void {
    this.#koniState.getAuthorize((value) => {
      if (value && Object.keys(value).length) {
        Object.keys(value).forEach((url) => {
          addresses.forEach((address) => {
            value[url].isAllowedMap[address] = isAllowed;
          });
        });/**/

        this.#koniState.setAuthorize(value);
      }
    });
  }

  private async accountsCreateSuriV2 ({ genesisHash,
    isAllowed,
    name,
    password,
    suri: _suri,
    types }: RequestAccountCreateSuriV2): Promise<ResponseAccountCreateSuriV2> {
    const addressDict = {} as Record<KeypairType, string>;
    let changedAccount = false;
    const hasMasterPassword = keyring.keyring.hasMasterPassword;

    if (!hasMasterPassword) {
      if (!password) {
        throw Error('Require password to set up master password');
      } else {
        keyring.changeMasterPassword(password);
        this.#koniState.setKeyringState({
          hasMasterPassword: true,
          isLocked: false,
          isReady: true
        });
      }
    }

    const currentAccount = await new Promise<CurrentAccountInfo>((resolve) => {
      this.#koniState.getCurrentAccount(resolve);
    });
    const allGenesisHash = currentAccount?.allGenesisHash || undefined;

    types?.forEach((type) => {
      const suri = getSuri(_suri, type);
      const address = keyring.createFromUri(suri, {}, type).address;

      addressDict[type] = address;
      const newAccountName = type === 'ethereum' ? `${name} - EVM` : name;

      keyring.addUri(suri, { genesisHash, name: newAccountName }, type);
      this._addAddressToAuthList(address, isAllowed);

      if (!changedAccount) {
        if (types.length === 1) {
          this.#koniState.setCurrentAccount({ address, currentGenesisHash: genesisHash || null, allGenesisHash });
        } else {
          this.#koniState.setCurrentAccount({
            address: ALL_ACCOUNT_KEY,
            currentGenesisHash: allGenesisHash || null,
            allGenesisHash
          });
        }

        changedAccount = true;
      }
    });

    await new Promise<void>((resolve) => {
      this.#koniState.addAccountRef(Object.values(addressDict), () => {
        resolve();
      });
    });

    return addressDict;
  }

  private async accountsForgetOverride ({ address }: RequestAccountForget): Promise<boolean> {
    keyring.forgetAccount(address);
    await new Promise<void>((resolve) => {
      this.#koniState.removeAccountRef(address, () => {
        resolve();
      });
    });

    await new Promise<void>((resolve) => {
      this.#koniState.getAuthorize((value) => {
        if (value && Object.keys(value).length) {
          Object.keys(value).forEach((url) => {
            delete value[url].isAllowedMap[address];
          });

          this.#koniState.setAuthorize(value, resolve);
        } else {
          resolve();
        }
      });
    });

    // Set current account to all account
    await new Promise<void>((resolve) => {
      this.#koniState.getCurrentAccount(({ allGenesisHash }) => {
        this.#koniState.setCurrentAccount({
          currentGenesisHash: allGenesisHash || null,
          address: ALL_ACCOUNT_KEY
        }, resolve);
      });
    });

    return true;
  }

  private seedCreateV2 ({ length = SEED_DEFAULT_LENGTH,
    seed: _seed,
    types }: RequestSeedCreateV2): ResponseSeedCreateV2 {
    const seed = _seed || mnemonicGenerate(length);
    const rs = { seed: seed, addressMap: {} } as ResponseSeedCreateV2;

    types?.forEach((type) => {
      rs.addressMap[type] = keyring.createFromUri(getSuri(seed, type), {}, type).address;
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

  private _checkValidatePrivateKey ({ suri,
    types }: RequestSeedValidateV2, autoAddPrefix = false): ResponsePrivateKeyValidateV2 {
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

  private deriveV2 (parentAddress: string, suri: string, metadata: KeyringPair$Meta): KeyringPair {
    const parentPair = keyring.getPair(parentAddress);

    if (parentPair.isLocked) {
      keyring.unlockPair(parentPair.address);
    }

    try {
      return parentPair.derive(suri, metadata);
    } catch (err) {
      throw new Error(`"${suri}" is not a valid derivation path`);
    }
  }

  private derivationCreateV2 ({ genesisHash,
    isAllowed,
    name,
    parentAddress,
    suri }: RequestDeriveCreateV2): boolean {
    const childPair = this.deriveV2(parentAddress, suri, {
      genesisHash,
      name,
      parentAddress,
      suri
    });

    const address = childPair.address;

    this._saveCurrentAccountAddress(address, () => {
      keyring.addPair(childPair, true);
      this._addAddressToAuthList(address, isAllowed);
    });

    return true;
  }

  private jsonRestoreV2 ({ address, file, isAllowed, password, withMasterPassword }: RequestJsonRestoreV2): void {
    const isPasswordValidated = this.validatePassword(file, password);

    if (isPasswordValidated) {
      try {
        this._saveCurrentAccountAddress(address, () => {
          keyring.restoreAccount(file, password, withMasterPassword);
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
      this.#koniState.getNftTransferSubscription((rs: NftTransferExtra) => {
        resolve(rs);
      });
    });
  }

  private async subscribeNftTransfer (id: string, port: chrome.runtime.Port): Promise<NftTransferExtra> {
    const cb = createSubscription<'pri(nftTransfer.getSubscription)'>(id, port);
    const nftTransferSubscription = this.#koniState.subscribeNftTransfer().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    this.createUnsubscriptionHandle(id, nftTransferSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.getNftTransfer();
  }

  private getNftCollection (): Promise<NftCollection[]> {
    return this.#koniState.getNftCollection();
  }

  private subscribeNftCollection (id: string, port: chrome.runtime.Port): Promise<NftCollection[]> {
    const cb = createSubscription<'pri(nftCollection.getSubscription)'>(id, port);
    const nftCollectionSubscription = this.#koniState.subscribeNftCollection().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    this.createUnsubscriptionHandle(id, nftCollectionSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.getNftCollection();
  }

  private getNft (): Promise<NftJson | undefined> {
    return this.#koniState.getNft();
  }

  private async subscribeNft (id: string, port: chrome.runtime.Port): Promise<NftJson | null | undefined> {
    const cb = createSubscription<'pri(nft.getSubscription)'>(id, port);
    const nftSubscription = this.#koniState.subscribeNft().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    this.createUnsubscriptionHandle(id, nftSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.getNft();
  }

  private getStakingReward (): Promise<StakingRewardJson> {
    return new Promise<StakingRewardJson>((resolve, reject) => {
      this.#koniState.getStakingReward((rs: StakingRewardJson) => {
        resolve(rs);
      });
    });
  }

  private subscribeStakingReward (id: string, port: chrome.runtime.Port): Promise<StakingRewardJson | null> {
    const cb = createSubscription<'pri(stakingReward.getSubscription)'>(id, port);
    const stakingRewardSubscription = this.#koniState.subscribeStakingReward().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    this.createUnsubscriptionHandle(id, stakingRewardSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.getStakingReward();
  }

  private async getStaking (): Promise<StakingJson> {
    return this.#koniState.getStaking();
  }

  private async subscribeStaking (id: string, port: chrome.runtime.Port): Promise<StakingJson> {
    const cb = createSubscription<'pri(staking.getSubscription)'>(id, port);
    const stakingSubscription = this.#koniState.subscribeStaking().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    this.createUnsubscriptionHandle(id, stakingSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return await this.getStaking();
  }

  private async subscribeHistory (id: string, port: chrome.runtime.Port): Promise<TransactionHistoryItem[]> {
    const cb = createSubscription<'pri(transaction.history.getSubscription)'>(id, port);

    const historySubject = await this.#koniState.historyService.getHistorySubject();

    historySubject.subscribe(cb);

    this.createUnsubscriptionHandle(id, historySubject.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return historySubject.getValue();
  }

  private setNftTransfer (request: NftTransferExtra): boolean {
    this.#koniState.setNftTransfer(request);

    return true;
  }

  private forceUpdateNftState (request: RequestNftForceUpdate): boolean {
    if (!request.isSendingSelf) {
      this.#koniState.removeNfts(request.chain, request.senderAddress, request.collectionId, [request.nft.id || '']).catch((e) => console.warn(e));

      this.isInWalletAccount(request.recipientAddress).then((res) => {
        if (res) {
          this.#koniState.updateNftData(request.chain, request.nft, request.recipientAddress);
        }
      }).catch((err) => console.warn(err));
    }

    return true;
  }

  private validateTransfer (tokenSlug: string, from: string, to: string, value: string | undefined, transferAll: boolean | undefined): [TransactionError[], KeyringPair | undefined, BN | undefined, _ChainAsset] {
    const errors: TransactionError[] = [];
    const keypair = keyring.getPair(from);
    let transferValue;

    if (!transferAll) {
      if (value === undefined) {
        errors.push(new TransactionError(BasicTxErrorType.INVALID_PARAMS, 'Require transfer value'));
      }

      if (value) {
        transferValue = new BN(value);
      }
    }

    const tokenInfo = this.#koniState.getAssetBySlug(tokenSlug);

    if (!tokenInfo) {
      errors.push(new TransactionError(BasicTxErrorType.INVALID_PARAMS, 'Not found token from registry'));
    }

    if (isEthereumAddress(from) && isEthereumAddress(to) && !_isNativeToken(tokenInfo) && !_isTokenEvmSmartContract(tokenInfo)) {
      errors.push(new TransactionError(BasicTxErrorType.INVALID_PARAMS, 'Not found ERC20 address for this token'));
    }

    return [errors, keypair, transferValue, tokenInfo];
  }

  private async makeTransfer (inputData: RequestTransfer): Promise<SWTransactionResponse> {
    const { from, networkKey, to, tokenSlug, transferAll, value } = inputData;
    const [errors, , , tokenInfo] = this.validateTransfer(tokenSlug, from, to, value, transferAll);

    const warnings: TransactionWarning[] = [];
    const evmApiMap = this.#koniState.getEvmApiMap();
    const chainInfo = this.#koniState.getChainInfo(networkKey);

    const nativeTokenInfo = this.#koniState.getNativeTokenInfo(networkKey);
    const nativeTokenSlug: string = nativeTokenInfo.slug;
    const isTransferNativeToken = nativeTokenSlug === tokenSlug;
    let chainType = ChainType.SUBSTRATE;

    const tokenBaseAmount: AmountData = { value: '0', symbol: tokenInfo.symbol, decimals: tokenInfo.decimals || 0 };
    const transferAmount: AmountData = { ...tokenBaseAmount };

    let transaction: ValidateTransactionResponseInput['transaction'];

    // Get native token amount
    const freeBalance = await this.#koniState.balanceService.getTokenFreeBalance(from, networkKey, tokenSlug);

    if (isEthereumAddress(from) && isEthereumAddress(to)) {
      chainType = ChainType.EVM;
      const txVal: string = transferAll ? freeBalance.value : (value || '0');

      // Estimate with EVM API
      if (_isTokenEvmSmartContract(tokenInfo)) {
        [
          transaction,
          transferAmount.value
        ] = await getERC20TransactionObject(_getContractAddressOfToken(tokenInfo), chainInfo, from, to, txVal, !!transferAll, evmApiMap);
      } else {
        [
          transaction,
          transferAmount.value
        ] = await getEVMTransactionObject(chainInfo, to, txVal, !!transferAll, evmApiMap);
      }
    } else {
      const substrateApi = this.#koniState.getSubstrateApi(networkKey);

      [transaction, transferAmount.value] = await createTransferExtrinsic({
        transferAll: !!transferAll,
        value: value || '0',
        from: from,
        networkKey,
        tokenInfo,
        to: to,
        substrateApi
      });
    }

    // Additional validator
    const additionalValidator = (swTran: SWTransactionResponse) => {
      if (new BN(freeBalance.value).lt(new BN(transferAmount.value))) {
        swTran.errors?.push(new TransactionError(BasicTxErrorType.NOT_ENOUGH_BALANCE));
      }

      return Promise.resolve();
    };

    return this.#koniState.transactionService.handleTransaction({
      errors,
      warnings,
      address: from,
      chain: networkKey,
      chainType,
      transferNativeAmount: isTransferNativeToken ? transferAmount.value : '0',
      transaction,
      data: inputData,
      additionalValidator,
      extrinsicType: isTransferNativeToken ? ExtrinsicType.TRANSFER_BALANCE : ExtrinsicType.TRANSFER_TOKEN
    });
  }

  private validateCrossChainTransfer (
    destinationNetworkKey: string,
    sendingTokenSlug: string,
    sender: string,
    sendingValue: string): [TransactionError[], KeyringPair | undefined, BN | undefined, _ChainAsset, _ChainAsset | undefined] {
    const errors = [] as TransactionError[];
    const keypair = keyring.getPair(sender);
    const transferValue = new BN(sendingValue);

    const originTokenInfo = this.#koniState.getAssetBySlug(sendingTokenSlug);
    const destinationTokenInfo = this.#koniState.getXcmEqualAssetByChain(destinationNetworkKey, sendingTokenSlug);

    if (!destinationTokenInfo) {
      errors.push(new TransactionError(TransferTxErrorType.INVALID_TOKEN, 'Not found token from registry'));
    }

    return [errors, keypair, transferValue, originTokenInfo, destinationTokenInfo];
  }

  private async makeCrossChainTransfer (inputData: RequestCrossChainTransfer): Promise<SWTransactionResponse> {
    const { destinationNetworkKey, from, originNetworkKey, sendingTokenSlug, to, value } = inputData;
    const [errors, fromKeyPair, , originTokenInfo, destinationTokenInfo] = this.validateCrossChainTransfer(destinationNetworkKey, sendingTokenSlug, from, value);
    let extrinsic: SubmittableExtrinsic<'promise'> | null = null;

    if (errors) {
      return this.#koniState.transactionService.generateBeforeHandleResponseErrors(errors);
    }

    if (fromKeyPair && destinationTokenInfo) {
      const substrateApiMap = this.#koniState.getSubstrateApiMap();
      const chainInfoMap = this.#koniState.getChainInfoMap();

      extrinsic = await createXcmExtrinsic({
        destinationTokenInfo,
        originTokenInfo,
        sendingValue: value || '0',
        recipient: to,
        chainInfoMap: chainInfoMap,
        substrateApiMap: substrateApiMap
      });
    }

    return await this.#koniState.transactionService.handleTransaction({
      url: EXTENSION_REQUEST_URL,
      address: from,
      chain: originNetworkKey,
      transaction: extrinsic,
      data: inputData,
      extrinsicType: ExtrinsicType.TRANSFER_XCM,
      chainType: ChainType.SUBSTRATE,
      transferNativeAmount: _isNativeToken(originTokenInfo) ? value : '0',
      errors
    });
  }

  private async evmNftSubmitTransaction (inputData: NftTransactionRequest): Promise<SWTransactionResponse> {
    const { networkKey, params, recipientAddress, senderAddress } = inputData;
    const contractAddress = params.contractAddress as string;
    const tokenId = params.tokenId as string;

    console.log(inputData);
    const transaction = await getERC721Transaction(this.#koniState.getEvmApi(networkKey), contractAddress, senderAddress, recipientAddress, tokenId);

    return await this.#koniState.transactionService.handleTransaction({
      address: senderAddress,
      chain: networkKey,
      chainType: ChainType.EVM,
      data: inputData,
      extrinsicType: ExtrinsicType.SEND_NFT,
      transaction,
      url: EXTENSION_REQUEST_URL
    });
  }

  private upsertChain (data: _NetworkUpsertParams): boolean {
    try {
      return this.#koniState.upsertChainInfo(data);
    } catch (e) {
      console.error(e);

      return false;
    }
  }

  private removeCustomChain (networkKey: string): boolean {
    return this.#koniState.removeCustomChain(networkKey);
  }

  private disableChain (networkKey: string): boolean {
    return this.#koniState.disableChain(networkKey);
  }

  private enableChain (networkKey: string): boolean {
    return this.#koniState.enableChain(networkKey);
  }

  private async validateNetwork ({ existedChainSlug,
    provider }: ValidateNetworkRequest): Promise<ValidateNetworkResponse> {
    return await this.#koniState.validateCustomChain(provider, existedChainSlug);
  }

  private resetDefaultNetwork (): boolean {
    return this.#koniState.resetDefaultChains();
  }

  private recoverDotSamaApi (networkKey: string): boolean {
    try {
      return this.#koniState.refreshSubstrateApi(networkKey);
    } catch (e) {
      console.error('error recovering substrate api', e);

      return false;
    }
  }

  private upsertCustomToken (data: _ChainAsset) {
    try {
      this.#koniState.upsertCustomToken(data);

      return true;
    } catch (e) {
      console.error('Error insert/update custom token', e);

      return false;
    }
  }

  private async deleteCustomAsset (assetSlug: string) {
    const assetInfo = this.#koniState.getAssetBySlug(assetSlug);

    if (assetInfo && _isCustomAsset(assetSlug)) {
      if (_isAssetSmartContractNft(assetInfo)) { // check if deleting a smart contract NFT
        await this.#koniState.deleteNftCollection(assetInfo.originChain, _getContractAddressOfToken(assetInfo));
      }

      this.#koniState.deleteCustomAssets([assetSlug]);

      return true;
    }

    return false;
  }

  private async validateCustomAsset (data: _ValidateCustomAssetRequest): Promise<_ValidateCustomAssetResponse> {
    return await this.#koniState.validateCustomAsset(data);
  }

  private async getAddressFreeBalance ({ address, networkKey, token }: RequestFreeBalance): Promise<AmountData> {
    return await this.#koniState.balanceService.getTokenFreeBalance(address, networkKey, token);
  }

  private async subscribeAddressFreeBalance ({ address, networkKey, token }: RequestFreeBalance, id: string, port: chrome.runtime.Port): Promise<AmountData> {
    const cb = createSubscription<'pri(freeBalance.subscribe)'>(id, port);

    const [unsub, currentFreeBalance] = await this.#koniState.balanceService.subscribeTokenFreeBalance(address, networkKey, token, cb);

    this.createUnsubscriptionHandle(
      id,
      unsub
    );

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return currentFreeBalance;
  }

  private async transferCheckReferenceCount ({ address,
    networkKey }: RequestTransferCheckReferenceCount): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
    return await checkReferenceCount(networkKey, address, this.#koniState.getSubstrateApiMap(), this.#koniState.getChainInfo(networkKey));
  }

  private async transferCheckSupporting ({ networkKey,
    tokenSlug }: RequestTransferCheckSupporting): Promise<SupportTransferResponse> {
    const tokenInfo = this.#koniState.getAssetBySlug(tokenSlug);

    return await checkSupportTransfer(networkKey, tokenInfo, this.#koniState.getSubstrateApiMap(), this.#koniState.getChainInfo(networkKey));
  }

  private transferGetExistentialDeposit ({ tokenSlug }: RequestTransferExistentialDeposit): string {
    const tokenInfo = this.#koniState.getAssetBySlug(tokenSlug);

    return _getTokenMinAmount(tokenInfo);
  }

  private async substrateNftSubmitTransaction (inputData: RequestSubstrateNftSubmitTransaction): Promise<NftTransactionResponse> {
    const { params, recipientAddress, senderAddress } = inputData;
    const isSendingSelf = isRecipientSelf(senderAddress, recipientAddress);

    // TODO: do better to detect tokenType
    const isPSP34 = params?.isPsp34 as boolean | undefined;
    const networkKey = params?.networkKey as string;

    const apiProps = this.#koniState.getSubstrateApi(networkKey);
    const extrinsic = !isPSP34
      ? getNftTransferExtrinsic(networkKey, apiProps, senderAddress, recipientAddress, params || {})
      : await getPSP34TransferExtrinsic(networkKey, apiProps, senderAddress, recipientAddress, params || {});

    const rs = await this.#koniState.transactionService.handleTransaction({
      address: senderAddress,
      chain: networkKey,
      transaction: extrinsic,
      data: { ...inputData, isSendingSelf },
      extrinsicType: ExtrinsicType.SEND_NFT,
      chainType: ChainType.SUBSTRATE
    });

    return { ...rs, isSendingSelf };
  }

  private enableChains (targetKeys: string[]) {
    try {
      for (const networkKey of targetKeys) {
        this.enableChain(networkKey);
      }
    } catch (e) {
      return false;
    }

    return true;
  }

  private getAccountMeta ({ address }: RequestAccountMeta): ResponseAccountMeta {
    const pair = keyring.getPair(address);

    assert(pair, 'Unable to find pair');

    return {
      meta: pair.meta
    };
  }

  private async isInWalletAccount (address?: string) {
    return new Promise((resolve) => {
      if (address) {
        accountsObservable.subject.subscribe((storedAccounts: SubjectInfo): void => {
          if (storedAccounts[address]) {
            resolve(true);
          }

          resolve(false);
        });
      } else {
        resolve(false);
      }
    });
  }

  private accountsTie2 ({ address, genesisHash }: RequestAccountTie): boolean {
    return this.#koniState.setAccountTie(address, genesisHash);
  }

  private async accountsCreateExternalV2 ({ address,
    genesisHash,
    isAllowed,
    isEthereum,
    isReadOnly,
    name }: RequestAccountCreateExternalV2): Promise<AccountExternalError[]> {
    try {
      let result: KeyringPair;

      try {
        const exists = keyring.getPair(address);

        if (exists) {
          if (exists.type === (isEthereum ? 'ethereum' : 'sr25519')) {
            return [{ code: AccountExternalErrorCode.INVALID_ADDRESS, message: 'Account exists' }];
          }
        }
      } catch (e) {

      }

      if (isEthereum) {
        const chainInfoMap = this.#koniState.getChainInfoMap();
        let _gen = '';

        if (genesisHash) {
          for (const network of Object.values(chainInfoMap)) {
            if (_getEvmChainId(network) === parseInt(genesisHash)) {
              // TODO: pure EVM chains do not have genesisHash
              _gen = _getSubstrateGenesisHash(network);
            }
          }
        }

        result = keyring.keyring.addFromAddress(address, {
          name,
          isExternal: true,
          isReadOnly,
          genesisHash: _gen
        }, null, 'ethereum');

        keyring.saveAccount(result);
      } else {
        result = keyring.addExternal(address, { genesisHash, name, isReadOnly }).pair;
      }

      const _address = result.address;

      await new Promise<void>((resolve) => {
        this.#koniState.addAccountRef([_address], () => {
          resolve();
        });
      });

      await new Promise<void>((resolve) => {
        this._saveCurrentAccountAddress(_address, () => {
          this._addAddressToAuthList(_address, isAllowed);
          resolve();
        });
      });

      return [];
    } catch (e) {
      return [{ code: AccountExternalErrorCode.KEYRING_ERROR, message: (e as Error).message }];
    }
  }

  private async accountsCreateHardwareV2 ({ accountIndex,
    address,
    addressOffset,
    genesisHash,
    hardwareType,
    isAllowed,
    name }: RequestAccountCreateHardwareV2): Promise<boolean> {
    const key = keyring.addHardware(address, hardwareType, {
      accountIndex,
      addressOffset,
      genesisHash,
      name,
      originGenesisHash: genesisHash
    });

    const result = key.pair;

    const _address = result.address;

    await new Promise<void>((resolve) => {
      this.#koniState.addAccountRef([_address], () => {
        resolve();
      });
    });

    await new Promise<void>((resolve) => {
      this._saveCurrentAccountAddress(_address, () => {
        this._addAddressToAuthList(_address, isAllowed || false);
        resolve();
      });
    });

    return true;
  }

  private async accountsCreateHardwareMultiple ({ accounts }: RequestAccountCreateHardwareMultiple): Promise<boolean> {
    const addresses: string[] = [];

    if (!accounts.length) {
      throw new Error('No accounts to import');
    }

    for (const account of accounts) {
      const { accountIndex, address, addressOffset, genesisHash, hardwareType, name } = account;
      const key = keyring.addHardware(address, hardwareType, {
        accountIndex,
        addressOffset,
        genesisHash,
        name,
        originGenesisHash: genesisHash
      });

      const result = key.pair;

      const _address = result.address;

      addresses.push(_address);

      await new Promise<void>((resolve) => {
        this._addAddressToAuthList(_address, true);
        resolve();
      });
    }

    const currentAccount = await new Promise<CurrentAccountInfo>((resolve) => {
      this.#koniState.getCurrentAccount(resolve);
    });

    const allGenesisHash = currentAccount?.allGenesisHash || undefined;

    if (addresses.length <= 1) {
      this.#koniState.setCurrentAccount({ address: addresses[0], currentGenesisHash: null, allGenesisHash });
    } else {
      this.#koniState.setCurrentAccount({
        address: ALL_ACCOUNT_KEY,
        currentGenesisHash: allGenesisHash || null,
        allGenesisHash
      });
    }

    await new Promise<void>((resolve) => {
      this.#koniState.addAccountRef(addresses, () => {
        resolve();
      });
    });

    return true;
  }

  private async accountsCreateWithSecret ({ isAllow,
    isEthereum,
    name,
    publicKey,
    secretKey }: RequestAccountCreateWithSecretKey): Promise<ResponseAccountCreateWithSecretKey> {
    try {
      let keyringPair: KeyringPair | null = null;

      if (isEthereum) {
        const _secret = hexStripPrefix(secretKey);

        if (_secret.length === 64) {
          const suri = `0x${_secret}`;
          const { phrase } = keyExtractSuri(suri);

          if (isHex(phrase) && isHex(phrase, 256)) {
            const type: KeypairType = 'ethereum';

            keyringPair = keyring.addUri(getSuri(suri, type), { name: name }, type).pair;
          }
        }
      } else {
        keyringPair = keyring.keyring.addFromPair({
          publicKey: hexToU8a(publicKey),
          secretKey: hexToU8a(secretKey)
        }, { name });
        keyring.addPair(keyringPair, true);
      }

      if (!keyringPair) {
        return {
          success: false,
          errors: [{ code: AccountExternalErrorCode.KEYRING_ERROR, message: 'Invalid keyring' }]
        };
      }

      const _address = keyringPair.address;

      await new Promise<void>((resolve) => {
        this.#koniState.addAccountRef([_address], () => {
          resolve();
        });
      });

      await new Promise<void>((resolve) => {
        this._saveCurrentAccountAddress(_address, () => {
          this._addAddressToAuthList(_address, isAllow);
          resolve();
        });
      });

      return {
        errors: [],
        success: true
      };
    } catch (e) {
      return {
        success: false,
        errors: [{ code: AccountExternalErrorCode.KEYRING_ERROR, message: (e as Error).message }]
      };
    }
  }

  /// External account

  private rejectExternalRequest (request: RequestRejectExternalRequest): ResponseRejectExternalRequest {
    const { id, message, throwError } = request;

    const promise = this.#koniState.getExternalRequest(id);

    if (promise.status === ExternalRequestPromiseStatus.PENDING && promise.reject) {
      if (throwError) {
        promise.reject(new Error(message));
      } else {
        promise.reject();
      }

      this.#koniState.updateExternalRequest(id, {
        status: ExternalRequestPromiseStatus.REJECTED,
        message: message,
        reject: undefined,
        resolve: undefined
      });
    }
  }

  private resolveQrTransfer (request: RequestResolveExternalRequest): ResponseResolveExternalRequest {
    const { data, id } = request;

    const promise = this.#koniState.getExternalRequest(id);

    if (promise.status === ExternalRequestPromiseStatus.PENDING) {
      promise.resolve && promise.resolve(data);
      this.#koniState.updateExternalRequest(id, {
        status: ExternalRequestPromiseStatus.COMPLETED,
        reject: undefined,
        resolve: undefined
      });
    }
  }

  private subscribeConfirmations (id: string, port: chrome.runtime.Port) {
    const cb = createSubscription<'pri(confirmations.subscribe)'>(id, port);

    const subscription = this.#koniState.getConfirmationsQueueSubject().subscribe(cb);

    this.createUnsubscriptionHandle(id, subscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.#koniState.getConfirmationsQueueSubject().getValue();
  }

  private async completeConfirmation (request: RequestConfirmationComplete) {
    return await this.#koniState.completeConfirmation(request);
  }

  /// Sign Qr

  private getNetworkJsonByChainId (chainId?: number): _ChainInfo | null {
    const chainInfoMap = this.#koniState.getChainInfoMap();

    if (!chainId) {
      for (const n in chainInfoMap) {
        if (!Object.prototype.hasOwnProperty.call(chainInfoMap, n)) {
          continue;
        }

        const networkInfo = chainInfoMap[n];

        if (_isChainEvmCompatible(networkInfo)) {
          return networkInfo;
        }
      }

      return null;
    }

    for (const n in chainInfoMap) {
      if (!Object.prototype.hasOwnProperty.call(chainInfoMap, n)) {
        continue;
      }

      const networkInfo = chainInfoMap[n];

      if (_getEvmChainId(networkInfo) === chainId) {
        return networkInfo;
      }
    }

    return null;
  }

  // Parse transaction

  private parseSubstrateTransaction ({ data,
    networkKey }: RequestParseTransactionSubstrate): ResponseParseTransactionSubstrate {
    const apiProps = this.#koniState.getSubstrateApi(networkKey);
    const apiPromise = apiProps.api;

    return parseSubstrateTransaction(data, apiPromise);
  }

  private async parseEVMRLP ({ data }: RequestQrParseRLP): Promise<ResponseQrParseRLP> {
    return await parseEvmRlp(data, this.#koniState.getChainInfoMap(), this.#koniState.getEvmApiMap());
  }

  // Sign

  private qrSignSubstrate ({ address, data, networkKey }: RequestQrSignSubstrate): ResponseQrSignSubstrate {
    const pair = keyring.getPair(address);

    assert(pair, 'Unable to find pair');

    if (pair.isLocked) {
      keyring.unlockPair(pair.address);
    }

    let signed = hexStripPrefix(u8aToHex(pair.sign(data, { withType: true })));
    const network = this.#koniState.getChainInfo(networkKey);

    if (_isChainEvmCompatible(network)) {
      signed = signed.substring(2);
    }

    return {
      signature: signed
    };
  }

  private async qrSignEVM ({ address, chainId, message, type }: RequestQrSignEvm): Promise<ResponseQrSignEvm> {
    let signed: string;
    const network: _ChainInfo | null = this.getNetworkJsonByChainId(chainId);

    if (!network) {
      throw new Error('Cannot find network');
    }

    const pair = keyring.getPair(address);

    if (!pair) {
      throw Error('Unable to find pair');
    }

    if (pair.isLocked) {
      keyring.unlockPair(pair.address);
    }

    if (type === 'message') {
      let data = message;

      if (isHex(message)) {
        data = message;
      } else if (isAscii(message)) {
        data = `0x${message}`;
      }

      signed = await pair.evmSigner.signMessage(data, 'personal_sign');
    } else {
      const tx: QrTransaction | null = createTransactionFromRLP(message);

      if (!tx) {
        throw new Error(`Cannot create tx from ${message}`);
      }

      const txObject: TransactionConfig = {
        gasPrice: new BigN(tx.gasPrice).toNumber(),
        to: tx.action,
        value: new BigN(tx.value).toNumber(),
        data: tx.data,
        nonce: new BigN(tx.nonce).toNumber(),
        gas: new BigN(tx.gas).toNumber()
      };

      const common = Common.forCustomChain('mainnet', {
        name: network.name,
        networkId: _getEvmChainId(network),
        chainId: _getEvmChainId(network)
      }, 'petersburg');

      // @ts-ignore
      const transaction = new Transaction(txObject, { common });

      pair.evmSigner.signTransaction(transaction);
      signed = signatureToHex({
        r: u8aToHex(transaction.r),
        s: u8aToHex(transaction.s),
        v: u8aToHex(transaction.v)
      });
    }

    return {
      signature: hexStripPrefix(signed)
    };
  }

  private async subscribeChainStakingMetadata (id: string, port: chrome.runtime.Port) {
    const cb = createSubscription<'pri(bonding.subscribeChainStakingMetadata)'>(id, port);

    const chainStakingMetadata = this.#koniState.subscribeChainStakingMetadata().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    this.createUnsubscriptionHandle(id, chainStakingMetadata.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.#koniState.getChainStakingMetadata();
  }

  private async subscribeStakingNominatorMetadata (id: string, port: chrome.runtime.Port) {
    const cb = createSubscription<'pri(bonding.subscribeNominatorMetadata)'>(id, port);

    const nominatorMetadata = this.#koniState.subscribeNominatorMetadata().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    this.createUnsubscriptionHandle(id, nominatorMetadata.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.#koniState.getNominatorMetadata();
  }

  private async getBondingOptions ({ chain, type }: BondingOptionParams): Promise<ValidatorInfo[] | undefined> {
    const apiProps = this.#koniState.getSubstrateApi(chain);
    const chainInfo = this.#koniState.getChainInfo(chain);
    const chainStakingMetadata = await this.#koniState.getStakingMetadataByChain(chain, type);

    if (!chainStakingMetadata) {
      return;
    }

    const { decimals } = _getChainNativeTokenBasicInfo(chainInfo);

    return await getValidatorsInfo(chain, apiProps, decimals, chainStakingMetadata);
  }

  private async getNominationPoolOptions (chain: string): Promise<NominationPoolInfo[]> {
    const substrateApi = this.#koniState.getSubstrateApi(chain);

    return await getNominationPoolsInfo(chain, substrateApi);
  }

  private async submitBonding (inputData: RequestBondingSubmit): Promise<SWTransactionResponse> {
    const { amount, chain, nominatorMetadata, selectedValidators } = inputData;

    if (!amount || !nominatorMetadata || !selectedValidators) {
      // Todo: Check and return error here

      return this.#koniState.transactionService
        .generateBeforeHandleResponseErrors([new TransactionError(BasicTxErrorType.INVALID_PARAMS)]);
    }

    const chainInfo = this.#koniState.getChainInfo(chain);
    const substrateApi = this.#koniState.getSubstrateApi(chain);
    const extrinsic = await getBondingExtrinsic(chainInfo, amount, nominatorMetadata, selectedValidators, substrateApi);

    return await this.#koniState.transactionService.handleTransaction({
      address: nominatorMetadata.address,
      chain: chain,
      chainType: ChainType.SUBSTRATE,
      data: inputData,
      extrinsicType: ExtrinsicType.STAKING_BOND,
      transaction: extrinsic,
      url: EXTENSION_REQUEST_URL
    });
  }

  private async submitUnbonding (inputData: RequestUnbondingSubmit): Promise<SWTransactionResponse> {
    const { amount, chain, nominatorMetadata, validatorAddress } = inputData;

    if (!amount || !nominatorMetadata) {
      return this.#koniState.transactionService.generateBeforeHandleResponseErrors([new TransactionError(BasicTxErrorType.INVALID_PARAMS)]);
    }

    const substrateApi = this.#koniState.getSubstrateApi(chain);
    const extrinsic = await getUnbondingExtrinsic(nominatorMetadata, amount, chain, substrateApi, validatorAddress);

    return await this.#koniState.transactionService.handleTransaction({
      address: nominatorMetadata.address,
      chain: chain,
      transaction: extrinsic,
      data: inputData,
      extrinsicType: ExtrinsicType.STAKING_UNBOND,
      chainType: ChainType.SUBSTRATE
    });
  }

  private async submitStakeWithdrawal (inputData: RequestStakeWithdrawal): Promise<SWTransactionResponse> {
    const { chain, nominatorMetadata, validatorAddress } = inputData;

    if (!nominatorMetadata) {
      return this.#koniState.transactionService.generateBeforeHandleResponseErrors([new TransactionError(BasicTxErrorType.INVALID_PARAMS)]);
    }

    const dotSamaApi = this.#koniState.getSubstrateApi(chain);
    const extrinsic = await getWithdrawalExtrinsic(dotSamaApi, chain, nominatorMetadata, validatorAddress);

    return await this.#koniState.transactionService.handleTransaction({
      address: nominatorMetadata.address,
      chain: chain,
      transaction: extrinsic,
      data: inputData,
      extrinsicType: ExtrinsicType.STAKING_WITHDRAW,
      chainType: ChainType.SUBSTRATE
    });
  }

  private async submitStakeClaimReward (inputData: RequestStakeClaimReward): Promise<SWTransactionResponse> {
    const { address, bondReward, chain, stakingType } = inputData;

    if (!address) {
      return this.#koniState.transactionService.generateBeforeHandleResponseErrors([new TransactionError(BasicTxErrorType.INVALID_PARAMS)]);
    }

    const substrateApi = this.#koniState.getSubstrateApi(chain);
    const extrinsic = await getClaimRewardExtrinsic(substrateApi, chain, address, stakingType, bondReward);

    return await this.#koniState.transactionService.handleTransaction({
      address,
      chain: chain,
      transaction: extrinsic,
      data: inputData,
      extrinsicType: ExtrinsicType.STAKING_CLAIM_REWARD,
      chainType: ChainType.SUBSTRATE
    });
  }

  private async submitCancelStakeWithdrawal (inputData: RequestStakeCancelWithdrawal): Promise<SWTransactionResponse> {
    const { address, chain, selectedUnstaking } = inputData;

    if (!chain || !selectedUnstaking) {
      return this.#koniState.transactionService.generateBeforeHandleResponseErrors([new TransactionError(BasicTxErrorType.INVALID_PARAMS)]);
    }

    const substrateApi = this.#koniState.getSubstrateApi(chain);
    const extrinsic = await getCancelWithdrawalExtrinsic(substrateApi, chain, selectedUnstaking);

    return await this.#koniState.transactionService.handleTransaction({
      address,
      chain,
      transaction: extrinsic,
      data: inputData,
      extrinsicType: ExtrinsicType.STAKING_CANCEL_UNSTAKE,
      chainType: ChainType.SUBSTRATE
    });
  }

  private async submitPoolingBonding (inputData: RequestStakePoolingBonding): Promise<SWTransactionResponse> {
    const { address, amount, chain, nominatorMetadata, selectedPool } = inputData;

    const substrateApi = this.#koniState.getSubstrateApi(chain);
    const extrinsic = await getPoolingBondingExtrinsic(substrateApi, amount, selectedPool.id, nominatorMetadata);

    return await this.#koniState.transactionService.handleTransaction({
      address,
      chain,
      transaction: extrinsic,
      data: inputData,
      extrinsicType: ExtrinsicType.STAKING_JOIN_POOL,
      chainType: ChainType.SUBSTRATE
    });
  }

  private async submitPoolingUnbonding (inputData: RequestStakePoolingUnbonding): Promise<SWTransactionResponse> {
    const { amount, chain, nominatorMetadata } = inputData;

    const substrateApi = this.#koniState.getSubstrateApi(chain);
    const extrinsic = await getPoolingUnbondingExtrinsic(substrateApi, amount, nominatorMetadata);

    return await this.#koniState.transactionService.handleTransaction({
      address: nominatorMetadata.address,
      chain,
      transaction: extrinsic,
      data: inputData,
      extrinsicType: ExtrinsicType.STAKING_LEAVE_POOL,
      chainType: ChainType.SUBSTRATE
    });
  }

  // EVM Transaction
  private async parseContractInput ({ chainId,
    contract,
    data }: RequestParseEvmContractInput): Promise<ResponseParseEvmContractInput> {
    const network = this.getNetworkJsonByChainId(chainId);

    return await parseContractInput(data, contract, network);
  }

  private async submitTuringStakeCompounding (inputData: RequestTuringStakeCompound) {
    const { accountMinimum, address, bondedAmount, collatorAddress, networkKey } = inputData;

    if (!address) {
      return this.#koniState.transactionService.generateBeforeHandleResponseErrors([new TransactionError(BasicTxErrorType.INVALID_PARAMS)]);
    }

    const dotSamaApi = this.#koniState.getSubstrateApi(networkKey);
    const chainInfo = this.#koniState.getChainInfo(networkKey);
    const { decimals } = _getChainNativeTokenBasicInfo(chainInfo);
    const parsedAccountMinimum = parseFloat(accountMinimum) * 10 ** decimals;
    const extrinsic = await getTuringCompoundExtrinsic(dotSamaApi, address, collatorAddress, parsedAccountMinimum.toString(), bondedAmount);

    return await this.#koniState.transactionService.handleTransaction({
      address,
      chain: networkKey,
      transaction: extrinsic,
      data: inputData,
      extrinsicType: ExtrinsicType.STAKING_COMPOUNDING,
      chainType: ChainType.SUBSTRATE
    });
  }

  private async submitTuringCancelStakeCompound (inputData: RequestTuringCancelStakeCompound) {
    const { address, networkKey, taskId } = inputData;
    const txState: TransactionResponse = {};

    if (!address) {
      txState.txError = true;

      return txState;
    }

    const dotSamaApi = this.#koniState.getSubstrateApi(networkKey);
    const extrinsic = await getTuringCancelCompoundingExtrinsic(dotSamaApi, taskId);

    return await this.#koniState.transactionService.handleTransaction({
      address,
      chain: networkKey,
      transaction: extrinsic,
      data: inputData,
      extrinsicType: ExtrinsicType.STAKING_CANCEL_COMPOUNDING,
      chainType: ChainType.SUBSTRATE
    });
  }

  private async wasmNftGetTransaction ({ networkKey,
    params,
    recipientAddress,
    senderAddress }: NftTransactionRequest): Promise<SubstrateNftTransaction> {
    const contractAddress = params.contractAddress as string;
    const onChainOption = params.onChainOption as Record<string, string>;

    try {
      return await getPSP34Transaction(this.#koniState.getEvmApiMap(), this.#koniState.getSubstrateApiMap(), this.#koniState.getChainInfo(networkKey), networkKey, contractAddress, senderAddress, recipientAddress, onChainOption);
    } catch (e) {
      console.error('Error getting WASM NFT transaction', e);

      return {
        error: true,
        balanceError: false
      };
    }
  }

  private keyringStateSubscribe (id: string, port: chrome.runtime.Port): KeyringState {
    const cb = createSubscription<'pri(keyring.subscribe)'>(id, port);
    const subscription = this.#koniState.subscribeKeyringState().subscribe((value): void =>
      cb(value)
    );

    this.createUnsubscriptionHandle(id, subscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.#koniState.getKeyringState();
  }

  private keyringChangeMasterPassword ({ createNew,
    newPassword,
    oldPassword }: RequestChangeMasterPassword): ResponseChangeMasterPassword {
    try {
      // Remove isMasterPassword meta if createNew
      if (createNew) {
        const pairs = keyring.getPairs();

        for (const pair of pairs) {
          const meta: KeyringPair$Meta = {
            ...pair.meta,
            isMasterPassword: false
          };

          if (!meta.originGenesisHash) {
            meta.genesisHash = '';
          }

          pair.setMeta(meta);
          keyring.saveAccountMeta(pair, pair.meta);
        }
      }

      keyring.changeMasterPassword(newPassword, oldPassword);
    } catch (e) {
      console.error(e);

      return {
        errors: [(e as Error).message],
        status: false
      };
    }

    this.#koniState.setKeyringState({
      hasMasterPassword: true,
      isLocked: false,
      isReady: true
    });

    return {
      status: true,
      errors: []
    };
  }

  private keyringMigrateMasterPassword ({ address, password }: RequestMigratePassword): ResponseMigratePassword {
    try {
      keyring.migrateWithMasterPassword(address, password);
    } catch (e) {
      console.error(e);

      return {
        errors: [(e as Error).message],
        status: false
      };
    }

    return {
      status: true,
      errors: []
    };
  }

  private keyringUnlock ({ password }: RequestUnlockKeyring): ResponseUnlockKeyring {
    try {
      keyring.unlockKeyring(password);
    } catch (e) {
      return {
        errors: [(e as Error).message],
        status: false
      };
    }

    this.#koniState.setKeyringState({
      isReady: true,
      hasMasterPassword: true,
      isLocked: false
    });

    return {
      status: true,
      errors: []
    };
  }

  private keyringLock (): void {
    keyring.lockAll();

    this.#koniState.setKeyringState({
      isReady: true,
      hasMasterPassword: true,
      isLocked: true
    });
  }

  private keyringExportMnemonic ({ address, password }: RequestKeyringExportMnemonic): ResponseKeyringExportMnemonic {
    const pair = keyring.getPair(address);

    const result = pair.exportMnemonic(password);

    return { result };
  }

  /// Signing external request
  private signingApprovePasswordV2 ({ id }: RequestSigningApprovePasswordV2): boolean {
    const queued = this.#koniState.getSignRequest(id);

    assert(queued, 'Unable to find request');

    const { reject, request, resolve } = queued;
    const pair = keyring.getPair(queued.account.address);

    // unlike queued.account.address the following
    // address is encoded with the default prefix
    // which what is used for password caching mapping
    const { address } = pair;

    if (!pair) {
      reject(new Error('Unable to find pair'));

      return false;
    }

    if (pair.isLocked) {
      keyring.unlockPair(address);
    }

    const { payload } = request;

    const registry = new TypeRegistry();

    if (isJsonPayload(payload)) {
      // Get the metadata for the genesisHash
      const currentMetadata = this.#koniState.knownMetadata.find((meta: MetadataDef) =>
        meta.genesisHash === payload.genesisHash);

      // set the registry before calling the sign function
      registry.setSignedExtensions(payload.signedExtensions, currentMetadata?.userExtensions);

      if (currentMetadata) {
        registry.register(currentMetadata?.types);
      }
    }

    const result = request.sign(registry, pair);

    resolve({
      id,
      ...result
    });

    return true;
  }

  /// Derive account

  private derivationCreateMultiple ({ isAllowed, items, parentAddress }: RequestDeriveCreateMultiple): boolean {
    const parentPair = keyring.getPair(parentAddress);
    const isEvm = parentPair.type === 'ethereum';

    if (parentPair.isLocked) {
      keyring.unlockPair(parentPair.address);
    }

    const createChild = ({ name, suri }: CreateDeriveAccountInfo): KeyringPair => {
      const meta: KeyringPair$Meta = {
        name: name,
        parentAddress
      };

      if (isEvm) {
        let index = 0;

        try {
          const reg = /^\d+$/;
          const path = suri.split('//')[1];

          if (reg.test(path)) {
            index = parseInt(path);
          }
        } catch (e) {

        }

        if (!index) {
          throw Error('Invalid derive path');
        }

        meta.suri = `//${index}`;

        return parentPair.deriveEvm(index, meta);
      } else {
        meta.suri = suri;

        return parentPair.derive(suri, meta);
      }
    };

    const result: KeyringPair[] = [];

    for (const item of items) {
      try {
        const childPair = createChild(item);
        const address = childPair.address;

        keyring.addPair(childPair, true);
        this._addAddressToAuthList(address, isAllowed);
        result.push(childPair);
      } catch (e) {
        console.log(`Fail to derive from ${parentAddress} with path ${item.suri}`, e);
      }
    }

    if (result.length === 1) {
      this._saveCurrentAccountAddress(result[0].address);
    } else {
      this.#koniState.setCurrentAccount({ address: ALL_ACCOUNT_KEY, currentGenesisHash: null });
    }

    return true;
  }

  private derivationCreateV3 ({ address: parentAddress }: RequestDeriveCreateV3): boolean {
    const parentPair = keyring.getPair(parentAddress);
    const isEvm = parentPair.type === 'ethereum';

    if (parentPair.isLocked) {
      keyring.unlockPair(parentPair.address);
    }

    const pairs = keyring.getPairs();
    const children = pairs.filter((p) => p.meta.parentAddress === parentAddress);
    const name = `Account ${pairs.length}`;

    let index = isEvm ? 1 : 0;
    let valid = false;

    do {
      const exist = children.find((p) => p.meta.suri === `//${index}`);

      if (exist) {
        index++;
      } else {
        valid = true;
      }
    } while (!valid);

    const meta = {
      name,
      parentAddress,
      suri: `//${index}`
    };
    const childPair = isEvm ? parentPair.deriveEvm(index, meta) : parentPair.derive(meta.suri, meta);
    const address = childPair.address;

    this._saveCurrentAccountAddress(address, () => {
      keyring.addPair(childPair, true);
      this._addAddressToAuthList(address, true);
    });

    return true;
  }

  private validateDerivePath ({ parentAddress, suri }: RequestDeriveValidateV2): ResponseDeriveValidateV2 {
    const parentPair = keyring.getPair(parentAddress);
    const isEvm = parentPair.type === 'ethereum';

    if (parentPair.isLocked) {
      keyring.unlockPair(parentPair.address);
    }

    const meta: KeyringPair$Meta = {
      parentAddress
    };

    let childPair: KeyringPair;

    if (isEvm) {
      let index = 0;

      try {
        const reg = /^\d+$/;
        const path = suri.split('//')[1];

        if (reg.test(path)) {
          index = parseInt(path);
        }
      } catch (e) {

      }

      if (!index) {
        throw Error('Invalid derive path');
      }

      meta.suri = `//${index}`;

      childPair = parentPair.deriveEvm(index, meta);
    } else {
      meta.suri = suri;
      childPair = parentPair.derive(suri, meta);
    }

    return {
      address: childPair.address,
      suri: meta.suri as string
    };
  }

  private getListDeriveAccounts ({ limit, page, parentAddress }: RequestGetDeriveAccounts): ResponseGetDeriveAccounts {
    const parentPair = keyring.getPair(parentAddress);
    const isEvm = parentPair.type === 'ethereum';

    if (parentPair.isLocked) {
      keyring.unlockPair(parentPair.address);
    }

    const start = (page - 1) * limit + (isEvm ? 1 : 0);
    const end = start + limit;

    const result: DeriveAccountInfo[] = [];

    for (let i = start; i < end; i++) {
      const suri = `//${i}`;
      const pair = isEvm ? parentPair.deriveEvm(i, {}) : parentPair.derive(suri, {});

      result.push({ address: pair.address, suri: suri });
    }

    return {
      result: result
    };
  }

  // ChainService -------------------------------------------------
  private subscribeChainInfoMap (id: string, port: chrome.runtime.Port): Record<string, _ChainInfo> {
    const cb = createSubscription<'pri(chainService.subscribeChainInfoMap)'>(id, port);
    const chainInfoMapSubscription = this.#koniState.subscribeChainInfoMap().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    this.createUnsubscriptionHandle(id, chainInfoMapSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.#koniState.getChainInfoMap();
  }

  private subscribeChainStateMap (id: string, port: chrome.runtime.Port): Record<string, _ChainState> {
    const cb = createSubscription<'pri(chainService.subscribeChainStateMap)'>(id, port);
    const chainStateMapSubscription = this.#koniState.subscribeChainStateMap().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    this.createUnsubscriptionHandle(id, chainStateMapSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.#koniState.getChainStateMap();
  }

  private subscribeAssetRegistry (id: string, port: chrome.runtime.Port): Record<string, _ChainAsset> {
    const cb = createSubscription<'pri(chainService.subscribeAssetRegistry)'>(id, port);
    const assetRegistrySubscription = this.#koniState.subscribeAssetRegistry().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    this.createUnsubscriptionHandle(id, assetRegistrySubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.#koniState.getAssetRegistry();
  }

  private subscribeMultiChainAssetMap (id: string, port: chrome.runtime.Port): Record<string, _MultiChainAsset> {
    const cb = createSubscription<'pri(chainService.subscribeMultiChainAssetMap)'>(id, port);
    const multiChainAssetSubscription = this.#koniState.subscribeMultiChainAssetMap().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    this.createUnsubscriptionHandle(id, multiChainAssetSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.#koniState.getMultiChainAssetMap();
  }

  private getSupportedSmartContractTypes () {
    return this.#koniState.getSupportedSmartContractTypes();
  }

  private getTransaction ({ id }: RequestGetTransaction): SWTransactionResult {
    const { transaction, ...transactionResult } = this.#koniState.transactionService.getTransaction(id);

    return transactionResult;
  }

  private subscribeTransactions (id: string, port: chrome.runtime.Port): Record<string, SWTransactionResult> {
    const cb = createSubscription<'pri(transactions.subscribe)'>(id, port);

    function convertRs (rs: Record<string, SWTransaction>): Record<string, SWTransactionResult> {
      return Object.fromEntries(Object.entries(rs).map(([key, value]) => {
        const { transaction, ...transactionResult } = value;

        return [key, transactionResult];
      }));
    }

    const transactionsSubject = this.#koniState.transactionService.getTransactionSubject();
    const transactionsSubscription = transactionsSubject.subscribe((rs) => {
      cb(convertRs(rs));
    });

    port.onDisconnect.addListener((): void => {
      transactionsSubscription.unsubscribe();
      this.cancelSubscription(id);
    });

    return convertRs(transactionsSubject.getValue());
  }

  private subscribeNotifications (id: string, port: chrome.runtime.Port) {
    const cb = createSubscription<'pri(notifications.subscribe)'>(id, port);
    const notificationSubject = this.#koniState.notificationService.getNotificationSubject();

    const notificationSubscription = notificationSubject.subscribe((rs) => {
      cb(rs);
    });

    port.onDisconnect.addListener((): void => {
      notificationSubscription.unsubscribe();
      this.cancelSubscription(id);
    });

    return notificationSubject.value;
  }

  // --------------------------------------------------------------
  // eslint-disable-next-line @typescript-eslint/require-await
  public async handle<TMessageType extends MessageTypes> (id: string, type: TMessageType, request: RequestTypes[TMessageType], port: chrome.runtime.Port): Promise<ResponseType<TMessageType>> {
    switch (type) {
      /// Clone from PolkadotJs
      case 'pri(accounts.create.external)':
        return this.accountsCreateExternal(request as RequestAccountCreateExternal);

      case 'pri(accounts.create.hardware)':
        return this.accountsCreateHardware(request as RequestAccountCreateHardware);

      case 'pri(accounts.create.suri)':
        return this.accountsCreateSuri(request as RequestAccountCreateSuri);

      case 'pri(accounts.changePassword)':
        return this.accountsChangePassword(request as RequestAccountChangePassword);

      case 'pri(accounts.edit)':
        return this.accountsEdit(request as RequestAccountEdit);

      case 'pri(accounts.export)':
        return this.accountsExport(request as RequestAccountExport);

      case 'pri(accounts.show)':
        return this.accountsShow(request as RequestAccountShow);

      case 'pri(accounts.subscribe)':
        return this.accountsSubscribe(id, port);

      case 'pri(accounts.validate)':
        return this.accountsValidate(request as RequestAccountValidate);

      case 'pri(metadata.approve)':
        return this.metadataApprove(request as RequestMetadataApprove);

      case 'pri(metadata.get)':
        return this.metadataGet(request as string);

      case 'pri(metadata.list)':
        return this.metadataList();

      case 'pri(metadata.reject)':
        return this.metadataReject(request as RequestMetadataReject);

      case 'pri(metadata.requests)':
        return this.metadataSubscribe(id, port);

      case 'pri(derivation.create)':
        return this.derivationCreate(request as RequestDeriveCreate);

      case 'pri(derivation.validate)':
        return this.derivationValidate(request as RequestDeriveValidate);

      case 'pri(json.restore)':
        return this.jsonRestore(request as RequestJsonRestore);

      case 'pri(json.batchRestore)':
        return this.batchRestore(request as RequestBatchRestore);

      case 'pri(json.account.info)':
        return this.jsonGetAccountInfo(request as KeyringPair$Json);

      case 'pri(seed.create)':
        return this.seedCreate(request as RequestSeedCreate);

      case 'pri(seed.validate)':
        return this.seedValidate(request as RequestSeedValidate);

      case 'pri(signing.approve.signature)':
        return this.signingApproveSignature(request as RequestSigningApproveSignature);

      case 'pri(signing.cancel)':
        return this.signingCancel(request as RequestSigningCancel);

      case 'pri(signing.requests)':
        return this.signingSubscribe(id, port);

      case 'pri(window.open)':
        return this.windowOpen(request as AllowedPath);

      ///
      case 'pri(authorize.changeSiteAll)':
        return this.changeAuthorizationAll(request as RequestAuthorization, id, port);
      case 'pri(authorize.changeSite)':
        return this.changeAuthorization(request as RequestAuthorization, id, port);
      case 'pri(authorize.changeSitePerAccount)':
        return this.changeAuthorizationPerAcc(request as RequestAuthorizationPerAccount, id, port);
      case 'pri(authorize.changeSitePerSite)':
        return this.changeAuthorizationPerSite(request as RequestAuthorizationPerSite);
      case 'pri(authorize.changeSiteBlock)':
        return this.changeAuthorizationBlock(request as RequestAuthorizationBlock);
      case 'pri(authorize.forgetSite)':
        return this.forgetSite(request as RequestForgetSite, id, port);
      case 'pri(authorize.forgetAllSite)':
        return this.forgetAllSite(id, port);
      case 'pri(authorize.approveV2)':
        return this.authorizeApproveV2(request as RequestAuthorizeApproveV2);
      case 'pri(authorize.rejectV2)':
        return this.authorizeRejectV2(request as RequestAuthorizeReject);
      case 'pri(authorize.cancelV2)':
        return this.authorizeCancelV2(request as RequestAuthorizeCancel);
      case 'pri(authorize.requestsV2)':
        return this.authorizeSubscribeV2(id, port);
      case 'pri(authorize.listV2)':
        return this.getAuthListV2();
      case 'pri(authorize.toggle)':
        return this.toggleAuthorization2(request as string);
      case 'pri(accounts.create.suriV2)':
        return await this.accountsCreateSuriV2(request as RequestAccountCreateSuriV2);
      case 'pri(accounts.forget)':
        return await this.accountsForgetOverride(request as RequestAccountForget);
      case 'pri(accounts.create.externalV2)':
        return await this.accountsCreateExternalV2(request as RequestAccountCreateExternalV2);
      case 'pri(accounts.create.hardwareV2)':
        return await this.accountsCreateHardwareV2(request as RequestAccountCreateHardwareV2);
      case 'pri(accounts.create.hardwareMultiple)':
        return await this.accountsCreateHardwareMultiple(request as RequestAccountCreateHardwareMultiple);
      case 'pri(accounts.create.withSecret)':
        return await this.accountsCreateWithSecret(request as RequestAccountCreateWithSecretKey);
      case 'pri(seed.createV2)':
        return this.seedCreateV2(request as RequestSeedCreateV2);
      case 'pri(seed.validateV2)':
        return this.seedValidateV2(request as RequestSeedValidateV2);
      case 'pri(privateKey.validateV2)':
        return this.metamaskPrivateKeyValidateV2(request as RequestSeedValidateV2);
      case 'pri(accounts.exportPrivateKey)':
        return this.accountExportPrivateKey(request as RequestAccountExportPrivateKey);
      case 'pri(accounts.checkPublicAndSecretKey)':
        return this.checkPublicAndSecretKey(request as RequestCheckPublicAndSecretKey);
      case 'pri(accounts.subscribeWithCurrentAddress)':
        return await this.accountsGetAllWithCurrentAddress(id, port);
      case 'pri(accounts.subscribeAccountsInputAddress)':
        return this.accountsGetAll(id, port);
      case 'pri(accounts.saveRecent)':
        return this.saveRecentAccountId(request as RequestSaveRecentAccount);
      case 'pri(accounts.triggerSubscription)':
        return this.triggerAccountsSubscription();
      case 'pri(currentAccount.saveAddress)':
        return this.saveCurrentAccountAddress(request as RequestCurrentAccountAddress, id, port);
      case 'pri(accounts.updateCurrentAddress)':
        return this.updateCurrentAccountAddress(request as string);
      case 'pri(settings.changeBalancesVisibility)':
        return this.toggleBalancesVisibility(id, port);
      case 'pri(settings.subscribe)':
        return await this.subscribeSettings(id, port);
      case 'pri(settings.saveAccountAllLogo)':
        return this.saveAccountAllLogo(request as string, id, port);
      case 'pri(settings.saveCamera)':
        return this.setCamera(request as RequestCameraSettings);
      case 'pri(settings.saveTheme)':
        return this.saveTheme(request as ThemeNames, id, port);
      case 'pri(settings.saveBrowserConfirmationType)':
        return this.saveBrowserConfirmationType(request as BrowserConfirmationType, id, port);
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
        return await this.subscribeStaking(id, port);
      case 'pri(stakingReward.getStakingReward)':
        return this.getStakingReward();
      case 'pri(stakingReward.getSubscription)':
        return this.subscribeStakingReward(id, port);
      case 'pri(transaction.history.getSubscription)':
        return await this.subscribeHistory(id, port);

      // ChainService
      case 'pri(chainService.subscribeChainInfoMap)':
        return this.subscribeChainInfoMap(id, port);
      case 'pri(chainService.subscribeChainStateMap)':
        return this.subscribeChainStateMap(id, port);
      case 'pri(chainService.getSupportedContractTypes)':
        return this.getSupportedSmartContractTypes();
      case 'pri(chainService.enableChain)':
        return this.enableChain(request as string);
      case 'pri(chainService.disableChain)':
        return this.disableChain(request as string);
      case 'pri(chainService.removeChain)':
        return this.removeCustomChain(request as string);
      case 'pri(chainService.validateCustomChain)':
        return await this.validateNetwork(request as ValidateNetworkRequest);
      case 'pri(chainService.upsertChain)':
        return this.upsertChain(request as _NetworkUpsertParams);
      case 'pri(chainService.resetDefaultChains)':
        return this.resetDefaultNetwork();
      case 'pri(chainService.enableChains)':
        return this.enableChains(request as string[]);
      case 'pri(chainService.subscribeAssetRegistry)':
        return this.subscribeAssetRegistry(id, port);
      case 'pri(chainService.subscribeMultiChainAssetMap)':
        return this.subscribeMultiChainAssetMap(id, port);
      case 'pri(chainService.upsertCustomAsset)':
        return this.upsertCustomToken(request as _ChainAsset);
      case 'pri(chainService.deleteCustomAsset)':
        return this.deleteCustomAsset(request as string);
      case 'pri(chainService.validateCustomAsset)':
        return await this.validateCustomAsset(request as _ValidateCustomAssetRequest);
      case 'pri(assetSetting.getSubscription)':
        return this.subscribeAssetSetting(id, port);
      case 'pri(assetSetting.update)':
        return this.updateAssetSetting(request as AssetSettingUpdateReq);

      case 'pri(transfer.checkReferenceCount)':
        return await this.transferCheckReferenceCount(request as RequestTransferCheckReferenceCount);
      case 'pri(transfer.checkSupporting)':
        return await this.transferCheckSupporting(request as RequestTransferCheckSupporting);
      case 'pri(transfer.getExistentialDeposit)':
        return this.transferGetExistentialDeposit(request as RequestTransferExistentialDeposit);
      case 'pri(freeBalance.get)':
        return this.getAddressFreeBalance(request as RequestFreeBalance);
      case 'pri(freeBalance.subscribe)':
        return this.subscribeAddressFreeBalance(request as RequestFreeBalance, id, port);
      case 'pri(subscription.cancel)':
        return this.cancelSubscription(request as string);
      case 'pri(chainService.recoverSubstrateApi)':
        return this.recoverDotSamaApi(request as string);

      case 'pri(accounts.get.meta)':
        return this.getAccountMeta(request as RequestAccountMeta);

      /// Nft
      case 'pri(nft.forceUpdate)':
        return this.forceUpdateNftState(request as RequestNftForceUpdate);
      case 'pri(nftTransfer.getNftTransfer)':
        return this.getNftTransfer();
      case 'pri(nftTransfer.getSubscription)':
        return this.subscribeNftTransfer(id, port);
      case 'pri(nftTransfer.setNftTransfer)':
        return this.setNftTransfer(request as NftTransferExtra);

      // Send NFT
      case 'pri(evmNft.submitTransaction)':
        return this.evmNftSubmitTransaction(request as NftTransactionRequest);
      case 'pri(substrateNft.submitTransaction)':
        return this.substrateNftSubmitTransaction(request as RequestSubstrateNftSubmitTransaction);

      /// Transfer
      case 'pri(accounts.transfer)':
        return await this.makeTransfer(request as RequestTransfer);
      case 'pri(accounts.crossChainTransfer)':
        return await this.makeCrossChainTransfer(request as RequestCrossChainTransfer);

      /// Sign QR
      case 'pri(qr.transaction.parse.substrate)':
        return this.parseSubstrateTransaction(request as RequestParseTransactionSubstrate);
      case 'pri(qr.transaction.parse.evm)':
        return await this.parseEVMRLP(request as RequestQrParseRLP);
      case 'pri(qr.sign.substrate)':
        return this.qrSignSubstrate(request as RequestQrSignSubstrate);
      case 'pri(qr.sign.evm)':
        return await this.qrSignEVM(request as RequestQrSignEvm);

      /// External account request
      case 'pri(account.external.reject)':
        return this.rejectExternalRequest(request as RequestRejectExternalRequest);
      case 'pri(account.external.resolve)':
        return this.resolveQrTransfer(request as RequestResolveExternalRequest);

      case 'pri(accounts.tie)':
        return this.accountsTie2(request as RequestAccountTie);
      case 'pri(confirmations.subscribe)':
        return this.subscribeConfirmations(id, port);
      case 'pri(confirmations.complete)':
        return await this.completeConfirmation(request as RequestConfirmationComplete);

      /// Stake
      case 'pri(bonding.getBondingOptions)':
        return await this.getBondingOptions(request as BondingOptionParams);
      case 'pri(bonding.getNominationPoolOptions)':
        return await this.getNominationPoolOptions(request as string);
      case 'pri(bonding.subscribeChainStakingMetadata)':
        return await this.subscribeChainStakingMetadata(id, port);
      case 'pri(bonding.subscribeNominatorMetadata)':
        return await this.subscribeStakingNominatorMetadata(id, port);
      case 'pri(bonding.submitBondingTransaction)':
        return await this.submitBonding(request as RequestBondingSubmit);
      case 'pri(unbonding.submitTransaction)':
        return await this.submitUnbonding(request as RequestUnbondingSubmit);
      case 'pri(unbonding.submitWithdrawal)':
        return await this.submitStakeWithdrawal(request as RequestStakeWithdrawal);
      case 'pri(staking.submitClaimReward)':
        return await this.submitStakeClaimReward(request as RequestStakeClaimReward);
      case 'pri(staking.submitCancelWithdrawal)':
        return await this.submitCancelStakeWithdrawal(request as RequestStakeCancelWithdrawal);
      case 'pri(staking.submitTuringCompound)':
        return await this.submitTuringStakeCompounding(request as RequestTuringStakeCompound);
      case 'pri(staking.submitTuringCancelCompound)':
        return await this.submitTuringCancelStakeCompound(request as RequestTuringCancelStakeCompound);
      case 'pri(bonding.nominationPool.submitBonding)':
        return await this.submitPoolingBonding(request as RequestStakePoolingBonding);
      case 'pri(bonding.nominationPool.submitUnbonding)':
        return await this.submitPoolingUnbonding(request as RequestStakePoolingUnbonding);

      // EVM Transaction
      case 'pri(evm.transaction.parse.input)':
        return await this.parseContractInput(request as RequestParseEvmContractInput);

      // Auth Url subscribe
      case 'pri(authorize.subscribe)':
        return await this.subscribeAuthUrls(id, port);
      case 'pri(wasmNft.getTransaction)':
        return await this.wasmNftGetTransaction(request as NftTransactionRequest);

      /// Keyring state
      case 'pri(keyring.subscribe)':
        return this.keyringStateSubscribe(id, port);
      case 'pri(keyring.change)':
        return this.keyringChangeMasterPassword(request as RequestChangeMasterPassword);
      case 'pri(keyring.migrate)':
        return this.keyringMigrateMasterPassword(request as RequestMigratePassword);
      case 'pri(keyring.unlock)':
        return this.keyringUnlock(request as RequestUnlockKeyring);
      case 'pri(keyring.lock)':
        return this.keyringLock();
      case 'pri(keyring.export.mnemonic)':
        return this.keyringExportMnemonic(request as RequestKeyringExportMnemonic);

      /// Signing external
      case 'pri(signing.approve.passwordV2)':
        return this.signingApprovePasswordV2(request as RequestSigningApprovePasswordV2);

      /// Derive account
      case 'pri(derivation.validateV2)':
        return this.validateDerivePath(request as RequestDeriveValidateV2);
      case 'pri(derivation.getList)':
        return this.getListDeriveAccounts(request as RequestGetDeriveAccounts);
      case 'pri(derivation.create.multiple)':
        return this.derivationCreateMultiple(request as RequestDeriveCreateMultiple);
      case 'pri(derivation.createV3)':
        return this.derivationCreateV3(request as RequestDeriveCreateV3);

      // Transaction
      case 'pri(transactions.getOne)':
        return this.getTransaction(request as RequestGetTransaction);
      case 'pri(transactions.subscribe)':
        return this.subscribeTransactions(id, port);

      // Notification
      case 'pri(notifications.subscribe)':
        return this.subscribeNotifications(id, port);

      // Default
      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}
