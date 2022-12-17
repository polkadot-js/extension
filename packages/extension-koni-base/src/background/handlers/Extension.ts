// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Common from '@ethereumjs/common';
import Extension, { SEED_DEFAULT_LENGTH, SEED_LENGTHS } from '@subwallet/extension-base/background/handlers/Extension';
import { AuthUrls } from '@subwallet/extension-base/background/handlers/State';
import { createSubscription } from '@subwallet/extension-base/background/handlers/subscriptions';
import { AccountExternalError, AccountExternalErrorCode, AccountsWithCurrentAddress, ApiProps, BalanceJson, BasicTxError, BasicTxErrorCode, BasicTxInfo, BasicTxResponse, BondingOptionInfo, BondingOptionParams, BondingSubmitParams, ChainBondingBasics, ChainRegistry, CheckExistingTuringCompoundParams, CrowdloanJson, CurrentAccountInfo, CustomToken, CustomTokenJson, DelegationItem, DeleteCustomTokenParams, DisableNetworkResponse, EvmNftTransaction, ExistingTuringCompoundTask, ExternalRequestPromise, ExternalRequestPromiseStatus, HandleBasicTx, NETWORK_ERROR, NetWorkGroup, NetworkJson, NftCollection, NftJson, NftTransactionRequest, NftTransactionResponse, NftTransferExtra, OptionInputAddress, PrepareExternalRequest, PriceJson, RequestAccountCreateExternalV2, RequestAccountCreateHardwareV2, RequestAccountCreateSuriV2, RequestAccountCreateWithSecretKey, RequestAccountExportPrivateKey, RequestAccountIsLocked, RequestAccountMeta, RequestAuthorization, RequestAuthorizationBlock, RequestAuthorizationPerAccount, RequestAuthorizationPerSite, RequestAuthorizeApproveV2, RequestBatchRestoreV2, RequestBondingSubmit, RequestCancelCompoundStakeExternal, RequestCheckCrossChainTransfer, RequestCheckPublicAndSecretKey, RequestCheckTransfer, RequestClaimRewardExternal, RequestConfirmationComplete, RequestCreateCompoundStakeExternal, RequestCrossChainTransfer, RequestCrossChainTransferExternal, RequestDeriveCreateV2, RequestEvmNftSubmitTransaction, RequestForgetSite, RequestFreeBalance, RequestJsonRestoreV2, RequestNftForceUpdate, RequestNftTransferExternalEVM, RequestNftTransferExternalSubstrate, RequestParseEVMContractInput, RequestParseTransactionSubstrate, RequestQrParseRLP, RequestQrSignEVM, RequestQrSignSubstrate, RequestRejectExternalRequest, RequestResolveExternalRequest, RequestSaveRecentAccount, RequestSeedCreateV2, RequestSeedValidateV2, RequestSettingsType, RequestStakeClaimReward, RequestStakeExternal, RequestStakeWithdrawal, RequestSubstrateNftSubmitTransaction, RequestTransactionHistoryAdd, RequestTransfer, RequestTransferCheckReferenceCount, RequestTransferCheckSupporting, RequestTransferExistentialDeposit, RequestTransferExternal, RequestTuringCancelStakeCompound, RequestTuringStakeCompound, RequestUnbondingSubmit, RequestUnStakeExternal, RequestWithdrawStakeExternal, ResponseAccountCreateSuriV2, ResponseAccountCreateWithSecretKey, ResponseAccountExportPrivateKey, ResponseAccountIsLocked, ResponseAccountMeta, ResponseCheckCrossChainTransfer, ResponseCheckPublicAndSecretKey, ResponseCheckTransfer, ResponseParseEVMContractInput, ResponseParseTransactionSubstrate, ResponsePrivateKeyValidateV2, ResponseQrParseRLP, ResponseQrSignEVM, ResponseQrSignSubstrate, ResponseRejectExternalRequest, ResponseResolveExternalRequest, ResponseSeedCreateV2, ResponseSeedValidateV2, StakeClaimRewardParams, StakeDelegationRequest, StakeUnlockingJson, StakeWithdrawalParams, StakingJson, StakingRewardJson, SubstrateNftTransaction, SupportTransferResponse, ThemeTypes, TokenInfo, TransactionHistoryItemType, TransferErrorCode, TuringCancelStakeCompoundParams, TuringStakeCompoundParams, UnbondingSubmitParams, ValidateCustomTokenRequest, ValidateCustomTokenResponse, ValidateNetworkRequest, ValidateNetworkResponse } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson, AuthorizeRequest, MessageTypes, RequestAccountForget, RequestAccountTie, RequestAuthorizeCancel, RequestAuthorizeReject, RequestCurrentAccountAddress, RequestTypes, ResponseAuthorizeList, ResponseType } from '@subwallet/extension-base/background/types';
import { PASSWORD_EXPIRY_MS } from '@subwallet/extension-base/defaults';
import { SignerExternal, SignerType } from '@subwallet/extension-base/signers/types';
import { getId } from '@subwallet/extension-base/utils/getId';
import { CHAIN_TYPES, getBondingExtrinsic, getBondingTxInfo, getChainBondingBasics, getClaimRewardExtrinsic, getClaimRewardTxInfo, getDelegationInfo, getUnbondingExtrinsic, getUnbondingTxInfo, getValidatorsInfo, getWithdrawalExtrinsic, getWithdrawalTxInfo } from '@subwallet/extension-koni-base/api/bonding';
import { checkTuringStakeCompoundingTask, getTuringCancelCompoundingExtrinsic, getTuringCompoundExtrinsic, handleTuringCancelCompoundTxInfo, handleTuringCompoundTxInfo } from '@subwallet/extension-koni-base/api/bonding/paraChain';
import { initApi } from '@subwallet/extension-koni-base/api/dotsama';
import { getFreeBalance, subscribeFreeBalance } from '@subwallet/extension-koni-base/api/dotsama/balance';
import { createClaimRewardExternal } from '@subwallet/extension-koni-base/api/dotsama/external/stake/claim';
import { createCancelCompoundExternal } from '@subwallet/extension-koni-base/api/dotsama/external/stake/compound/cancel';
import { createCreateCompoundExternal } from '@subwallet/extension-koni-base/api/dotsama/external/stake/compound/create';
import { createStakeExternal } from '@subwallet/extension-koni-base/api/dotsama/external/stake/stake';
import { createUnStakeExternal } from '@subwallet/extension-koni-base/api/dotsama/external/stake/unStake';
import { createWithdrawStakeExternal } from '@subwallet/extension-koni-base/api/dotsama/external/stake/withdraw';
import { makeTransferExternal } from '@subwallet/extension-koni-base/api/dotsama/external/transfer/balance';
import { makeNftTransferExternal } from '@subwallet/extension-koni-base/api/dotsama/external/transfer/nft';
import { makeCrossChainTransferExternal } from '@subwallet/extension-koni-base/api/dotsama/external/transfer/xcm';
import { parseSubstrateTransaction } from '@subwallet/extension-koni-base/api/dotsama/parseTransaction';
import { getTokenInfo } from '@subwallet/extension-koni-base/api/dotsama/registry';
import { signAndSendExtrinsic } from '@subwallet/extension-koni-base/api/dotsama/shared/signAndSendExtrinsic';
import { checkReferenceCount, checkSupportTransfer, estimateFee, getExistentialDeposit, makeTransfer } from '@subwallet/extension-koni-base/api/dotsama/transfer';
import { makeERC20TransferQr, makeEVMTransferQr } from '@subwallet/extension-koni-base/api/evm/external/transfer/balance';
import { handleTransferNftQr } from '@subwallet/extension-koni-base/api/evm/external/transfer/nft';
import { SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME } from '@subwallet/extension-koni-base/api/nft/config';
import { acalaTransferHandler, getNftTransferExtrinsic, isRecipientSelf, quartzTransferHandler, rmrkTransferHandler, statemineTransferHandler, uniqueTransferHandler } from '@subwallet/extension-koni-base/api/nft/transfer';
import { FUNGIBLE_TOKEN_STANDARDS, isEqualContractAddress, validateCustomToken } from '@subwallet/extension-koni-base/api/tokens';
import { parseContractInput, parseEvmRlp } from '@subwallet/extension-koni-base/api/tokens/evm/parseTransaction';
import { getERC20TransactionObject, getERC721Transaction, getEVMTransactionObject, makeERC20Transfer, makeEVMTransfer } from '@subwallet/extension-koni-base/api/tokens/evm/transfer';
import { initWeb3Api } from '@subwallet/extension-koni-base/api/tokens/evm/web3';
import { getPSP34Transaction, getPSP34TransferExtrinsic } from '@subwallet/extension-koni-base/api/tokens/wasm';
import { estimateCrossChainFee, makeCrossChainTransfer } from '@subwallet/extension-koni-base/api/xcm';
import { state } from '@subwallet/extension-koni-base/background/handlers/index';
import { ALL_ACCOUNT_KEY, ALL_GENESIS_HASH } from '@subwallet/extension-koni-base/constants';
import { getCurrentProvider, isValidProvider } from '@subwallet/extension-koni-base/utils';
import { createTransactionFromRLP, signatureToHex, Transaction as QrTransaction } from '@subwallet/extension-koni-base/utils/eth';
import BigN from 'bignumber.js';
import { Transaction } from 'ethereumjs-tx';
import Web3 from 'web3';
import { SignedTransaction as Web3SignedTransaction, TransactionConfig } from 'web3-core';

import { createPair } from '@polkadot/keyring';
import { KeyringPair, KeyringPair$Json, KeyringPair$Meta } from '@polkadot/keyring/types';
import { ChainType } from '@polkadot/types/interfaces';
import { keyring } from '@polkadot/ui-keyring';
import { accounts as accountsObservable } from '@polkadot/ui-keyring/observable/accounts';
import { SingleAddress, SubjectInfo } from '@polkadot/ui-keyring/observable/types';
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

export default class KoniExtension extends Extension {
  private cancelSubscription (id: string): boolean {
    return state.cancelSubscription(id);
  }

  private createUnsubscriptionHandle (id: string, unsubscribe: () => void): void {
    state.createUnsubscriptionHandle(id, unsubscribe);
  }

  public decodeAddress = (key: string | Uint8Array, ignoreChecksum?: boolean, ss58Format?: Prefix): Uint8Array => {
    return keyring.decodeAddress(key, ignoreChecksum, ss58Format);
  };

  public encodeAddress = (key: string | Uint8Array, ss58Format?: Prefix): string => {
    return keyring.encodeAddress(key, ss58Format);
  };

  private accountExportPrivateKey ({ address,
    password }: RequestAccountExportPrivateKey): ResponseAccountExportPrivateKey {
    return state.accountExportPrivateKey({ address, password });
  }

  private checkPublicAndSecretKey (request: RequestCheckPublicAndSecretKey): ResponseCheckPublicAndSecretKey {
    return state.checkPublicAndSecretKey(request);
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

      setTimeout(() => {
        state.getCurrentAccount((accountInfo) => {
          if (accountInfo) {
            accountsWithCurrentAddress.currentAddress = accountInfo.address;

            if (accountInfo.address === ALL_ACCOUNT_KEY) {
              accountsWithCurrentAddress.currentGenesisHash = accountInfo.currentGenesisHash;
            } else {
              const acc = accounts.find((a) => (a.address === accountInfo.address));

              accountsWithCurrentAddress.currentGenesisHash = acc?.genesisHash || ALL_GENESIS_HASH;
            }
          }

          cb(accountsWithCurrentAddress);
        });
      }, 100);
    });

    this.createUnsubscriptionHandle(id, subscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
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
      state.getAuthorize((rs: AuthUrls) => {
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

  private authorizeCancelV2 ({ id }: RequestAuthorizeCancel): boolean {
    const queued = state.getAuthRequestV2(id);

    assert(queued, 'Unable to find request');

    const { reject } = queued;

    // Reject without error meaning cancel
    reject(new Error('Cancelled'));

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

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
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

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
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

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return true;
  }

  private _changeAuthorization (url: string, connectValue: boolean, callBack?: (value: AuthUrls) => void) {
    state.getAuthorize((value) => {
      assert(value[url], 'The source is not known');

      // eslint-disable-next-line no-return-assign
      Object.keys(value[url].isAllowedMap).forEach((address) => value[url].isAllowedMap[address] = connectValue);
      state.setAuthorize(value, () => {
        callBack && callBack(value);
      });
    });
  }

  public toggleAuthorization2 (url: string): Promise<ResponseAuthorizeList> {
    return new Promise((resolve) => {
      state.getAuthorize((value) => {
        assert(value[url], 'The source is not known');

        value[url].isAllowed = !value[url].isAllowed;

        state.setAuthorize(value, () => {
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
    state.getAuthorize((value) => {
      assert(value, 'The source is not known');

      value[url].isAllowedMap[address] = connectValue;

      console.log('Devbu: ', value);

      state.setAuthorize(value, () => {
        callBack && callBack(value);
      });
    });
  }

  private _changeAuthorizationBlock (connectValue: boolean, id: string) {
    state.getAuthorize((value) => {
      assert(value, 'The source is not known');

      value[id].isAllowed = connectValue;

      console.log('Devbu: ', value);

      state.setAuthorize(value);
    });
  }

  private _changeAuthorizationPerSite (values: Record<string, boolean>, id: string) {
    state.getAuthorize((value) => {
      assert(value, 'The source is not known');

      value[id].isAllowedMap = values;

      console.log('Devbu: ', value);

      state.setAuthorize(value);
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

  private getSettings (): Promise<RequestSettingsType> {
    return new Promise<RequestSettingsType>((resolve, reject) => {
      state.getSettings((rs) => {
        resolve(rs);
      });
    });
  }

  private toggleBalancesVisibility (id: string, port: chrome.runtime.Port) {
    const cb = createSubscription<'pri(settings.changeBalancesVisibility)'>(id, port);

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
      this.cancelSubscription(id);
    });

    return true;
  }

  private saveAccountAllLogo (data: string, id: string, port: chrome.runtime.Port) {
    const cb = createSubscription<'pri(settings.saveAccountAllLogo)'>(id, port);

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
      this.cancelSubscription(id);
    });

    return true;
  }

  private saveTheme (data: ThemeTypes, id: string, port: chrome.runtime.Port) {
    const cb = createSubscription<'pri(settings.saveTheme)'>(id, port);

    state.setTheme(data, cb);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return true;
  }

  private async subscribeSettings (id: string, port: chrome.runtime.Port) {
    const cb = createSubscription<'pri(settings.subscribe)'>(id, port);

    const balancesVisibilitySubscription = state.subscribeSettingsSubject().subscribe({
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

    const authorizeUrlSubscription = state.subscribeAuthorizeUrlSubject().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    this.createUnsubscriptionHandle(id, authorizeUrlSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return await state.getAuthList();
  }

  private _saveCurrentAccountAddress (address: string, callback?: (data: CurrentAccountInfo) => void) {
    state.getCurrentAccount((accountInfo) => {
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

      state.setCurrentAccount(accountInfo, () => {
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

    this.createUnsubscriptionHandle(id, priceSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.getPrice();
  }

  private getBalance (reset?: boolean): BalanceJson {
    return state.getBalance(reset);
  }

  private subscribeBalance (id: string, port: chrome.runtime.Port): BalanceJson {
    const cb = createSubscription<'pri(balance.getSubscription)'>(id, port);

    const balanceSubscription = state.subscribeBalance().subscribe({
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
    return state.getCrowdloan(reset);
  }

  private subscribeCrowdloan (id: string, port: chrome.runtime.Port): CrowdloanJson {
    const cb = createSubscription<'pri(crowdloan.getSubscription)'>(id, port);

    const balanceSubscription = state.subscribeCrowdloan().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    this.createUnsubscriptionHandle(id, balanceSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.getCrowdloan(true);
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

    this.createUnsubscriptionHandle(id, subscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
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
        });/**/

        state.setAuthorize(value);
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

    const currentAccount = await new Promise<CurrentAccountInfo>((resolve) => {
      state.getCurrentAccount(resolve);
    });
    const allGenesisHash = currentAccount?.allGenesisHash || undefined;

    types?.forEach((type) => {
      const suri = getSuri(_suri, type);
      const address = keyring.createFromUri(suri, {}, type).address;

      addressDict[type] = address;
      const newAccountName = type === 'ethereum' ? `${name} - EVM` : name;

      keyring.addUri(suri, password, { genesisHash, name: newAccountName }, type);
      this._addAddressToAuthList(address, isAllowed);

      if (!changedAccount) {
        if (types.length === 1) {
          state.setCurrentAccount({ address, currentGenesisHash: genesisHash || null, allGenesisHash });
        } else {
          state.setCurrentAccount({ address: ALL_ACCOUNT_KEY, currentGenesisHash: allGenesisHash || null, allGenesisHash });
        }

        changedAccount = true;
      }
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

    await new Promise<void>((resolve) => {
      state.getAuthorize((value) => {
        if (value && Object.keys(value).length) {
          Object.keys(value).forEach((url) => {
            delete value[url].isAllowedMap[address];
          });

          state.setAuthorize(value, resolve);
        } else {
          resolve();
        }
      });
    });

    // Set current account to all account
    await new Promise<void>((resolve) => {
      state.getCurrentAccount(({ allGenesisHash }) => {
        state.setCurrentAccount({ currentGenesisHash: allGenesisHash || null, address: ALL_ACCOUNT_KEY }, resolve);
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

  private derivationCreateV2 ({ genesisHash,
    isAllowed,
    name,
    parentAddress,
    parentPassword,
    password,
    suri }: RequestDeriveCreateV2): boolean {
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

    this.createUnsubscriptionHandle(id, nftTransferSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.getNftTransfer();
  }

  private getNftCollection (): Promise<NftCollection[]> {
    return state.getNftCollection();
  }

  private subscribeNftCollection (id: string, port: chrome.runtime.Port): Promise<NftCollection[]> {
    const cb = createSubscription<'pri(nftCollection.getSubscription)'>(id, port);
    const nftCollectionSubscription = state.subscribeNftCollection().subscribe({
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
    return state.getNft();
  }

  private async subscribeNft (id: string, port: chrome.runtime.Port): Promise<NftJson | null | undefined> {
    const cb = createSubscription<'pri(nft.getSubscription)'>(id, port);
    const nftSubscription = state.subscribeNft().subscribe({
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

    this.createUnsubscriptionHandle(id, stakingRewardSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.getStakingReward();
  }

  private async getStaking (): Promise<StakingJson> {
    return state.getStaking();
  }

  private async subscribeStaking (id: string, port: chrome.runtime.Port): Promise<StakingJson> {
    const cb = createSubscription<'pri(staking.getSubscription)'>(id, port);
    const stakingSubscription = state.subscribeStaking().subscribe({
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

  private subscribeHistory (id: string, port: chrome.runtime.Port): Record<string, TransactionHistoryItemType[]> {
    const cb = createSubscription<'pri(transaction.history.getSubscription)'>(id, port);

    const historySubscription = state.subscribeHistory().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    this.createUnsubscriptionHandle(id, historySubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return state.getHistoryMap();
  }

  private updateTransactionHistory ({ address,
    item,
    networkKey }: RequestTransactionHistoryAdd, id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pri(transaction.history.add)'>(id, port);

    state.setHistory(address, networkKey, item, (items) => {
      cb(items);
    });

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return true;
  }

  private setNftTransfer (request: NftTransferExtra): boolean {
    state.setNftTransfer(request);

    return true;
  }

  private forceUpdateNftState (request: RequestNftForceUpdate): boolean {
    if (!request.isSendingSelf) {
      state.removeNfts(request.chain, request.senderAddress, request.collectionId, [request.nft.id || '']).catch((e) => console.warn(e));

      this.isInWalletAccount(request.recipientAddress).then((res) => {
        if (res) {
          state.updateNftData(request.chain, request.nft, request.recipientAddress);
        }
      }).catch((err) => console.warn(err));
    }

    return true;
  }

  private async validateTransfer (networkKey: string, token: string | undefined, from: string, to: string, password: string | undefined, value: string | undefined, transferAll: boolean | undefined): Promise<[Array<BasicTxError>, KeyringPair | undefined, BN | undefined, TokenInfo | undefined]> {
    const dotSamaApiMap = state.getDotSamaApiMap();
    const errors = [] as Array<BasicTxError>;
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
        code: BasicTxErrorCode.KEYRING_ERROR,
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

      if (isEthereumAddress(from) && isEthereumAddress(to) && !tokenInfo?.isMainToken && !(tokenInfo?.contractAddress)) {
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
    let mainToken: string | undefined;

    if (tokenInfo && !tokenInfo.isMainToken) {
      mainToken = state.getNetworkMapByKey(networkKey).nativeToken as string;
    }

    let fee = '0';
    let feeSymbol;
    let fromAccountFreeBalance = '0';
    let toAccountFreeBalance = '0';
    let fromAccountNativeBalance = '0';

    if (isEthereumAddress(from) && isEthereumAddress(to)) {
      // @ts-ignore
      [fromAccountFreeBalance, toAccountFreeBalance] = await Promise.all([
        getFreeBalance(networkKey, from, dotSamaApiMap, web3ApiMap, token),
        getFreeBalance(networkKey, to, dotSamaApiMap, web3ApiMap, token)
      ]);
      const txVal: string = transferAll ? fromAccountFreeBalance : (value || '0');

      // Estimate with EVM API
      if (tokenInfo && !tokenInfo.isMainToken && tokenInfo.contractAddress) {
        [, , fee] = await getERC20TransactionObject(tokenInfo.contractAddress, networkKey, from, to, txVal, !!transferAll, web3ApiMap);
      } else {
        [, , fee] = await getEVMTransactionObject(networkKey, to, txVal, !!transferAll, web3ApiMap);
      }
    } else {
      // Estimate with DotSama API
      if (tokenInfo && !tokenInfo.isMainToken) {
        [[fee, feeSymbol], fromAccountFreeBalance, toAccountFreeBalance, fromAccountNativeBalance] = await Promise.all(
          [
            estimateFee(networkKey, fromKeyPair, to, value, !!transferAll, dotSamaApiMap, tokenInfo),
            getFreeBalance(networkKey, from, dotSamaApiMap, web3ApiMap, token),
            getFreeBalance(networkKey, to, dotSamaApiMap, web3ApiMap, token),
            getFreeBalance(networkKey, from, dotSamaApiMap, web3ApiMap, mainToken)
          ]
        );
      } else {
        [[fee, feeSymbol], fromAccountFreeBalance, toAccountFreeBalance] = await Promise.all(
          [
            estimateFee(networkKey, fromKeyPair, to, value, !!transferAll, dotSamaApiMap, tokenInfo),
            getFreeBalance(networkKey, from, dotSamaApiMap, web3ApiMap, token),
            getFreeBalance(networkKey, to, dotSamaApiMap, web3ApiMap, token)
          ]
        );
      }
    }

    const fromAccountFreeNumber = new BN(fromAccountFreeBalance);
    const feeNumber = fee ? new BN(fee) : undefined;
    const fromAccountNativeBalanceNumber = new BN(fromAccountNativeBalance);

    if (!transferAll && value && feeNumber && valueNumber) {
      if (tokenInfo && tokenInfo.isMainToken) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        if (fromAccountFreeNumber.lt(feeNumber.add(valueNumber))) {
          errors.push({
            code: TransferErrorCode.NOT_ENOUGH_VALUE,
            message: 'Not enough balance free to make transfer'
          });
        }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        if (fromAccountNativeBalanceNumber.lt(feeNumber) || valueNumber > fromAccountFreeNumber) {
          errors.push({
            code: TransferErrorCode.NOT_ENOUGH_VALUE,
            message: 'Not enough balance free to make transfer'
          });
        }
      }
    }

    return {
      errors,
      fromAccountFree: fromAccountFreeBalance,
      toAccountFree: toAccountFreeBalance,
      estimateFee: fee,
      feeSymbol
    } as ResponseCheckTransfer;
  }

  private async validateCrossChainTransfer (
    originNetworkKey: string,
    destinationNetworkKey: string,
    token: string,
    from: string, to: string,
    password: string | undefined,
    value: string): Promise<[Array<BasicTxError>, KeyringPair | undefined, BN | undefined, TokenInfo | undefined]> {
    const dotSamaApiMap = state.getDotSamaApiMap();
    const errors = [] as Array<BasicTxError>;
    let keypair: KeyringPair | undefined;
    const transferValue = new BN(value);

    try {
      keypair = keyring.getPair(from);

      if (password) {
        keypair.unlock(password);
      }
    } catch (e) {
      errors.push({
        code: BasicTxErrorCode.KEYRING_ERROR,
        // @ts-ignore
        message: String(e.message)
      });
    }

    const tokenInfo: TokenInfo | undefined = await getTokenInfo(originNetworkKey, dotSamaApiMap[originNetworkKey].api, token);

    if (!tokenInfo) {
      errors.push({
        code: TransferErrorCode.INVALID_TOKEN,
        message: 'Not found token from registry'
      });
    }

    return [errors, keypair, transferValue, tokenInfo];
  }

  private async checkCrossChainTransfer ({ destinationNetworkKey, from, originNetworkKey, to, token, value }: RequestCheckCrossChainTransfer): Promise<ResponseCheckCrossChainTransfer> {
    const [errors, fromKeyPair, valueNumber, tokenInfo] = await this.validateCrossChainTransfer(originNetworkKey, destinationNetworkKey, token, from, to, undefined, value);
    const dotSamaApiMap = state.getDotSamaApiMap();
    const web3ApiMap = state.getApiMap().web3;
    let fee = '0';
    let feeString;
    let fromAccountFree = '0';

    if (tokenInfo && fromKeyPair) {
      [[fee, feeString], fromAccountFree] = await Promise.all([
        estimateCrossChainFee(
          originNetworkKey,
          destinationNetworkKey,
          to,
          fromKeyPair,
          value,
          dotSamaApiMap,
          tokenInfo,
          state.getNetworkMap()
        ),
        getFreeBalance(originNetworkKey, from, dotSamaApiMap, web3ApiMap)
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
      feeString,
      estimatedFee: fee,
      feeSymbol: state.getNetworkMapByKey(originNetworkKey).nativeToken as string
    };
  }

  private makeTransferCallback (
    address: string,
    recipientAddress: string,
    networkKey: string,
    token: string | undefined,
    portCallback: (res: BasicTxResponse) => void): (res: BasicTxResponse) => void {
    return (res: BasicTxResponse) => {
      // !res.isFinalized to prevent duplicate action
      if (!res.isFinalized && res.txResult && res.extrinsicHash) {
        const transaction = {
          time: Date.now(),
          networkKey,
          change: res.txResult.change,
          changeSymbol: res.txResult.changeSymbol || token,
          fee: res.txResult.fee,
          feeSymbol: res.txResult.feeSymbol,
          isSuccess: !!res.status,
          extrinsicHash: res.extrinsicHash
        } as TransactionHistoryItemType;

        state.setHistory(address, networkKey, { ...transaction, action: 'send' });

        this.isInWalletAccount(recipientAddress).then((isValid) => {
          if (isValid) {
            state.setHistory(recipientAddress, networkKey, { ...transaction, action: 'received' });
          } else {
            console.log(`The recipient address [${recipientAddress}] is not in wallet.`);
          }
        }).catch((err) => console.warn(err));
      }

      portCallback(res);
    };
  }

  private makeCrossChainTransferCallback (
    address: string,
    recipientAddress: string,
    originalNetworkKey: string,
    value: string,
    token: string | undefined,
    portCallback: (res: BasicTxResponse) => void): (res: BasicTxResponse) => void {
    return (res: BasicTxResponse) => {
      // !res.isFinalized to prevent duplicate action
      if (!res.isFinalized && res.txResult && res.extrinsicHash) {
        const change = (parseInt(res.txResult.change) || parseInt(value)).toString();
        const transaction = {
          time: Date.now(),
          networkKey: originalNetworkKey,
          change: change,
          changeSymbol: res.txResult.changeSymbol || token,
          fee: res.txResult.fee,
          feeSymbol: res.txResult.feeSymbol,
          isSuccess: !!res.status,
          extrinsicHash: res.extrinsicHash
        } as TransactionHistoryItemType;

        const setSendHistory = new Promise((resolve) => {
          state.setHistory(address, originalNetworkKey, { ...transaction, action: 'send' }, resolve);
        });

        setSendHistory.then(() => {
          this.isInWalletAccount(recipientAddress).then((isValid) => {
            if (isValid) {
              state.setHistory(recipientAddress, originalNetworkKey, { ...transaction, action: 'received' });
            } else {
              console.log(`The recipient address [${recipientAddress}] is not in wallet.`);
            }
          }).catch((err) => console.warn(err));
        }).catch((err) => console.warn(err));
      }

      portCallback(res);
    };
  }

  private async makeTransfer (id: string, port: chrome.runtime.Port, { from,
    networkKey,
    password,
    to,
    token,
    transferAll,
    value }: RequestTransfer): Promise<BasicTxResponse> {
    const txState: BasicTxResponse = {};

    const [errors, fromKeyPair, , tokenInfo] = await this.validateTransfer(networkKey, token, from, to, password, value, transferAll);

    if (errors.length) {
      txState.txError = true;
      txState.errors = errors;
      setTimeout(() => {
        this.cancelSubscription(id);
      }, 500);

      // todo: add condition to lock KeyPair (for example: not remember password)
      fromKeyPair && fromKeyPair.lock();

      return txState;
    }

    if (fromKeyPair) {
      const cb = createSubscription<'pri(accounts.transfer)'>(id, port);
      const callback = this.makeTransferCallback(from, to, networkKey, token, cb);

      let transferProm: Promise<void> | undefined;

      if (isEthereumAddress(from) && isEthereumAddress(to)) {
        // Make transfer with EVM API
        const { privateKey } = this.accountExportPrivateKey({ address: from, password });
        const web3ApiMap = state.getApiMap().web3;

        if (tokenInfo && !tokenInfo.isMainToken && tokenInfo.contractAddress) {
          transferProm = makeERC20Transfer(
            tokenInfo.contractAddress, networkKey, from, to, privateKey, value || '0', !!transferAll, web3ApiMap,
            callback
          );
        } else {
          transferProm = makeEVMTransfer(
            networkKey, to, privateKey, value || '0', !!transferAll, web3ApiMap,
            callback
          );
        }
      } else {
        const dotSamaApiMap = state.getDotSamaApiMap();

        // Make transfer with Dotsama API
        transferProm = makeTransfer({
          networkKey: networkKey,
          tokenInfo: tokenInfo,
          value: value || '0',
          to: to,
          dotSamaApiMap: dotSamaApiMap,
          transferAll: !!transferAll,
          callback: callback,
          from: fromKeyPair.address
        });
      }

      transferProm.then(() => {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Start transfer ${transferAll ? 'all' : value} from ${from} to ${to}`);

        // todo: add condition to lock KeyPair
        fromKeyPair.lock();
      })
        .catch((e) => {
          // eslint-disable-next-line node/no-callback-literal
          cb({ txError: true, status: false, errors: [({ code: TransferErrorCode.TRANSFER_ERROR, message: (e as Error).message })] });
          console.error('Transfer error', e);
          setTimeout(() => {
            this.cancelSubscription(id);
          }, 500);

          // todo: add condition to lock KeyPair
          fromKeyPair.lock();
        });
    }

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return txState;
  }

  private async makeCrossChainTransfer (id: string, port: chrome.runtime.Port,
    { destinationNetworkKey,
      from,
      originNetworkKey,
      password,
      to,
      token,
      value }: RequestCrossChainTransfer): Promise<BasicTxResponse> {
    const txState: BasicTxResponse = {};

    const [errors, fromKeyPair, , tokenInfo] = await this.validateCrossChainTransfer(
      originNetworkKey,
      destinationNetworkKey,
      token, from, to, password, value);

    if (errors.length) {
      txState.txError = true;
      txState.errors = errors;
      setTimeout(() => {
        this.cancelSubscription(id);
      }, 500);

      // todo: add condition to lock KeyPair (for example: not remember password)
      fromKeyPair && fromKeyPair.lock();

      return txState;
    }

    if (fromKeyPair && tokenInfo) {
      const cb = createSubscription<'pri(accounts.crossChainTransfer)'>(id, port);
      const callback = this.makeCrossChainTransferCallback(from, to, originNetworkKey, value || '0', token, cb);

      const dotSamaApiMap = state.getDotSamaApiMap();
      const networkMap = state.getNetworkMap();

      const transferProm = makeCrossChainTransfer({
        callback: callback,
        tokenInfo: tokenInfo,
        value: value || '0',
        fromKeypair: fromKeyPair,
        to: to,
        dotSamaApiMap: dotSamaApiMap,
        originNetworkKey: originNetworkKey,
        destinationNetworkKey: destinationNetworkKey,
        networkMap: networkMap
      });

      transferProm.then(() => {
        console.log(`Start cross-chain transfer ${value} from ${from} to ${to}`);

        fromKeyPair.lock();
      })
        .catch((e) => {
          // eslint-disable-next-line node/no-callback-literal
          cb({ txError: true, status: false, errors: [({ code: TransferErrorCode.TRANSFER_ERROR, message: (e as Error).message })] });
          console.error('Transfer error', e);
          setTimeout(() => {
            this.cancelSubscription(id);
          }, 500);

          // todo: add condition to lock KeyPair
          fromKeyPair.lock();
        });
    }

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return txState;
  }

  private async evmNftGetTransaction ({ networkKey, params, recipientAddress, senderAddress }: NftTransactionRequest): Promise<EvmNftTransaction> {
    const contractAddress = params.contractAddress as string;
    const tokenId = params.tokenId as string;
    const networkJson = state.getNetworkMapByKey(networkKey);

    try {
      return await getERC721Transaction(state.getWeb3ApiMap(), state.getDotSamaApiMap(), networkJson, networkKey, contractAddress, senderAddress, recipientAddress, tokenId);
    } catch (e) {
      console.error('error handling web3 transfer nft', e);

      return {
        tx: null,
        estimatedFee: null,
        balanceError: false
      };
    }
  }

  private async evmNftSubmitTransaction (id: string, port: chrome.runtime.Port, { networkKey,
    password,
    rawTransaction,
    recipientAddress,
    senderAddress }: RequestEvmNftSubmitTransaction): Promise<NftTransactionResponse> {
    const updateState = createSubscription<'pri(evmNft.submitTransaction)'>(id, port);
    let parsedPrivateKey = '';
    const network = state.getNetworkMapByKey(networkKey);
    const isSendingSelf = isRecipientSelf(senderAddress, recipientAddress);
    const txState = { isSendingSelf: isSendingSelf } as NftTransactionResponse;

    try {
      const { privateKey } = this.accountExportPrivateKey({ address: senderAddress, password });

      parsedPrivateKey = privateKey.slice(2);
      txState.passwordError = null;
      updateState(txState);
    } catch (e) {
      txState.passwordError = 'Unable to decode using the supplied passphrase';
      updateState(txState);

      port.onDisconnect.addListener((): void => {
        this.cancelSubscription(id);
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
            txState.extrinsicHash = receipt.transactionHash as string;
          }

          updateState(txState);
        });
    } catch (e) {
      txState.txError = true;

      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      if (e.toString().includes('insufficient funds')) {
        txState.errors = [{ code: BasicTxErrorCode.BALANCE_TO_LOW, message: (e as Error).message }];
      }

      updateState(txState);
    }

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
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

    this.createUnsubscriptionHandle(id, networkMapSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
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
      console.error(e);

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

  private async validateNetwork ({ existedNetwork,
    isEthereum,
    provider }: ValidateNetworkRequest): Promise<ValidateNetworkResponse> {
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
      const { conflictChain: providerConflictChain,
        conflictKey: providerConflictKey,
        error: providerError } = this.validateProvider([provider], false);

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
            const { conflictChain: genesisConflictChain,
              conflictKey: genesisConflictKey,
              error: genesisError } = this.validateGenesisHash(genesisHash);

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

  private subscribeCustomTokenState (id: string, port: chrome.runtime.Port): CustomTokenJson {
    const cb = createSubscription<'pri(customTokenState.getSubscription)'>(id, port);

    const customTokenSubscription = state.subscribeCustomToken().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    this.createUnsubscriptionHandle(id, customTokenSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return state.getCustomTokenState();
  }

  private getEvmTokenState () {
    return state.getCustomTokenState();
  }

  private upsertCustomToken (data: CustomToken) {
    try {
      state.upsertCustomToken(data);

      return true;
    } catch (e) {
      console.error('Error insert/update custom token', e);

      return false;
    }
  }

  private deleteCustomToken (data: DeleteCustomTokenParams[]) {
    state.deleteCustomTokens(data);

    return true;
  }

  private async validateCustomToken (data: ValidateCustomTokenRequest): Promise<ValidateCustomTokenResponse> {
    const customTokenState = state.getCustomTokenState();
    let isExist = false;

    // check exist in customTokenState
    for (const token of customTokenState[data.type]) {
      if (isEqualContractAddress(token.smartContract, data.smartContract) && token.type === data.type && token.chain === data.chain && !token.isDeleted) {
        isExist = true;
        break;
      }
    }

    // check exist in chainRegistry
    if (!isExist && (FUNGIBLE_TOKEN_STANDARDS.includes(data.type))) {
      const chainRegistryMap = state.getChainRegistryMap();
      const tokenMap = chainRegistryMap[data.chain].tokenMap;

      for (const token of Object.values(tokenMap)) {
        if (token?.contractAddress?.toLowerCase() === data.smartContract.toLowerCase()) {
          isExist = true;
          break;
        }
      }
    }

    if (isExist) {
      return {
        name: '',
        symbol: '',
        isExist,
        contractError: false
      };
    }

    const { contractError, decimals, name, symbol } = await validateCustomToken(data.smartContract, data.type, state.getWeb3Api(data.chain), state.getDotSamaApi(data.chain), data.contractCaller);

    return {
      name,
      decimals,
      symbol,
      isExist,
      contractError
    };
  }

  private async subscribeAddressFreeBalance ({ address,
    networkKey,
    token }: RequestFreeBalance, id: string, port: chrome.runtime.Port): Promise<string> {
    const cb = createSubscription<'pri(freeBalance.subscribe)'>(id, port);

    this.createUnsubscriptionHandle(
      id,
      await subscribeFreeBalance(networkKey, address, state.getDotSamaApiMap(), state.getWeb3ApiMap(), token, cb)
    );

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return id;
  }

  private async transferCheckReferenceCount ({ address,
    networkKey }: RequestTransferCheckReferenceCount): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
    return await checkReferenceCount(networkKey, address, state.getDotSamaApiMap());
  }

  private async transferCheckSupporting ({ networkKey,
    token }: RequestTransferCheckSupporting): Promise<SupportTransferResponse> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
    return await checkSupportTransfer(networkKey, token, state.getDotSamaApiMap());
  }

  private async transferGetExistentialDeposit ({ networkKey, token }: RequestTransferExistentialDeposit): Promise<string> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
    return await getExistentialDeposit(networkKey, token, state.getDotSamaApiMap());
  }

  private async substrateNftGetTransaction ({ networkKey, params, recipientAddress, senderAddress }: NftTransactionRequest): Promise<SubstrateNftTransaction> {
    const networkJson = state.getNetworkMapByKey(networkKey);

    switch (networkKey) {
      case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.acala:
        return await acalaTransferHandler(networkKey, state.getDotSamaApiMap(), state.getWeb3ApiMap(), senderAddress, recipientAddress, params, networkJson);
      case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.karura:
        return await acalaTransferHandler(networkKey, state.getDotSamaApiMap(), state.getWeb3ApiMap(), senderAddress, recipientAddress, params, networkJson);
      case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.kusama:
        return await rmrkTransferHandler(networkKey, state.getDotSamaApiMap(), state.getWeb3ApiMap(), senderAddress, recipientAddress, params, networkJson);
      case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.uniqueNft:
        return await uniqueTransferHandler(networkKey, state.getDotSamaApiMap(), state.getWeb3ApiMap(), senderAddress, recipientAddress, params, networkJson);
      case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.quartz:
        return await quartzTransferHandler(networkKey, state.getDotSamaApiMap(), state.getWeb3ApiMap(), senderAddress, recipientAddress, params, networkJson);
      case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.opal:
        return await quartzTransferHandler(networkKey, state.getDotSamaApiMap(), state.getWeb3ApiMap(), senderAddress, recipientAddress, params, networkJson);
      case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.statemine:
        return await statemineTransferHandler(networkKey, state.getDotSamaApiMap(), state.getWeb3ApiMap(), senderAddress, recipientAddress, params, networkJson);
      case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.statemint:
        return await statemineTransferHandler(networkKey, state.getDotSamaApiMap(), state.getWeb3ApiMap(), senderAddress, recipientAddress, params, networkJson);
      case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.bitcountry:
        return await acalaTransferHandler(networkKey, state.getDotSamaApiMap(), state.getWeb3ApiMap(), senderAddress, recipientAddress, params, networkJson);
      case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.pioneer:
        return await acalaTransferHandler(networkKey, state.getDotSamaApiMap(), state.getWeb3ApiMap(), senderAddress, recipientAddress, params, networkJson);
    }

    return {
      error: true,
      balanceError: false
    };
  }

  private async substrateNftSubmitTransaction (id: string, port: chrome.runtime.Port, { params,
    password,
    recipientAddress,
    senderAddress }: RequestSubstrateNftSubmitTransaction): Promise<NftTransactionResponse> {
    const isSendingSelf = isRecipientSelf(senderAddress, recipientAddress);
    const txState: NftTransactionResponse = { isSendingSelf: isSendingSelf };

    if (params === null) {
      txState.txError = true;

      return txState;
    }

    const isPSP34 = params.isPsp34 as boolean | undefined;
    const cb = createSubscription<'pri(substrateNft.submitTransaction)'>(id, port);
    const networkKey = params.networkKey as string;

    const callback: HandleBasicTx = (data: BasicTxResponse) => {
      // eslint-disable-next-line node/no-callback-literal
      cb({ ...data, isSendingSelf: isSendingSelf });
    };

    const apiProps = state.getDotSamaApi(networkKey);
    const extrinsic = !isPSP34
      ? getNftTransferExtrinsic(networkKey, apiProps, senderAddress, recipientAddress, params)
      : await getPSP34TransferExtrinsic(networkKey, apiProps, senderAddress, recipientAddress, params);

    await signAndSendExtrinsic({
      type: SignerType.PASSWORD,
      callback: callback,
      apiProps: apiProps,
      address: senderAddress,
      txState: txState,
      extrinsic: extrinsic,
      errorMessage: 'error transferring nft',
      password: password
    });

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return txState;
  }

  private enableNetworks (targetKeys: string[]) {
    try {
      for (const networkKey of targetKeys) {
        this.enableNetworkMap(networkKey);
      }
    } catch (e) {
      return false;
    }

    return true;
  }

  private async disableNetworks (targetKeys: string[]) {
    try {
      for (const key of targetKeys) {
        await this.disableNetworkMap(key);
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
    return state.setAccountTie(address, genesisHash);
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
        const networkMap = state.getNetworkMap();
        let _gen = '';

        if (genesisHash) {
          for (const network of Object.values(networkMap)) {
            if (network.evmChainId === parseInt(genesisHash)) {
              _gen = network.genesisHash;
            }
          }
        }

        result = keyring.keyring.addFromAddress(address, { name, isExternal: true, isReadOnly, genesisHash: _gen }, null, 'ethereum');

        keyring.saveAccount(result);
      } else {
        result = keyring.addExternal(address, { genesisHash, name, isReadOnly }).pair;
      }

      const _address = result.address;

      await new Promise<void>((resolve) => {
        state.addAccountRef([_address], () => {
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
      state.addAccountRef([_address], () => {
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

  private async accountsCreateWithSecret ({ isAllow,
    isEthereum,
    name,
    password,
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

            keyringPair = keyring.addUri(getSuri(suri, type), password, { name: name }, type).pair;
          }
        }
      } else {
        keyringPair = keyring.keyring.addFromPair({ publicKey: hexToU8a(publicKey), secretKey: hexToU8a(secretKey) }, { name });
        keyring.addPair(keyringPair, password);
      }

      if (!keyringPair) {
        return {
          success: false,
          errors: [{ code: AccountExternalErrorCode.KEYRING_ERROR, message: 'Invalid keyring' }]
        };
      }

      const _address = keyringPair.address;

      await new Promise<void>((resolve) => {
        state.addAccountRef([_address], () => {
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

  private prepareExternalRequest (): PrepareExternalRequest {
    const id: string = getId();

    state.cleanExternalRequest();

    const setState = (promise: ExternalRequestPromise) => {
      state.setExternalRequestMap(id, promise);
    };

    const updateState = (promise: Partial<ExternalRequestPromise>) => {
      state.updateExternalRequest(id, { ...promise, resolve: undefined, reject: undefined });
    };

    return {
      id,
      setState,
      updateState
    };
  }

  // Transfer action

  private async makeCrossChainTransferExternal (
    id: string,
    { destinationNetworkKey,
      from,
      originNetworkKey,
      to,
      token,
      value }: RequestCrossChainTransferExternal,
    cb: HandleBasicTx,
    signerType: SignerExternal): Promise<BasicTxResponse> {
    const txState: BasicTxResponse = {};
    const [errors, fromKeyPair, , tokenInfo] = await this.validateCrossChainTransfer(
      originNetworkKey,
      destinationNetworkKey,
      token, from, to, undefined, value);

    if (errors.length) {
      txState.txError = true;
      txState.errors = errors;
      setTimeout(() => {
        this.cancelSubscription(id);
      }, 500);

      return txState;
    }

    if (fromKeyPair && tokenInfo) {
      const callback = this.makeCrossChainTransferCallback(from, to, originNetworkKey, value || '0', token, cb);
      const { id: requestId, setState, updateState } = this.prepareExternalRequest();

      const network = state.getNetworkMapByKey(originNetworkKey);
      const apiProps = state.getDotSamaApi(originNetworkKey);

      const transferProm = makeCrossChainTransferExternal({
        network: network,
        destinationNetworkKey: destinationNetworkKey,
        recipientAddress: to,
        senderAddress: fromKeyPair.address,
        value: value || '0',
        dotSamaApiMap: state.getDotSamaApiMap(),
        tokenInfo: tokenInfo,
        networkMap: state.getNetworkMap(),
        id: requestId,
        setState: setState,
        updateState: updateState,
        callback: callback,
        signerType: signerType,
        apiProps: apiProps
      });

      transferProm.then(() => {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Start cross-chain transfer ${value} from ${from} to ${to}`);
      })
        .catch((e) => {
          // eslint-disable-next-line node/no-callback-literal
          callback({ txError: true, status: false, errors: [({ code: TransferErrorCode.TRANSFER_ERROR, message: (e as Error).message })] });
          console.error('XCM Transfer error', e);
          setTimeout(() => {
            this.cancelSubscription(id);
          }, 500);
        });
    }

    return txState;
  }

  private makeTransferNftSubstrateExternal (
    id: string,
    { params,
      recipientAddress,
      senderAddress }: RequestNftTransferExternalSubstrate,
    cb: (data: NftTransactionResponse) => void,
    signerType: SignerExternal): NftTransactionResponse {
    const isSendingSelf = isRecipientSelf(senderAddress, recipientAddress);
    const txState: NftTransactionResponse = { isSendingSelf: isSendingSelf };

    if (params === null) {
      txState.txError = true;
      txState.errors = [{ code: BasicTxErrorCode.INVALID_PARAM, message: 'Invalid params' }];
      setTimeout(() => {
        this.cancelSubscription(id);
      }, 500);

      return txState;
    }

    const callback: HandleBasicTx = (data: BasicTxResponse) => {
      // eslint-disable-next-line node/no-callback-literal
      cb({ ...data, isSendingSelf: isSendingSelf });
    };

    const { id: requestId, setState, updateState } = this.prepareExternalRequest();

    const networkKey = params.networkKey as string;
    const apiProps = state.getDotSamaApi(networkKey);
    const network = state.getNetworkMapByKey(networkKey);

    const transferProm = makeNftTransferExternal({
      callback: callback,
      senderAddress: senderAddress,
      id: requestId,
      setState: setState,
      updateState: updateState,
      apiProps: apiProps,
      recipientAddress: recipientAddress,
      params: params,
      network: network,
      signerType: signerType
    });

    transferProm.then(() => {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      console.log(`Start transfer nft from ${senderAddress} to ${recipientAddress}`);
    })
      .catch((e) => {
        if (!e) {
          // eslint-disable-next-line node/no-callback-literal
          cb({ txError: true, isSendingSelf: isSendingSelf });
        } else {
          // eslint-disable-next-line node/no-callback-literal
          cb({ txError: true, isSendingSelf: isSendingSelf, status: false });
        }

        console.error('Error transferring nft', e);
        setTimeout(() => {
          this.cancelSubscription(id);
        }, 500);
      });

    return txState;
  }

  // Stake action

  private stakeCreateExternal (
    id: string,
    { amount,
      bondedValidators,
      isBondedBefore,
      lockPeriod,
      networkKey,
      nominatorAddress,
      validatorInfo }: RequestStakeExternal,
    callback: HandleBasicTx,
    signerType: SignerExternal
  ): BasicTxResponse {
    const txState: BasicTxResponse = {};

    if (!amount || !nominatorAddress || !validatorInfo) {
      txState.txError = true;
      txState.errors = [{ code: BasicTxErrorCode.INVALID_PARAM, message: 'Invalid params' }];

      return txState;
    }

    const network = state.getNetworkMapByKey(networkKey);
    const apiProp = state.getDotSamaApi(networkKey);

    const { id: requestId, setState, updateState } = this.prepareExternalRequest();

    const prom = createStakeExternal({
      apiProps: apiProp,
      id: requestId,
      bondedValidators: bondedValidators,
      network: network,
      amount: amount,
      isBondedBefore: isBondedBefore,
      validatorInfo: validatorInfo,
      nominatorAddress: nominatorAddress,
      updateState: updateState,
      setState: setState,
      callback: callback,
      lockPeriod: lockPeriod,
      signerType: signerType
    });

    prom.then(() => {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      console.log(`Start staking from ${nominatorAddress}`);
    })
      .catch((e) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,node/no-callback-literal,@typescript-eslint/no-unsafe-member-access
        if (!e) {
          // eslint-disable-next-line node/no-callback-literal
          callback({ txError: true });
        } else {
          // eslint-disable-next-line node/no-callback-literal
          callback({ txError: true, status: false });
        }

        console.error('Error staking', e);
        setTimeout(() => {
          this.cancelSubscription(id);
        }, 500);
      });

    return txState;
  }

  private unStakeCreateExternal (
    id: string,
    { address,
      amount,
      networkKey,
      unstakeAll,
      validatorAddress }: RequestUnStakeExternal,
    callback: HandleBasicTx,
    signerType: SignerExternal): BasicTxResponse {
    const txState: BasicTxResponse = {};

    if (!amount || !address) {
      txState.txError = true;
      txState.errors = [{ code: BasicTxErrorCode.INVALID_PARAM, message: 'Invalid params' }];

      return txState;
    }

    const network = state.getNetworkMapByKey(networkKey);
    const apiProp = state.getDotSamaApi(networkKey);

    const { id: requestId, setState, updateState } = this.prepareExternalRequest();

    const prom = createUnStakeExternal({
      apiProps: apiProp,
      id: requestId,
      address: address,
      network: network,
      amount: amount,
      updateState: updateState,
      setState: setState,
      validatorAddress: validatorAddress,
      unstakeAll: unstakeAll,
      callback: callback,
      signerType: signerType
    });

    prom.then(() => {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      console.log(`Start un-staking from ${address}`);
    })
      .catch((e) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,node/no-callback-literal,@typescript-eslint/no-unsafe-member-access
        if (!e) {
          // eslint-disable-next-line node/no-callback-literal
          callback({ txError: true });
        } else {
          // eslint-disable-next-line node/no-callback-literal
          callback({ txError: true, status: false });
        }

        console.error('Error un-staking', e);
        setTimeout(() => {
          this.cancelSubscription(id);
        }, 500);
      });

    return txState;
  }

  private withdrawStakeCreateExternal (
    id: string,
    { action,
      address,
      networkKey,
      validatorAddress }: RequestWithdrawStakeExternal,
    callback: HandleBasicTx,
    signerType: SignerExternal): BasicTxResponse {
    const txState: BasicTxResponse = {};

    if (!address) {
      txState.txError = true;
      txState.errors = [{ code: BasicTxErrorCode.INVALID_PARAM, message: 'Invalid params' }];

      return txState;
    }

    const apiProp = state.getDotSamaApi(networkKey);
    const network = state.getNetworkMapByKey(networkKey);

    const { id: requestId, setState, updateState } = this.prepareExternalRequest();

    const prom = createWithdrawStakeExternal({
      action: action,
      address: address,
      apiProps: apiProp,
      callback: callback,
      id: requestId,
      network: network,
      setState: setState,
      updateState: updateState,
      validatorAddress: validatorAddress,
      signerType: signerType
    });

    prom.then(() => {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      console.log(`Start withdraw-staking from ${address}`);
    })
      .catch((e) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,node/no-callback-literal,@typescript-eslint/no-unsafe-member-access
        if (!e) {
          // eslint-disable-next-line node/no-callback-literal
          callback({ txError: true });
        } else {
          // eslint-disable-next-line node/no-callback-literal
          callback({ txError: true, status: false });
        }

        console.error('Error withdraw-staking', e);
        setTimeout(() => {
          this.cancelSubscription(id);
        }, 500);
      });

    return txState;
  }

  private claimRewardCreateExternal (
    id: string,
    { address,
      networkKey,
      stakingType,
      validatorAddress }: RequestClaimRewardExternal,
    callback: HandleBasicTx,
    signerType: SignerExternal): BasicTxResponse {
    const txState: BasicTxResponse = {};

    if (!address) {
      txState.txError = true;
      txState.errors = [{ code: BasicTxErrorCode.INVALID_PARAM, message: 'Invalid params' }];

      return txState;
    }

    const network = state.getNetworkMapByKey(networkKey);
    const apiProp = state.getDotSamaApi(networkKey);

    const { id: requestId, setState, updateState } = this.prepareExternalRequest();

    const prom = createClaimRewardExternal({
      apiProps: apiProp,
      id: requestId,
      network: network,
      updateState: updateState,
      setState: setState,
      callback: callback,
      address: address,
      validatorAddress: validatorAddress,
      signerType: signerType,
      stakingType: stakingType
    });

    prom.then(() => {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      console.log(`Start claim reward from ${address}`);
    })
      .catch((e) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,node/no-callback-literal,@typescript-eslint/no-unsafe-member-access
        if (!e) {
          // eslint-disable-next-line node/no-callback-literal
          callback({ txError: true });
        } else {
          // eslint-disable-next-line node/no-callback-literal
          callback({ txError: true, status: false });
        }

        console.error('Error claim reward', e);
        setTimeout(() => {
          this.cancelSubscription(id);
        }, 500);
      });

    return txState;
  }

  private createCompoundCreateExternal (
    id: string,
    { accountMinimum,
      address,
      bondedAmount,
      collatorAddress,
      networkKey }: RequestCreateCompoundStakeExternal,
    callback: HandleBasicTx,
    signerType: SignerExternal): BasicTxResponse {
    const txState: BasicTxResponse = {};

    if (!address) {
      txState.txError = true;
      txState.errors = [{ code: BasicTxErrorCode.INVALID_PARAM, message: 'Invalid params' }];

      return txState;
    }

    const network = state.getNetworkMapByKey(networkKey);
    const apiProp = state.getDotSamaApi(networkKey);

    const { id: requestId, setState, updateState } = this.prepareExternalRequest();

    const prom = createCreateCompoundExternal({
      apiProps: apiProp,
      id: requestId,
      network: network,
      updateState: updateState,
      setState: setState,
      callback: callback,
      address: address,
      collatorAddress: collatorAddress,
      bondedAmount: bondedAmount,
      accountMinimum: accountMinimum,
      signerType: signerType
    });

    prom.then(() => {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      console.log(`Start create compound from ${address}`);
    })
      .catch((e) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,node/no-callback-literal,@typescript-eslint/no-unsafe-member-access
        if (!e) {
          // eslint-disable-next-line node/no-callback-literal
          callback({ txError: true });
        } else {
          // eslint-disable-next-line node/no-callback-literal
          callback({ txError: true, status: false });
        }

        console.error('Error compounding Turing stake', e);
        setTimeout(() => {
          this.cancelSubscription(id);
        }, 500);
      });

    return txState;
  }

  private cancelCompoundCreateExternal (
    id: string,
    { address,
      networkKey,
      taskId }: RequestCancelCompoundStakeExternal,
    callback: HandleBasicTx,
    signerType: SignerExternal): BasicTxResponse {
    const txState: BasicTxResponse = {};

    if (!address) {
      txState.txError = true;
      txState.errors = [{ code: BasicTxErrorCode.INVALID_PARAM, message: 'Invalid params' }];

      return txState;
    }

    const network = state.getNetworkMapByKey(networkKey);

    const apiProp = state.getDotSamaApi(networkKey);

    const { id: requestId, setState, updateState } = this.prepareExternalRequest();

    const prom = createCancelCompoundExternal({
      apiProps: apiProp,
      id: requestId,
      network: network,
      updateState: updateState,
      setState: setState,
      callback: callback,
      address: address,
      taskId: taskId,
      signerType: signerType
    });

    prom.then(() => {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      console.log(`Start cancel compound from ${address}`);
    })
      .catch((e) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,node/no-callback-literal,@typescript-eslint/no-unsafe-member-access
        if (!e) {
          // eslint-disable-next-line node/no-callback-literal
          callback({ txError: true });
        } else {
          // eslint-disable-next-line node/no-callback-literal
          callback({ txError: true, status: false });
        }

        console.error('Error canceling Turing compounding task stake', e);
        setTimeout(() => {
          this.cancelSubscription(id);
        }, 500);
      });

    return txState;
  }

  // QR

  private async makeTransferQR (id: string, port: chrome.runtime.Port, { from,
    networkKey,
    to,
    token,
    transferAll,
    value }: RequestTransferExternal): Promise<BasicTxResponse> {
    const cb = createSubscription<'pri(accounts.transfer.qr.create)'>(id, port);
    const txState: BasicTxResponse = {};

    const [errors, fromKeyPair, , tokenInfo] = await this.validateTransfer(networkKey, token, from, to, undefined, value, transferAll);

    if (errors.length) {
      txState.txError = true;
      txState.errors = errors;
      setTimeout(() => {
        this.cancelSubscription(id);
      }, 500);

      return txState;
    }

    if (fromKeyPair) {
      const { id: requestId, setState, updateState } = this.prepareExternalRequest();
      const callback = this.makeTransferCallback(from, to, networkKey, token, cb);

      let transferProm: Promise<void>;

      if (isEthereumAddress(from) && isEthereumAddress(to)) {
        const web3ApiMap = state.getApiMap().web3;
        const chainId = state.getNetworkMap()[networkKey].evmChainId || 1;

        if (tokenInfo && !tokenInfo.isMainToken && tokenInfo.contractAddress) {
          transferProm = makeERC20TransferQr(
            {
              assetAddress: tokenInfo.contractAddress,
              callback,
              chainId,
              from,
              id: requestId,
              networkKey,
              setState,
              updateState,
              to,
              transferAll: !!transferAll,
              value: value || '0',
              web3ApiMap
            }
          );
        } else {
          transferProm = makeEVMTransferQr({
            callback,
            chainId,
            from,
            id: requestId,
            networkKey,
            setState,
            to,
            updateState,
            transferAll: !!transferAll,
            value: value || '0',
            web3ApiMap
          });
        }
      } else {
        const apiProps = await state.getDotSamaApiMap()[networkKey].isReady;
        const network = state.getNetworkMapByKey(networkKey);

        transferProm = makeTransferExternal({
          network: network,
          recipientAddress: to,
          senderAddress: fromKeyPair.address,
          value: value || '0',
          transferAll: !!transferAll,
          tokenInfo: tokenInfo,
          id: requestId,
          setState: setState,
          updateState: updateState,
          callback: callback,
          apiProps: apiProps,
          signerType: SignerType.QR
        });
      }

      transferProm.then(() => {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Start transfer ${transferAll ? 'all' : value} from ${from} to ${to}`);
      })
        .catch((e) => {
          if (e) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,node/no-callback-literal,@typescript-eslint/no-unsafe-member-access
            callback({ txError: true, status: false, errors: [({ code: TransferErrorCode.TRANSFER_ERROR, message: (e as Error).message })] });
            console.error('Transfer error', e);
          }

          setTimeout(() => {
            this.cancelSubscription(id);
          }, 500);
        });
    }

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return txState;
  }

  private async makeCrossChainTransferQr (id: string, port: chrome.runtime.Port, request: RequestCrossChainTransferExternal): Promise<BasicTxResponse> {
    const cb = createSubscription<'pri(accounts.cross.transfer.qr.create)'>(id, port);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.makeCrossChainTransferExternal(id, request, cb, SignerType.QR);
  }

  private nftTransferCreateQrSubstrate (id: string, port: chrome.runtime.Port, request: RequestNftTransferExternalSubstrate): NftTransactionResponse {
    const callback = createSubscription<'pri(nft.transfer.qr.create.substrate)'>(id, port);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.makeTransferNftSubstrateExternal(id, request, callback, SignerType.QR);
  }

  private nftTransferCreateQrEvm (id: string,
    port: chrome.runtime.Port,
    { networkKey,
      rawTransaction,
      recipientAddress,
      senderAddress }: RequestNftTransferExternalEVM): NftTransactionResponse {
    const cb = createSubscription<'pri(nft.transfer.qr.create.evm)'>(id, port);
    const network = state.getNetworkMapByKey(networkKey);
    const isSendingSelf = isRecipientSelf(senderAddress, recipientAddress);
    const txState = { isSendingSelf: isSendingSelf } as NftTransactionResponse;

    try {
      const web3ApiMap = state.getWeb3ApiMap();

      const { id: requestId, setState, updateState } = this.prepareExternalRequest();

      const callback: HandleBasicTx = (data: BasicTxResponse) => {
        // eslint-disable-next-line node/no-callback-literal
        cb({ ...data, isSendingSelf: isSendingSelf });
      };

      const transferProm = handleTransferNftQr({
        callback: callback,
        chainId: network.evmChainId || 1,
        id: requestId,
        setState: setState,
        updateState: updateState,
        web3ApiMap: web3ApiMap,
        rawTransaction: rawTransaction,
        networkKey: networkKey,
        from: senderAddress
      });

      transferProm.then(() => {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Start transfer nft from ${senderAddress} to ${recipientAddress}`);
      })
        .catch((e) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,node/no-callback-literal,@typescript-eslint/no-unsafe-member-access
          if (!e) {
            // eslint-disable-next-line node/no-callback-literal
            cb({ txError: true, isSendingSelf: isSendingSelf });
          } else {
            // eslint-disable-next-line node/no-callback-literal
            cb({ txError: true, isSendingSelf: isSendingSelf, status: false });
          }

          console.error('Error transferring nft', e);
          setTimeout(() => {
            this.cancelSubscription(id);
          }, 500);
        });
    } catch (e) {
      txState.txError = true;

      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      if (e.toString().includes('insufficient funds')) {
        txState.errors = [{ code: BasicTxErrorCode.BALANCE_TO_LOW, message: (e as Error).message }];
      }

      cb(txState);
    }

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return txState;
  }

  private stakeCreateQr (id: string, port: chrome.runtime.Port, request: RequestStakeExternal): BasicTxResponse {
    const callback = createSubscription<'pri(stake.qr.create)'>(id, port);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.stakeCreateExternal(id, request, callback, SignerType.QR);
  }

  private unStakeCreateQr (id: string, port: chrome.runtime.Port, request: RequestUnStakeExternal): BasicTxResponse {
    const callback = createSubscription<'pri(unStake.qr.create)'>(id, port);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.unStakeCreateExternal(id, request, callback, SignerType.QR);
  }

  private withdrawStakeCreateQr (id: string, port: chrome.runtime.Port, request: RequestWithdrawStakeExternal): BasicTxResponse {
    const callback = createSubscription<'pri(withdrawStake.qr.create)'>(id, port);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.withdrawStakeCreateExternal(id, request, callback, SignerType.QR);
  }

  private claimRewardCreateQr (id: string, port: chrome.runtime.Port, request: RequestClaimRewardExternal): BasicTxResponse {
    const callback = createSubscription<'pri(claimReward.qr.create)'>(id, port);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.claimRewardCreateExternal(id, request, callback, SignerType.QR);
  }

  private createCompoundCreateQr (id: string, port: chrome.runtime.Port, request: RequestCreateCompoundStakeExternal): BasicTxResponse {
    const callback = createSubscription<'pri(createCompound.qr.create)'>(id, port);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.createCompoundCreateExternal(id, request, callback, SignerType.QR);
  }

  private cancelCompoundCreateQr (id: string, port: chrome.runtime.Port, request: RequestCancelCompoundStakeExternal): BasicTxResponse {
    const callback = createSubscription<'pri(cancelCompound.qr.create)'>(id, port);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.cancelCompoundCreateExternal(id, request, callback, SignerType.QR);
  }

  // External account Ledger

  private async makeTransferLedger (id: string, port: chrome.runtime.Port, { from,
    networkKey,
    to,
    token,
    transferAll,
    value }: RequestTransferExternal): Promise<BasicTxResponse> {
    const cb = createSubscription<'pri(accounts.transfer.ledger.create)'>(id, port);
    const txState: BasicTxResponse = {};
    const [errors, fromKeyPair, , tokenInfo] = await this.validateTransfer(networkKey, token, from, to, undefined, value, transferAll);

    if (errors.length) {
      txState.txError = true;
      txState.errors = errors;
      setTimeout(() => {
        this.cancelSubscription(id);
      }, 500);

      return txState;
    }

    if (fromKeyPair) {
      // Make transfer with Dotsama API
      const { id: requestId, setState, updateState } = this.prepareExternalRequest();

      const callback = this.makeTransferCallback(from, to, networkKey, token, cb);
      const network = state.getNetworkMapByKey(networkKey);
      const apiProps = await state.getDotSamaApiMap()[networkKey].isReady;

      const transferProm = makeTransferExternal({
        network: network,
        recipientAddress: to,
        senderAddress: fromKeyPair.address,
        value: value || '0',
        transferAll: !!transferAll,
        tokenInfo: tokenInfo,
        id: requestId,
        setState: setState,
        updateState: updateState,
        callback: callback,
        apiProps: apiProps,
        signerType: SignerType.LEDGER
      });

      transferProm.then(() => {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Start transfer ${transferAll ? 'all' : value} from ${from} to ${to}`);
      })
        .catch((e) => {
          if (e) {
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,node/no-callback-literal,@typescript-eslint/no-unsafe-member-access
            callback({ txError: true, status: false, errors: [({ code: TransferErrorCode.TRANSFER_ERROR, message: (e as Error).message })] });
            console.error('Transfer error', e);
          }

          setTimeout(() => {
            this.cancelSubscription(id);
          }, 500);
        });
    }

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return txState;
  }

  private async makeCrossChainTransferLedger (id: string, port: chrome.runtime.Port, request: RequestCrossChainTransferExternal): Promise<BasicTxResponse> {
    const cb = createSubscription<'pri(accounts.cross.transfer.ledger.create)'>(id, port);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.makeCrossChainTransferExternal(id, request, cb, SignerType.LEDGER);
  }

  private nftTransferCreateLedgerSubstrate (id: string, port: chrome.runtime.Port, request: RequestNftTransferExternalSubstrate): NftTransactionResponse {
    const callback = createSubscription<'pri(nft.transfer.ledger.create.substrate)'>(id, port);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.makeTransferNftSubstrateExternal(id, request, callback, SignerType.LEDGER);
  }

  private stakeCreateLedger (id: string, port: chrome.runtime.Port, request: RequestStakeExternal): BasicTxResponse {
    const callback = createSubscription<'pri(stake.ledger.create)'>(id, port);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.stakeCreateExternal(id, request, callback, SignerType.LEDGER);
  }

  private unStakeCreateLedger (id: string, port: chrome.runtime.Port, request: RequestUnStakeExternal): BasicTxResponse {
    const callback = createSubscription<'pri(unStake.ledger.create)'>(id, port);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.unStakeCreateExternal(id, request, callback, SignerType.LEDGER);
  }

  private withdrawStakeCreateLedger (id: string, port: chrome.runtime.Port, request: RequestWithdrawStakeExternal): BasicTxResponse {
    const callback = createSubscription<'pri(withdrawStake.ledger.create)'>(id, port);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.withdrawStakeCreateExternal(id, request, callback, SignerType.LEDGER);
  }

  private claimRewardCreateLedger (id: string, port: chrome.runtime.Port, request: RequestClaimRewardExternal): BasicTxResponse {
    const callback = createSubscription<'pri(claimReward.ledger.create)'>(id, port);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.claimRewardCreateExternal(id, request, callback, SignerType.LEDGER);
  }

  private createCompoundCreateLedger (id: string, port: chrome.runtime.Port, request: RequestCreateCompoundStakeExternal): BasicTxResponse {
    const callback = createSubscription<'pri(createCompound.ledger.create)'>(id, port);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.createCompoundCreateExternal(id, request, callback, SignerType.LEDGER);
  }

  private cancelCompoundCreateLedger (id: string, port: chrome.runtime.Port, request: RequestCancelCompoundStakeExternal): BasicTxResponse {
    const callback = createSubscription<'pri(cancelCompound.ledger.create)'>(id, port);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.cancelCompoundCreateExternal(id, request, callback, SignerType.LEDGER);
  }

  // External account request

  private rejectExternalRequest (request: RequestRejectExternalRequest): ResponseRejectExternalRequest {
    const { id, message, throwError } = request;

    const promise = state.getExternalRequest(id);

    if (promise.status === ExternalRequestPromiseStatus.PENDING && promise.reject) {
      if (throwError) {
        promise.reject(new Error(message));
      } else {
        promise.reject();
      }

      state.updateExternalRequest(id, {
        status: ExternalRequestPromiseStatus.REJECTED,
        message: message,
        reject: undefined,
        resolve: undefined
      });
    }
  }

  private resolveQrTransfer (request: RequestResolveExternalRequest): ResponseResolveExternalRequest {
    const { data, id } = request;

    const promise = state.getExternalRequest(id);

    if (promise.status === ExternalRequestPromiseStatus.PENDING) {
      promise.resolve && promise.resolve(data);
      state.updateExternalRequest(id, {
        status: ExternalRequestPromiseStatus.COMPLETED,
        reject: undefined,
        resolve: undefined
      });
    }
  }

  private subscribeConfirmations (id: string, port: chrome.runtime.Port) {
    const cb = createSubscription<'pri(confirmations.subscribe)'>(id, port);

    const subscription = state.getConfirmationsQueueSubject().subscribe(cb);

    this.createUnsubscriptionHandle(id, subscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return state.getConfirmationsQueueSubject().getValue();
  }

  private completeConfirmation (request: RequestConfirmationComplete) {
    return state.completeConfirmation(request);
  }

  // Check account lock
  private accountIsLocked ({ address }: RequestAccountIsLocked): ResponseAccountIsLocked {
    const pair = keyring.getPair(address);

    assert(pair, 'Unable to find pair');

    const remainingTime = this.refreshAccountPasswordCache(pair);

    return {
      isLocked: pair.isLocked,
      remainingTime
    };
  }

  /// Sign Qr

  private getNetworkJsonByChainId (chainId?: number): NetworkJson | null {
    const networkMap = state.getNetworkMap();

    if (!chainId) {
      for (const n in networkMap) {
        if (!Object.prototype.hasOwnProperty.call(networkMap, n)) {
          continue;
        }

        const networkInfo = networkMap[n];

        if (networkInfo.isEthereum) {
          return networkInfo;
        }
      }

      return null;
    }

    for (const n in networkMap) {
      if (!Object.prototype.hasOwnProperty.call(networkMap, n)) {
        continue;
      }

      const networkInfo = networkMap[n];

      if (networkInfo.evmChainId === chainId) {
        return networkInfo;
      }
    }

    return null;
  }

  // Parse transaction

  private parseSubStrateTransaction ({ data, networkKey }: RequestParseTransactionSubstrate): ResponseParseTransactionSubstrate {
    const apiProps = state.getDotSamaApi(networkKey);
    const apiPromise = apiProps.api;

    return parseSubstrateTransaction(data, apiPromise);
  }

  private async parseEVMRLP ({ data }: RequestQrParseRLP): Promise<ResponseQrParseRLP> {
    return await parseEvmRlp(data, state.getNetworkMap());
  }

  // Sign

  private qrSignSubstrate ({ address, data, networkKey, password, savePass }: RequestQrSignSubstrate): ResponseQrSignSubstrate {
    const pair = keyring.getPair(address);

    assert(pair, 'Unable to find pair');

    if (pair.isLocked && !password) {
      throw new Error('Password needed to unlock the account');
    }

    if (pair.isLocked) {
      try {
        pair.decodePkcs8(password);
      } catch (e) {
        throw new Error('invalid password');
      }
    }

    let signed = hexStripPrefix(u8aToHex(pair.sign(data, { withType: true })));
    const network = state.getNetworkMapByKey(networkKey);

    if (network.isEthereum) {
      signed = signed.substring(2);
    }

    const _address = pair.address;

    if (savePass) {
      this.cachedUnlocks[_address] = Date.now() + PASSWORD_EXPIRY_MS;
    } else {
      pair.lock();
    }

    return {
      signature: signed
    };
  }

  private async qrSignEVM ({ address, chainId, message, password, type }: RequestQrSignEVM): Promise<ResponseQrSignEVM> {
    let parsedPrivateKey = '';
    let signed: Web3SignedTransaction;
    const { privateKey } = this.accountExportPrivateKey({ address: address, password });

    parsedPrivateKey = privateKey.slice(2);
    const network: NetworkJson | null = this.getNetworkJsonByChainId(chainId);

    if (!network) {
      throw new Error('Cannot find network');
    }

    let web3: Web3 | null;
    let exists = false;

    const web3Api = state.getWeb3ApiMap();

    if (web3Api[network.key]) {
      web3 = web3Api[network.key];
      exists = true;
    } else {
      const currentProvider = getCurrentProvider(network);

      if (!currentProvider) {
        throw new Error('Not found current provider');
      }

      web3 = initWeb3Api(currentProvider);
    }

    if (type === 'message') {
      let data = message;

      if (isHex(message)) {
        data = message;
      } else if (isAscii(message)) {
        data = `0x${message}`;
      }

      signed = web3.eth.accounts.sign(data, parsedPrivateKey);
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

      signed = await web3.eth.accounts.signTransaction(txObject, parsedPrivateKey);
    }

    if (!exists && web3.currentProvider instanceof Web3.providers.WebsocketProvider) {
      web3.currentProvider.disconnect();
      web3.setProvider(null);
      web3 = null;
    }

    return {
      signature: signatureToHex(signed)
    };
  }

  private async getChainBondingBasics (id: string, port: chrome.runtime.Port, networkJsons: NetworkJson[]) {
    const result: Record<string, ChainBondingBasics> = {};
    const callback = createSubscription<'pri(bonding.getChainBondingBasics)'>(id, port);

    await Promise.all(networkJsons.map(async (networkJson) => {
      result[networkJson.key] = await getChainBondingBasics(networkJson.key, state.getDotSamaApi(networkJson.key));
      callback(result);
    }));

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return result;
  }

  private async getBondingOption ({ address, networkKey }: BondingOptionParams): Promise<BondingOptionInfo> {
    const apiProps = state.getDotSamaApi(networkKey);
    const networkJson = state.getNetworkMapByKey(networkKey);
    let extraCollatorAddress;

    if (CHAIN_TYPES.amplitude.includes(networkKey)) {
      const extraDelegationInfo = await state.getExtraDelegationInfo(networkKey, address);

      if (extraDelegationInfo) {
        extraCollatorAddress = extraDelegationInfo.collatorAddress;
      }
    }

    const { bondedValidators,
      era,
      isBondedBefore,
      maxNominations,
      maxNominatorPerValidator,
      validatorsInfo } = await getValidatorsInfo(networkKey, apiProps, networkJson.decimals as number, address, extraCollatorAddress);

    return {
      maxNominatorPerValidator,
      era,
      validators: validatorsInfo,
      isBondedBefore,
      bondedValidators,
      maxNominations
    } as BondingOptionInfo;
  }

  private async getBondingTxInfo ({ amount,
    bondedValidators,
    isBondedBefore,
    networkKey,
    nominatorAddress,
    validatorInfo }: BondingSubmitParams): Promise<BasicTxInfo> {
    const networkJson = state.getNetworkMapByKey(networkKey);

    return await getBondingTxInfo(networkJson, amount, bondedValidators, isBondedBefore, networkKey, nominatorAddress, validatorInfo, state.getDotSamaApiMap(), state.getWeb3ApiMap());
  }

  private async submitBonding (id: string, port: chrome.runtime.Port, { amount,
    bondedValidators,
    isBondedBefore,
    networkKey,
    nominatorAddress,
    password,
    validatorInfo }: RequestBondingSubmit): Promise<BasicTxResponse> {
    const txState: BasicTxResponse = {};

    if (!amount || !nominatorAddress || !validatorInfo || !password) {
      txState.txError = true;

      return txState;
    }

    const networkJson = state.getNetworkMapByKey(networkKey);

    const callback = createSubscription<'pri(bonding.submitTransaction)'>(id, port);
    const dotSamaApi = state.getDotSamaApi(networkKey);
    const extrinsic = await getBondingExtrinsic(networkJson, networkKey, amount, bondedValidators, validatorInfo, isBondedBefore, nominatorAddress, dotSamaApi);

    await signAndSendExtrinsic({
      type: SignerType.PASSWORD,
      callback: callback,
      apiProps: dotSamaApi,
      address: nominatorAddress,
      txState: txState,
      extrinsic: extrinsic,
      errorMessage: 'error bonding',
      password: password
    });

    return txState;
  }

  private async getUnbondingTxInfo ({ address,
    amount,
    networkKey,
    unstakeAll,
    validatorAddress }: UnbondingSubmitParams): Promise<BasicTxInfo> {
    const networkJson = state.getNetworkMapByKey(networkKey);

    return await getUnbondingTxInfo(address, amount, networkKey, state.getDotSamaApiMap(), state.getWeb3ApiMap(), networkJson, validatorAddress, unstakeAll);
  }

  private async submitUnbonding (id: string, port: chrome.runtime.Port, { address,
    amount,
    networkKey,
    password,
    unstakeAll,
    validatorAddress }: RequestUnbondingSubmit): Promise<BasicTxResponse> {
    const txState: BasicTxResponse = {};

    if (!amount || !address || !password) {
      txState.txError = true;

      return txState;
    }

    if (CHAIN_TYPES.amplitude.includes(networkKey)) {
      state.setExtraDelegationInfo(networkKey, address, validatorAddress as string);
    }

    const callback = createSubscription<'pri(unbonding.submitTransaction)'>(id, port);
    const dotSamaApi = state.getDotSamaApi(networkKey);
    const networkJson = state.getNetworkMapByKey(networkKey);
    const extrinsic = await getUnbondingExtrinsic(address, amount, networkKey, networkJson, dotSamaApi, validatorAddress, unstakeAll);

    await signAndSendExtrinsic({
      type: SignerType.PASSWORD,
      callback: callback,
      apiProps: dotSamaApi,
      address: address,
      txState: txState,
      extrinsic: extrinsic,
      errorMessage: 'error unbonding',
      password: password
    });

    return txState;
  }

  private async getStakeWithdrawalTxInfo ({ action,
    address,
    networkKey,
    validatorAddress }: StakeWithdrawalParams): Promise<BasicTxInfo> {
    return await getWithdrawalTxInfo(address, networkKey, state.getNetworkMapByKey(networkKey), state.getDotSamaApiMap(), state.getWeb3ApiMap(), validatorAddress, action);
  }

  private async submitStakeWithdrawal (id: string, port: chrome.runtime.Port, { action,
    address,
    networkKey,
    password,
    validatorAddress }: RequestStakeWithdrawal): Promise<BasicTxResponse> {
    const txState: BasicTxResponse = {};

    if (!address || !password) {
      txState.txError = true;

      return txState;
    }

    const callback = createSubscription<'pri(unbonding.submitWithdrawal)'>(id, port);
    const dotSamaApi = state.getDotSamaApi(networkKey);
    const extrinsic = await getWithdrawalExtrinsic(dotSamaApi, networkKey, address, validatorAddress, action);

    await signAndSendExtrinsic({
      type: SignerType.PASSWORD,
      callback: callback,
      apiProps: dotSamaApi,
      address: address,
      txState: txState,
      extrinsic: extrinsic,
      errorMessage: 'error withdrawing',
      password: password
    });

    return txState;
  }

  private async getStakeClaimRewardTxInfo ({ address, networkKey, stakingType }: StakeClaimRewardParams): Promise<BasicTxInfo> {
    return await getClaimRewardTxInfo(address, networkKey, state.getNetworkMapByKey(networkKey), state.getDotSamaApiMap(), state.getWeb3ApiMap(), stakingType);
  }

  private async submitStakeClaimReward (id: string, port: chrome.runtime.Port, { address,
    networkKey,
    password,
    stakingType,
    validatorAddress }: RequestStakeClaimReward): Promise<BasicTxResponse> {
    const txState: BasicTxResponse = {};

    if (!address || !password) {
      txState.txError = true;

      return txState;
    }

    const callback = createSubscription<'pri(staking.submitClaimReward)'>(id, port);
    const dotSamaApi = state.getDotSamaApi(networkKey);
    const extrinsic = await getClaimRewardExtrinsic(dotSamaApi, networkKey, address, stakingType, validatorAddress);

    await signAndSendExtrinsic({
      type: SignerType.PASSWORD,
      callback: callback,
      apiProps: dotSamaApi,
      address: address,
      txState: txState,
      extrinsic: extrinsic,
      errorMessage: 'error claimReward',
      password: password
    });

    return txState;
  }

  private async getStakingDelegationInfo ({ address, networkKey }: StakeDelegationRequest): Promise<DelegationItem[]> {
    const dotSamaApi = state.getDotSamaApi(networkKey);

    return await getDelegationInfo(dotSamaApi, address, networkKey);
  }

  private subscribeStakeUnlockingInfo (id: string, port: chrome.runtime.Port): StakeUnlockingJson {
    const cb = createSubscription<'pri(unbonding.subscribeUnlockingInfo)'>(id, port);
    const unlockingInfoSubscription = state.subscribeStakeUnlockingInfo().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    this.createUnsubscriptionHandle(id, unlockingInfoSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return state.getStakeUnlockingInfo();
  }

  // EVM Transaction
  private async parseContractInput ({ chainId,
    contract,
    data }: RequestParseEVMContractInput): Promise<ResponseParseEVMContractInput> {
    const network = this.getNetworkJsonByChainId(chainId);

    return await parseContractInput(data, contract, network);
  }

  private async getTuringStakeCompoundTxInfo ({ accountMinimum, address, bondedAmount, collatorAddress, networkKey }: TuringStakeCompoundParams) {
    const networkJson = state.getNetworkMapByKey(networkKey);
    const parsedAccountMinimum = parseFloat(accountMinimum) * 10 ** (networkJson.decimals as number);

    return await handleTuringCompoundTxInfo(networkKey, networkJson, state.getDotSamaApiMap(), state.getWeb3ApiMap(), address, collatorAddress, parsedAccountMinimum.toString(), bondedAmount);
  }

  private async submitTuringStakeCompounding (id: string, port: chrome.runtime.Port, { accountMinimum, address, bondedAmount, collatorAddress, networkKey, password }: RequestTuringStakeCompound) {
    const txState: BasicTxResponse = {};

    if (!address || !password) {
      txState.txError = true;

      return txState;
    }

    const callback = createSubscription<'pri(staking.submitTuringCompound)'>(id, port);
    const dotSamaApi = state.getDotSamaApi(networkKey);
    const networkJson = state.getNetworkMapByKey(networkKey);
    const parsedAccountMinimum = parseFloat(accountMinimum) * 10 ** (networkJson.decimals as number);
    const extrinsic = await getTuringCompoundExtrinsic(dotSamaApi, address, collatorAddress, parsedAccountMinimum.toString(), bondedAmount);

    await signAndSendExtrinsic({
      type: SignerType.PASSWORD,
      callback: callback,
      apiProps: dotSamaApi,
      address: address,
      txState: txState,
      extrinsic: extrinsic,
      errorMessage: 'error compounding Turing stake',
      password: password
    });

    return txState;
  }

  private async checkTuringStakeCompounding ({ address, collatorAddress, networkKey }: CheckExistingTuringCompoundParams): Promise<ExistingTuringCompoundTask> {
    const dotSamaApi = state.getDotSamaApi(networkKey);
    const networkJson = state.getNetworkMapByKey(networkKey);

    const { accountMinimum, frequency, taskId } = await checkTuringStakeCompoundingTask(dotSamaApi, address, collatorAddress);

    const parsedAccountMinimum = accountMinimum / (10 ** (networkJson.decimals as number));

    return {
      exist: taskId !== '',
      taskId,
      accountMinimum: parsedAccountMinimum,
      frequency
    } as ExistingTuringCompoundTask;
  }

  private async getTuringCancelStakeCompoundTxInfo ({ address, networkKey, taskId }: TuringCancelStakeCompoundParams): Promise<BasicTxInfo> {
    const networkJson = state.getNetworkMapByKey(networkKey);

    return await handleTuringCancelCompoundTxInfo(state.getDotSamaApiMap(), state.getWeb3ApiMap(), taskId, address, networkKey, networkJson);
  }

  private async submitTuringCancelStakeCompound (id: string, port: chrome.runtime.Port, { address, networkKey, password, taskId }: RequestTuringCancelStakeCompound) {
    const txState: BasicTxResponse = {};

    if (!address || !password) {
      txState.txError = true;

      return txState;
    }

    const callback = createSubscription<'pri(staking.submitTuringCancelCompound)'>(id, port);
    const dotSamaApi = state.getDotSamaApi(networkKey);
    const extrinsic = await getTuringCancelCompoundingExtrinsic(dotSamaApi, taskId);

    await signAndSendExtrinsic({
      type: SignerType.PASSWORD,
      callback: callback,
      apiProps: dotSamaApi,
      address: address,
      txState: txState,
      extrinsic: extrinsic,
      errorMessage: 'error canceling Turing compounding task stake',
      password: password
    });

    return txState;
  }

  private async wasmNftGetTransaction ({ networkKey, params, recipientAddress, senderAddress }: NftTransactionRequest): Promise<SubstrateNftTransaction> {
    const contractAddress = params.contractAddress as string;
    const onChainOption = params.onChainOption as Record<string, string>;

    try {
      return await getPSP34Transaction(state.getWeb3ApiMap(), state.getDotSamaApiMap(), state.getNetworkMapByKey(networkKey), networkKey, contractAddress, senderAddress, recipientAddress, onChainOption);
    } catch (e) {
      console.error('Error getting WASM NFT transaction', e);

      return {
        error: true,
        balanceError: false
      };
    }
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
        return this.accountsGetAllWithCurrentAddress(id, port);
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
      case 'pri(settings.saveTheme)':
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
        return await this.subscribeStaking(id, port);
      case 'pri(stakingReward.getStakingReward)':
        return this.getStakingReward();
      case 'pri(stakingReward.getSubscription)':
        return this.subscribeStakingReward(id, port);
      case 'pri(transaction.history.add)':
        return this.updateTransactionHistory(request as RequestTransactionHistoryAdd, id, port);
      case 'pri(transaction.history.getSubscription)':
        return this.subscribeHistory(id, port);
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
      case 'pri(customTokenState.getSubscription)':
        return this.subscribeCustomTokenState(id, port);
      case 'pri(customTokenState.getCustomTokenState)':
        return this.getEvmTokenState();
      case 'pri(customTokenState.upsertCustomTokenState)':
        return this.upsertCustomToken(request as CustomToken);
      case 'pri(customTokenState.deleteMany)':
        return this.deleteCustomToken(request as DeleteCustomTokenParams[]);
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
      case 'pri(customTokenState.validateCustomToken)':
        return await this.validateCustomToken(request as ValidateCustomTokenRequest);
      case 'pri(networkMap.recoverDotSama)':
        return this.recoverDotSamaApi(request as string);
      case 'pri(networkMap.enableMany)':
        return this.enableNetworks(request as string[]);
      case 'pri(networkMap.disableMany)':
        return await this.disableNetworks(request as string[]);
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

      case 'pri(evmNft.getTransaction)':
        return this.evmNftGetTransaction(request as NftTransactionRequest);
      case 'pri(evmNft.submitTransaction)':
        return this.evmNftSubmitTransaction(id, port, request as RequestEvmNftSubmitTransaction);

      case 'pri(substrateNft.getTransaction)':
        return await this.substrateNftGetTransaction(request as NftTransactionRequest);
      case 'pri(substrateNft.submitTransaction)':
        return this.substrateNftSubmitTransaction(id, port, request as RequestSubstrateNftSubmitTransaction);

      /// Transfer
      case 'pri(accounts.checkTransfer)':
        return await this.checkTransfer(request as RequestCheckTransfer);
      case 'pri(accounts.transfer)':
        return await this.makeTransfer(id, port, request as RequestTransfer);
      case 'pri(accounts.checkCrossChainTransfer)':
        return await this.checkCrossChainTransfer(request as RequestCheckCrossChainTransfer);
      case 'pri(accounts.crossChainTransfer)':
        return await this.makeCrossChainTransfer(id, port, request as RequestCrossChainTransfer);

      /// Check account is Lock
      case 'pri(account.isLocked)':
        return this.accountIsLocked(request as RequestAccountIsLocked);

      /// Sign QR
      case 'pri(qr.transaction.parse.substrate)':
        return this.parseSubStrateTransaction(request as RequestParseTransactionSubstrate);
      case 'pri(qr.transaction.parse.evm)':
        return await this.parseEVMRLP(request as RequestQrParseRLP);
      case 'pri(qr.sign.substrate)':
        return this.qrSignSubstrate(request as RequestQrSignSubstrate);
      case 'pri(qr.sign.evm)':
        return await this.qrSignEVM(request as RequestQrSignEVM);

      /// External account qr
      case 'pri(accounts.transfer.qr.create)':
        return await this.makeTransferQR(id, port, request as RequestTransferExternal);
      case 'pri(accounts.cross.transfer.qr.create)':
        return await this.makeCrossChainTransferQr(id, port, request as RequestCrossChainTransferExternal);
      case 'pri(nft.transfer.qr.create.substrate)':
        return this.nftTransferCreateQrSubstrate(id, port, request as RequestNftTransferExternalSubstrate);
      case 'pri(nft.transfer.qr.create.evm)':
        return this.nftTransferCreateQrEvm(id, port, request as RequestNftTransferExternalEVM);
      case 'pri(stake.qr.create)':
        return this.stakeCreateQr(id, port, request as RequestStakeExternal);
      case 'pri(unStake.qr.create)':
        return this.unStakeCreateQr(id, port, request as RequestUnStakeExternal);
      case 'pri(withdrawStake.qr.create)':
        return this.withdrawStakeCreateQr(id, port, request as RequestWithdrawStakeExternal);
      case 'pri(claimReward.qr.create)':
        return this.claimRewardCreateQr(id, port, request as RequestClaimRewardExternal);
      case 'pri(createCompound.qr.create)':
        return this.createCompoundCreateQr(id, port, request as RequestCreateCompoundStakeExternal);
      case 'pri(cancelCompound.qr.create)':
        return this.cancelCompoundCreateQr(id, port, request as RequestCancelCompoundStakeExternal);

      /// External account ledger
      case 'pri(accounts.transfer.ledger.create)':
        return await this.makeTransferLedger(id, port, request as RequestTransferExternal);
      case 'pri(accounts.cross.transfer.ledger.create)':
        return await this.makeCrossChainTransferLedger(id, port, request as RequestCrossChainTransferExternal);
      case 'pri(nft.transfer.ledger.create.substrate)':
        return this.nftTransferCreateLedgerSubstrate(id, port, request as RequestNftTransferExternalSubstrate);
      case 'pri(stake.ledger.create)':
        return this.stakeCreateLedger(id, port, request as RequestStakeExternal);
      case 'pri(unStake.ledger.create)':
        return this.unStakeCreateLedger(id, port, request as RequestUnStakeExternal);
      case 'pri(withdrawStake.ledger.create)':
        return this.withdrawStakeCreateLedger(id, port, request as RequestWithdrawStakeExternal);
      case 'pri(claimReward.ledger.create)':
        return this.claimRewardCreateLedger(id, port, request as RequestClaimRewardExternal);
      case 'pri(createCompound.ledger.create)':
        return this.createCompoundCreateLedger(id, port, request as RequestCreateCompoundStakeExternal);
      case 'pri(cancelCompound.ledger.create)':
        return this.cancelCompoundCreateLedger(id, port, request as RequestCancelCompoundStakeExternal);

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
        return this.completeConfirmation(request as RequestConfirmationComplete);

      /// Stake
      case 'pri(bonding.getBondingOptions)':
        return await this.getBondingOption(request as BondingOptionParams);
      case 'pri(bonding.getChainBondingBasics)':
        return await this.getChainBondingBasics(id, port, request as NetworkJson[]);
      case 'pri(bonding.submitTransaction)':
        return await this.submitBonding(id, port, request as RequestBondingSubmit);
      case 'pri(bonding.txInfo)':
        return await this.getBondingTxInfo(request as BondingSubmitParams);
      case 'pri(unbonding.txInfo)':
        return await this.getUnbondingTxInfo(request as UnbondingSubmitParams);
      case 'pri(unbonding.submitTransaction)':
        return await this.submitUnbonding(id, port, request as RequestUnbondingSubmit);
      case 'pri(unbonding.subscribeUnlockingInfo)':
        return this.subscribeStakeUnlockingInfo(id, port);
      case 'pri(unbonding.withdrawalTxInfo)':
        return await this.getStakeWithdrawalTxInfo(request as StakeWithdrawalParams);
      case 'pri(unbonding.submitWithdrawal)':
        return await this.submitStakeWithdrawal(id, port, request as RequestStakeWithdrawal);
      case 'pri(staking.claimRewardTxInfo)':
        return await this.getStakeClaimRewardTxInfo(request as StakeClaimRewardParams);
      case 'pri(staking.submitClaimReward)':
        return await this.submitStakeClaimReward(id, port, request as RequestStakeClaimReward);
      case 'pri(staking.delegationInfo)':
        return await this.getStakingDelegationInfo(request as StakeDelegationRequest);
      case 'pri(staking.turingCompound)':
        return await this.getTuringStakeCompoundTxInfo(request as TuringStakeCompoundParams);
      case 'pri(staking.submitTuringCompound)':
        return await this.submitTuringStakeCompounding(id, port, request as RequestTuringStakeCompound);
      case 'pri(staking.checkTuringCompoundTask)':
        return await this.checkTuringStakeCompounding(request as CheckExistingTuringCompoundParams);
      case 'pri(staking.turingCancelCompound)':
        return await this.getTuringCancelStakeCompoundTxInfo(request as TuringCancelStakeCompoundParams);
      case 'pri(staking.submitTuringCancelCompound)':
        return await this.submitTuringCancelStakeCompound(id, port, request as RequestTuringCancelStakeCompound);

      // EVM Transaction
      case 'pri(evm.transaction.parse.input)':
        return await this.parseContractInput(request as RequestParseEVMContractInput);

      // Auth Url subscribe
      case 'pri(authorize.subscribe)':
        return await this.subscribeAuthUrls(id, port);
      case 'pri(wasmNft.getTransaction)':
        return await this.wasmNftGetTransaction(request as NftTransactionRequest);
      // Default
      default:
        return super.handle(id, type, request, port);
    }
  }
}
