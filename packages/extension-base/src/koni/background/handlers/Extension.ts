// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Common } from '@ethereumjs/common';
import { LegacyTransaction } from '@ethereumjs/tx';
import { _AssetRef, _ChainAsset, _ChainInfo, _MultiChainAsset } from '@subwallet/chain-list/types';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { withErrorLog } from '@subwallet/extension-base/background/handlers/helpers';
import { createSubscription } from '@subwallet/extension-base/background/handlers/subscriptions';
import { AccountExternalError, AccountExternalErrorCode, AccountsWithCurrentAddress, AddressBookInfo, AmountData, AmountDataWithId, AssetSetting, AssetSettingUpdateReq, BasicTxErrorType, BondingOptionParams, BrowserConfirmationType, CampaignBanner, CampaignData, CampaignDataType, ChainType, CreateDeriveAccountInfo, CronReloadRequest, CrowdloanJson, CurrentAccountInfo, DeriveAccountInfo, ExternalRequestPromiseStatus, ExtrinsicType, KeyringState, MantaPayEnableMessage, MantaPayEnableParams, MantaPayEnableResponse, MantaPaySyncState, MetadataItem, NftCollection, NftJson, NftTransactionRequest, NftTransactionResponse, OptionInputAddress, PriceJson, RequestAccountBatchExportV2, RequestAccountCreateExternalV2, RequestAccountCreateHardwareMultiple, RequestAccountCreateHardwareV2, RequestAccountCreateSuriV2, RequestAccountCreateWithSecretKey, RequestAccountExportPrivateKey, RequestAccountMeta, RequestAddInjectedAccounts, RequestApproveConnectWalletSession, RequestApproveWalletConnectNotSupport, RequestAuthorization, RequestAuthorizationBlock, RequestAuthorizationPerAccount, RequestAuthorizationPerSite, RequestAuthorizeApproveV2, RequestBatchRestoreV2, RequestBondingSubmit, RequestCameraSettings, RequestCampaignBannerComplete, RequestChangeEnableChainPatrol, RequestChangeLanguage, RequestChangeMasterPassword, RequestChangePriceCurrency, RequestChangeShowBalance, RequestChangeShowZeroBalance, RequestChangeTimeAutoLock, RequestCheckPublicAndSecretKey, RequestConfirmationComplete, RequestConnectWalletConnect, RequestCrossChainTransfer, RequestCrowdloanContributions, RequestDeleteContactAccount, RequestDeriveCreateMultiple, RequestDeriveCreateV2, RequestDeriveCreateV3, RequestDeriveValidateV2, RequestDisconnectWalletConnectSession, RequestEditContactAccount, RequestFindRawMetadata, RequestForgetSite, RequestFreeBalance, RequestGetDeriveAccounts, RequestGetTransaction, RequestJsonRestoreV2, RequestKeyringExportMnemonic, RequestMaxTransferable, RequestMigratePassword, RequestParseEvmContractInput, RequestParseTransactionSubstrate, RequestPassPhishingPage, RequestQrParseRLP, RequestQrSignEvm, RequestQrSignSubstrate, RequestRejectConnectWalletSession, RequestRejectExternalRequest, RequestRejectWalletConnectNotSupport, RequestRemoveInjectedAccounts, RequestResetWallet, RequestResolveExternalRequest, RequestSaveRecentAccount, RequestSeedCreateV2, RequestSeedValidateV2, RequestSettingsType, RequestSigningApprovePasswordV2, RequestStakePoolingBonding, RequestStakePoolingUnbonding, RequestSubscribeHistory, RequestSubstrateNftSubmitTransaction, RequestTransfer, RequestTuringCancelStakeCompound, RequestTuringStakeCompound, RequestUnbondingSubmit, RequestUnlockKeyring, RequestUnlockType, ResolveAddressToDomainRequest, ResolveDomainRequest, ResponseAccountBatchExportV2, ResponseAccountCreateSuriV2, ResponseAccountCreateWithSecretKey, ResponseAccountExportPrivateKey, ResponseAccountMeta, ResponseChangeMasterPassword, ResponseCheckPublicAndSecretKey, ResponseDeriveValidateV2, ResponseFindRawMetadata, ResponseGetDeriveAccounts, ResponseKeyringExportMnemonic, ResponseMigratePassword, ResponseParseEvmContractInput, ResponseParseTransactionSubstrate, ResponsePrivateKeyValidateV2, ResponseQrParseRLP, ResponseQrSignEvm, ResponseQrSignSubstrate, ResponseRejectExternalRequest, ResponseResetWallet, ResponseResolveExternalRequest, ResponseSeedCreateV2, ResponseSeedValidateV2, ResponseSubscribeHistory, ResponseUnlockKeyring, ShowCampaignPopupRequest, StakingJson, StakingRewardJson, StakingTxErrorType, StakingType, ThemeNames, TransactionHistoryItem, TransactionResponse, ValidateNetworkRequest, ValidateNetworkResponse, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { AccountAuthType, AccountJson, AuthorizeRequest, MessageTypes, MetadataRequest, RequestAccountChangePassword, RequestAccountCreateExternal, RequestAccountCreateHardware, RequestAccountCreateSuri, RequestAccountEdit, RequestAccountExport, RequestAccountForget, RequestAccountShow, RequestAccountTie, RequestAccountValidate, RequestAuthorizeCancel, RequestAuthorizeReject, RequestBatchRestore, RequestCurrentAccountAddress, RequestDeriveCreate, RequestDeriveValidate, RequestJsonRestore, RequestMetadataApprove, RequestMetadataReject, RequestSeedCreate, RequestSeedValidate, RequestSigningApproveSignature, RequestSigningCancel, RequestTypes, ResponseAccountExport, ResponseAuthorizeList, ResponseDeriveValidate, ResponseJsonGetAccountInfo, ResponseSeedCreate, ResponseSeedValidate, ResponseType, SigningRequest, WindowOpenParams } from '@subwallet/extension-base/background/types';
import { TransactionWarning } from '@subwallet/extension-base/background/warnings/TransactionWarning';
import { ALL_ACCOUNT_KEY, ALL_GENESIS_HASH, LATEST_SESSION, XCM_FEE_RATIO } from '@subwallet/extension-base/constants';
import { additionalValidateTransfer, additionalValidateXcmTransfer, validateTransferRequest, validateXcmTransferRequest } from '@subwallet/extension-base/core/logic-validation/transfer';
import { _isSnowBridgeXcm } from '@subwallet/extension-base/core/substrate/xcm-parser';
import { ALLOWED_PATH } from '@subwallet/extension-base/defaults';
import { getERC20SpendingApprovalTx } from '@subwallet/extension-base/koni/api/contract-handler/evm/web3';
import { isSnowBridgeGatewayContract } from '@subwallet/extension-base/koni/api/contract-handler/utils';
import { resolveAzeroAddressToDomain, resolveAzeroDomainToAddress } from '@subwallet/extension-base/koni/api/dotsama/domain';
import { parseSubstrateTransaction } from '@subwallet/extension-base/koni/api/dotsama/parseTransaction';
import { UNSUPPORTED_TRANSFER_EVM_CHAIN_NAME } from '@subwallet/extension-base/koni/api/nft/config';
import { getNftTransferExtrinsic, isRecipientSelf } from '@subwallet/extension-base/koni/api/nft/transfer';
import { getBondingExtrinsic, getCancelWithdrawalExtrinsic, getClaimRewardExtrinsic, getNominationPoolsInfo, getUnbondingExtrinsic, getValidatorsInfo, validateBondingCondition, validateUnbondingCondition } from '@subwallet/extension-base/koni/api/staking/bonding';
import { getTuringCancelCompoundingExtrinsic, getTuringCompoundExtrinsic } from '@subwallet/extension-base/koni/api/staking/bonding/paraChain';
import { getPoolingBondingExtrinsic, getPoolingUnbondingExtrinsic, validatePoolBondingCondition, validateRelayUnbondingCondition } from '@subwallet/extension-base/koni/api/staking/bonding/relayChain';
import { YIELD_EXTRINSIC_TYPES } from '@subwallet/extension-base/koni/api/yield/helper/utils';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { RequestOptimalTransferProcess } from '@subwallet/extension-base/services/balance-service/helpers/process';
import { getERC20TransactionObject, getERC721Transaction, getEVMTransactionObject, getPSP34TransferExtrinsic } from '@subwallet/extension-base/services/balance-service/transfer/smart-contract';
import { createTransferExtrinsic, getTransferMockTxFee } from '@subwallet/extension-base/services/balance-service/transfer/token';
import { createSnowBridgeExtrinsic, createXcmExtrinsic, getXcmMockTxFee } from '@subwallet/extension-base/services/balance-service/transfer/xcm';
import { _API_OPTIONS_CHAIN_GROUP, _DEFAULT_MANTA_ZK_CHAIN, _MANTA_ZK_CHAIN_GROUP, _ZK_ASSET_PREFIX } from '@subwallet/extension-base/services/chain-service/constants';
import { _ChainApiStatus, _ChainConnectionStatus, _ChainState, _NetworkUpsertParams, _ValidateCustomAssetRequest, _ValidateCustomAssetResponse, EnableChainParams, EnableMultiChainParams } from '@subwallet/extension-base/services/chain-service/types';
import { _getAssetDecimals, _getAssetSymbol, _getChainNativeTokenBasicInfo, _getContractAddressOfToken, _getEvmChainId, _getSubstrateGenesisHash, _isAssetSmartContractNft, _isChainEvmCompatible, _isCustomAsset, _isLocalToken, _isMantaZkAsset, _isNativeToken, _isPureEvmChain, _isTokenEvmSmartContract, _isTokenTransferredByEvm } from '@subwallet/extension-base/services/chain-service/utils';
import { AppBannerData, AppConfirmationData, AppPopupData } from '@subwallet/extension-base/services/mkt-campaign-service/types';
import { EXTENSION_REQUEST_URL } from '@subwallet/extension-base/services/request-service/constants';
import { AuthUrls } from '@subwallet/extension-base/services/request-service/types';
import { DEFAULT_AUTO_LOCK_TIME } from '@subwallet/extension-base/services/setting-service/constants';
import { SWTransaction, SWTransactionResponse, SWTransactionResult, TransactionEmitter, ValidateTransactionResponseInput } from '@subwallet/extension-base/services/transaction-service/types';
import { WALLET_CONNECT_EIP155_NAMESPACE } from '@subwallet/extension-base/services/wallet-connect-service/constants';
import { isProposalExpired, isSupportWalletConnectChain, isSupportWalletConnectNamespace } from '@subwallet/extension-base/services/wallet-connect-service/helpers';
import { ResultApproveWalletConnectSession, WalletConnectNotSupportRequest, WalletConnectSessionRequest } from '@subwallet/extension-base/services/wallet-connect-service/types';
import { SWStorage } from '@subwallet/extension-base/storage';
import { AccountsStore } from '@subwallet/extension-base/stores';
import { BalanceJson, BuyServiceInfo, BuyTokenInfo, EarningRewardJson, NominationPoolInfo, OptimalYieldPathParams, RequestEarlyValidateYield, RequestGetYieldPoolTargets, RequestMetadataHash, RequestShortenMetadata, RequestStakeCancelWithdrawal, RequestStakeClaimReward, RequestUnlockDotCheckCanMint, RequestUnlockDotSubscribeMintedData, RequestYieldLeave, RequestYieldStepSubmit, RequestYieldWithdrawal, ResponseGetYieldPoolTargets, ResponseMetadataHash, ResponseShortenMetadata, StorageDataInterface, TokenSpendingApprovalParams, ValidateYieldProcessParams, YieldPoolType } from '@subwallet/extension-base/types';
import { CommonOptimalPath } from '@subwallet/extension-base/types/service-base';
import { SwapPair, SwapQuoteResponse, SwapRequest, SwapRequestResult, SwapSubmitParams, ValidateSwapProcessParams } from '@subwallet/extension-base/types/swap';
import { BN_ZERO, convertSubjectInfoToAddresses, createTransactionFromRLP, isSameAddress, MODULE_SUPPORT, reformatAddress, signatureToHex, Transaction as QrTransaction, uniqueStringArray } from '@subwallet/extension-base/utils';
import { parseContractInput, parseEvmRlp } from '@subwallet/extension-base/utils/eth/parseTransaction';
import { metadataExpand } from '@subwallet/extension-chains';
import { MetadataDef } from '@subwallet/extension-inject/types';
import { createPair } from '@subwallet/keyring';
import { KeyringPair, KeyringPair$Json, KeyringPair$Meta } from '@subwallet/keyring/types';
import { keyring } from '@subwallet/ui-keyring';
import { SubjectInfo } from '@subwallet/ui-keyring/observable/types';
import { KeyringAddress, KeyringJson$Meta } from '@subwallet/ui-keyring/types';
import { ProposalTypes } from '@walletconnect/types/dist/types/sign-client/proposal';
import { SessionTypes } from '@walletconnect/types/dist/types/sign-client/session';
import { getSdkError } from '@walletconnect/utils';
import BigN from 'bignumber.js';
import { t } from 'i18next';
import { Subject } from 'rxjs';
import { TransactionConfig } from 'web3-core';

import { SubmittableExtrinsic } from '@polkadot/api/types';
import { Metadata, TypeRegistry } from '@polkadot/types';
import { ChainProperties } from '@polkadot/types/interfaces';
import { Registry, SignerPayloadJSON, SignerPayloadRaw } from '@polkadot/types/types';
import { assert, hexStripPrefix, hexToU8a, isAscii, isHex, u8aToHex, u8aToString } from '@polkadot/util';
import { base64Decode, decodeAddress, isAddress, isEthereumAddress, jsonDecrypt, keyExtractSuri, mnemonicGenerate, mnemonicValidate } from '@polkadot/util-crypto';
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

export const SEED_DEFAULT_LENGTH = 12;
export const SEED_LENGTHS = [12, 15, 18, 21, 24];

export function isJsonPayload (value: SignerPayloadJSON | SignerPayloadRaw): value is SignerPayloadJSON {
  return (value as SignerPayloadJSON).genesisHash !== undefined;
}

export default class KoniExtension {
  #lockTimeOut: NodeJS.Timer | undefined = undefined;
  readonly #koniState: KoniState;
  #timeAutoLock: number = DEFAULT_AUTO_LOCK_TIME;
  #skipAutoLock = false;
  #firstTime = true;
  #alwaysLock = false;
  #keyringLockSubject = new Subject<boolean>();

  constructor (state: KoniState) {
    this.#koniState = state;

    const updateTimeAutoLock = (rs: RequestSettingsType) => {
      // Check time auto lock change
      if (this.#timeAutoLock !== rs.timeAutoLock) {
        this.#timeAutoLock = rs.timeAutoLock;
        this.#alwaysLock = !rs.timeAutoLock;
        clearTimeout(this.#lockTimeOut);

        if (this.#timeAutoLock > 0) {
          this.#lockTimeOut = setTimeout(() => {
            if (!this.#skipAutoLock) {
              this.keyringLock();
              updateLatestSession(Date.now());
            }
          }, this.#timeAutoLock * 60 * 1000);
        } else if (this.#alwaysLock) {
          if (!this.#firstTime) {
            this.keyringLock();
            updateLatestSession(Date.now());
          }
        }
      }

      if (this.#firstTime) {
        this.#firstTime = false;
      }
    };

    const updateLatestSession = (time: number) => {
      SWStorage.instance.setItem(LATEST_SESSION, JSON.stringify({ remind: true, timeCalculate: time })).catch(console.error);
    };

    this.#koniState.settingService.getSettings(updateTimeAutoLock);
    this.#koniState.settingService.getSubject().subscribe({
      next: updateTimeAutoLock
    });
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

    assert(pair, t('Unable to find account'));

    try {
      if (!pair.isLocked) {
        pair.lock();
      }

      pair.decodePkcs8(oldPass);
    } catch (error) {
      throw new Error(t('Wrong password'));
    }

    keyring.encryptAccount(pair, newPass);

    return true;
  }

  private accountsEdit ({ address, name }: RequestAccountEdit): boolean {
    const pair = keyring.getPair(address);

    assert(pair, t('Unable to find account'));

    keyring.saveAccountMeta(pair, { ...pair.meta, name });

    return true;
  }

  private accountsExport ({ address, password }: RequestAccountExport): ResponseAccountExport {
    return { exportedJson: keyring.backupAccount(keyring.getPair(address), password) };
  }

  private accountsShow ({ address, isShowing }: RequestAccountShow): boolean {
    const pair = keyring.getPair(address);

    assert(pair, t('Unable to find account'));

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
    const accountSubject = this.#koniState.keyringService.accountSubject;
    const subscription = accountSubject.subscribe((accounts: SubjectInfo): void =>
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

    assert(queued, t('Unable to proceed. Please try again'));

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

    assert(queued, t('Unable to proceed. Please try again'));

    const { reject } = queued;

    reject(new Error('Rejected'));

    return true;
  }

  private metadataSubscribe (id: string, port: chrome.runtime.Port): MetadataRequest[] {
    const cb = createSubscription<'pri(metadata.requests)'>(id, port);
    const subscription = this.#koniState.metaSubject.subscribe((requests: MetadataRequest[]): void =>
      cb(requests)
    );

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
      subscription.unsubscribe();
    });

    return this.#koniState.metaSubject.value;
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
      assert(isHex(phrase, 256), t('Invalid seed phrase. Please try again.'));
    } else {
      // sadly isHex detects as string, so we need a cast here
      assert(SEED_LENGTHS.includes((phrase).split(' ').length), t('Seed phrase needs to contain {{x}} words', { replace: { x: SEED_LENGTHS.join(', ') } }));
      assert(mnemonicValidate(phrase), t('Invalid seed phrase. Please try again.'));
    }

    return {
      address: keyring.createFromUri(getSuri(suri, type), {}, type).address,
      suri
    };
  }

  // TODO: move to request service
  private signingApproveSignature ({ id, signature, signedTransaction }: RequestSigningApproveSignature): boolean {
    const queued = this.#koniState.getSignRequest(id);

    assert(queued, t('Unable to proceed. Please try again'));

    const { resolve } = queued;

    resolve({ id, signature, signedTransaction });

    return true;
  }

  // TODO: move to request service
  private signingCancel ({ id }: RequestSigningCancel): boolean {
    const queued = this.#koniState.getSignRequest(id);

    assert(queued, t('Unable to proceed. Please try again'));

    const { reject } = queued;

    reject(new TransactionError(BasicTxErrorType.USER_REJECT_REQUEST));

    return true;
  }

  // FIXME This looks very much like what we have in authorization
  private signingSubscribe (id: string, port: chrome.runtime.Port): SigningRequest[] {
    const cb = createSubscription<'pri(signing.requests)'>(id, port);
    const subscription = this.#koniState.signSubject.subscribe((requests: SigningRequest[]): void =>
      cb(requests)
    );

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
      subscription.unsubscribe();
    });

    return this.#koniState.signSubject.value;
  }

  private windowOpen ({ allowedPath: path, params, subPath }: WindowOpenParams): boolean {
    let paramString = '';

    if (params) {
      paramString += '?';

      for (let i = 0; i < Object.keys(params).length; i++) {
        const [key, value] = Object.entries(params)[i];

        paramString += `${key}=${value}`;

        if (i !== Object.keys(params).length - 1) {
          paramString += '&';
        }
      }
    }

    const url = `${chrome.runtime.getURL('index.html')}#${path}${subPath || ''}${paramString}`;

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
      throw new Error(t('Wrong password'));
    }

    try {
      return parentPair.derive(suri, metadata);
    } catch (err) {
      throw new Error(t('"{{suri}}" is not a valid derivation path', { replace: { suri } }));
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
    const keyringService = this.#koniState.keyringService;

    await this.#koniState.eventService.waitAccountReady;
    await this.#koniState.eventService.waitInjectReady;

    const currentAccount = keyringService.currentAccount;
    const transformedAccounts = transformAccounts(keyringService.accounts);
    const responseData: AccountsWithCurrentAddress = {
      accounts: transformedAccounts?.length ? [{ ...ACCOUNT_ALL_JSON }, ...transformedAccounts] : [],
      currentAddress: currentAccount?.address,
      currentGenesisHash: currentAccount?.currentGenesisHash
    };

    const subscriptionAccounts = keyringService.accountSubject.subscribe((storedAccounts: SubjectInfo): void => {
      const transformedAccounts = transformAccounts(storedAccounts);

      responseData.accounts = transformedAccounts?.length ? [{ ...ACCOUNT_ALL_JSON }, ...transformedAccounts] : [];

      cb(responseData);
    });

    const subscriptionCurrentAccount = keyringService.currentAccountSubject.subscribe((currentAccountData) => {
      responseData.currentAddress = currentAccountData.address;
      responseData.currentGenesisHash = currentAccountData.currentGenesisHash;

      cb(responseData);
    });

    this.createUnsubscriptionHandle(id, () => {
      subscriptionAccounts.unsubscribe();
      subscriptionCurrentAccount.unsubscribe();
    });

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return responseData;
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

  private subscribeAddresses (id: string, port: chrome.runtime.Port): AddressBookInfo {
    const _cb = createSubscription<'pri(accounts.subscribeAddresses)'>(id, port);
    let old = '';

    const subscription = this.#koniState.keyringService.addressesSubject.subscribe((subjectInfo: SubjectInfo): void => {
      const addresses = convertSubjectInfoToAddresses(subjectInfo);
      const _new = JSON.stringify(addresses);

      if (old !== _new) {
        _cb({
          addresses: addresses
        });

        old = _new;
      }
    });

    this.createUnsubscriptionHandle(id, subscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    const subjectInfo = this.#koniState.keyringService.addresses;

    return {
      addresses: convertSubjectInfoToAddresses(subjectInfo)
    };
  }

  private saveRecentAccount ({ accountId, chain }: RequestSaveRecentAccount): KeyringAddress {
    if (isAddress((accountId))) {
      const address = reformatAddress(accountId);
      const account = keyring.getAccount(address);
      const contact = keyring.getAddress(address, 'address');

      if (account) {
        return account;
      } else {
        let metadata: KeyringJson$Meta;

        if (contact) {
          metadata = contact.meta;
        } else {
          const _new = keyring.saveRecent(address);

          metadata = _new.json.meta;
        }

        if (contact && !metadata.isRecent) {
          return contact;
        }

        const recentChainSlugs: string[] = (metadata.recentChainSlugs as string[]) || [];

        if (chain) {
          if (!recentChainSlugs.includes(chain)) {
            recentChainSlugs.push(chain);
          }
        }

        metadata.recentChainSlugs = recentChainSlugs;

        const result = keyring.addresses.add(new AccountsStore(), address, { address: address, meta: metadata });

        return { ...result.json, publicKey: decodeAddress(address) };
      }
    } else {
      throw Error(t('This is not an address'));
    }
  }

  private editContactAccount ({ address, meta }: RequestEditContactAccount): boolean {
    if (isAddress((address))) {
      const _address = reformatAddress(address);

      keyring.saveAddress(_address, meta);

      return true;
    } else {
      throw Error(t('This is not an address'));
    }
  }

  private deleteContactAccount ({ address }: RequestDeleteContactAccount): boolean {
    if (isAddress((address))) {
      const _address = reformatAddress(address);

      keyring.forgetAddress(_address);

      return true;
    } else {
      throw Error(t('This is not an address'));
    }
  }

  private _getAuthListV2 (): Promise<AuthUrls> {
    const keyringService = this.#koniState.keyringService;

    return new Promise<AuthUrls>((resolve, reject) => {
      this.#koniState.getAuthorize((rs: AuthUrls) => {
        const addressList = Object.keys(keyringService.accounts);
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

  private authorizeSubscribeV2 (id: string, port: chrome.runtime.Port): AuthorizeRequest[] {
    const cb = createSubscription<'pri(authorize.requestsV2)'>(id, port);
    const subscription = this.#koniState.authSubjectV2.subscribe((requests: AuthorizeRequest[]): void =>
      cb(requests)
    );

    this.createUnsubscriptionHandle(id, subscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.#koniState.authSubjectV2.value;
  }

  private async getAuthListV2 (): Promise<ResponseAuthorizeList> {
    const authList = await this._getAuthListV2();

    return { list: authList };
  }

  private authorizeApproveV2 ({ accounts, id }: RequestAuthorizeApproveV2): boolean {
    const queued = this.#koniState.getAuthRequestV2(id);

    assert(queued, t('Unable to proceed. Please try again'));

    const { resolve } = queued;

    resolve({ accounts, result: true });

    return true;
  }

  private authorizeRejectV2 ({ id }: RequestAuthorizeReject): boolean {
    const queued = this.#koniState.getAuthRequestV2(id);

    assert(queued, t('Unable to proceed. Please try again'));

    const { reject } = queued;

    reject(new Error('Rejected'));

    return true;
  }

  private authorizeCancelV2 ({ id }: RequestAuthorizeCancel): boolean {
    const queued = this.#koniState.getAuthRequestV2(id);

    assert(queued, t('Unable to proceed. Please try again'));

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

  private getAccounts (): string[] {
    const storedAccounts = this.#koniState.keyringService.accounts;
    const transformedAccounts = transformAccounts(storedAccounts);

    return transformedAccounts.map((a) => a.address);
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

      const accounts = this.getAccounts();

      Object.keys(value).forEach((url) => {
        if (!value[url].isAllowed) {
          return;
        }

        const targetAccounts = this.filterAccountsByAccountAuthType(accounts, value[url].accountAuthType);

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

      const accounts = this.getAccounts();
      const targetAccounts = this.filterAccountsByAccountAuthType(accounts, value[url].accountAuthType);

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

      this.#koniState.setAuthorize(value);
    });
  }

  private _changeAuthorizationPerSite (values: Record<string, boolean>, id: string) {
    this.#koniState.getAuthorize((value) => {
      assert(value, 'The source is not known');

      value[id].isAllowedMap = values;

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

  private async toggleBalancesVisibility (): Promise<boolean> {
    return new Promise((resolve) => {
      this.#koniState.getSettings((value) => {
        const updateValue = {
          ...value,
          isShowBalance: !value.isShowBalance
        };

        this.#koniState.setSettings(updateValue, () => {
          resolve(!value.isShowBalance);
        });
      });
    });
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

  private saveTheme (data: ThemeNames) {
    this.#koniState.updateSetting('theme', data);

    return true;
  }

  private setCamera ({ camera }: RequestCameraSettings) {
    this.#koniState.updateSetting('camera', camera);

    return true;
  }

  private saveBrowserConfirmationType (data: BrowserConfirmationType) {
    this.#koniState.updateSetting('browserConfirmationType', data);

    return true;
  }

  private setAutoLockTime ({ autoLockTime }: RequestChangeTimeAutoLock) {
    this.#koniState.updateSetting('timeAutoLock', autoLockTime);

    return true;
  }

  private setUnlockType ({ unlockType }: RequestUnlockType) {
    this.#koniState.updateSetting('unlockType', unlockType);

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

  private setEnableChainPatrol ({ enable }: RequestChangeEnableChainPatrol) {
    this.#koniState.updateSetting('enableChainPatrol', enable);

    return true;
  }

  private setShowZeroBalance ({ show }: RequestChangeShowZeroBalance) {
    this.#koniState.updateSetting('isShowZeroBalance', show);

    return true;
  }

  private setLanguage ({ language }: RequestChangeLanguage) {
    this.#koniState.updateSetting('language', language);

    return true;
  }

  private setShowBalance ({ enable }: RequestChangeShowBalance) {
    this.#koniState.updateSetting('isShowBalance', enable);

    return true;
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
    let accountInfo = this.#koniState.keyringService.currentAccount;

    if (!accountInfo) {
      accountInfo = {
        address,
        currentGenesisHash: ALL_GENESIS_HASH,
        allGenesisHash: ALL_GENESIS_HASH || undefined
      };
    } else {
      accountInfo.address = address;

      if (address !== ALL_ACCOUNT_KEY) {
        try {
          const currentKeyPair = keyring.getPair(address);

          accountInfo.currentGenesisHash = currentKeyPair?.meta.genesisHash as string || ALL_GENESIS_HASH;
        } catch {
          accountInfo.currentGenesisHash = ALL_GENESIS_HASH;
        }
      } else {
        accountInfo.currentGenesisHash = accountInfo.allGenesisHash || ALL_GENESIS_HASH;
      }
    }

    this.#koniState.setCurrentAccount(accountInfo, () => {
      callback && callback(accountInfo);
    });
  }

  private updateCurrentAccountAddress (address: string): boolean {
    this._saveCurrentAccountAddress(address);

    return true;
  }

  private async saveCurrentAccountAddress (data: RequestCurrentAccountAddress): Promise<CurrentAccountInfo> {
    return new Promise<CurrentAccountInfo>((resolve) => {
      this._saveCurrentAccountAddress(data.address, (currentInfo) => {
        resolve(currentInfo);
      });
    });
  }

  private async getAssetSetting (): Promise<Record<string, AssetSetting>> {
    return this.#koniState.chainService.getAssetSettings();
  }

  private subscribeAssetSetting (id: string, port: chrome.runtime.Port): Promise<Record<string, AssetSetting>> {
    const cb = createSubscription<'pri(assetSetting.getSubscription)'>(id, port);

    const assetSettingSubscription = this.#koniState.chainService.subscribeAssetSettings().subscribe(cb);

    this.createUnsubscriptionHandle(id, assetSettingSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.getAssetSetting();
  }

  private async updateAssetSetting (params: AssetSettingUpdateReq) {
    try {
      await this.#koniState.chainService.updateAssetSetting(params.tokenSlug, params.assetSetting, params.autoEnableNativeToken);

      this.#koniState.eventService.emit('asset.updateState', params.tokenSlug);

      return true;
    } catch (e) {
      console.error(e);

      return false;
    }
  }

  private async getPrice (): Promise<PriceJson> {
    return this.#koniState.priceService.getPrice();
  }

  private async setPriceCurrency ({ currency }: RequestChangePriceCurrency): Promise<boolean> {
    return await this.#koniState.priceService.setPriceCurrency(currency);
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

  private async getBalance (reset?: boolean) {
    return this.#koniState.balanceService.getBalance(reset);
  }

  private async subscribeBalance (id: string, port: chrome.runtime.Port) {
    const cb = createSubscription<'pri(balance.getSubscription)'>(id, port);

    const balanceSubscription = this.#koniState.balanceService.subscribeBalanceMap().subscribe({
      next: (rs) => {
        const data = { details: rs } as BalanceJson;

        cb(data);
      }
    });

    this.createUnsubscriptionHandle(id, balanceSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return await this.getBalance(true);
  }

  private getCrowdloan (reset?: boolean): CrowdloanJson {
    return this.#koniState.getCrowdloan(reset);
  }

  private getCrowdloanContributions (request: RequestCrowdloanContributions) {
    return this.#koniState.getCrowdloanContributions(request);
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
            if (this.isAddressValidWithAuthType(address, value[url].accountAuthType)) {
              value[url].isAllowedMap[address] = isAllowed;
            }
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
        throw Error(t('The password of each account is needed to set up master password'));
      } else {
        keyring.changeMasterPassword(password);
        this.#koniState.updateKeyringState();
      }
    }

    const currentAccount = this.#koniState.keyringService.currentAccount;
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
          }, undefined, true);
        }

        changedAccount = true;
      }
    });

    await new Promise<void>((resolve) => {
      this.#koniState.addAccountRef(Object.values(addressDict), () => {
        resolve();
      });
    });

    if (this.#alwaysLock) {
      this.keyringLock();
    }

    return addressDict;
  }

  private async accountsForgetOverride ({ address, lockAfter }: RequestAccountForget): Promise<boolean> {
    keyring.forgetAccount(address);
    await new Promise<void>((resolve) => {
      this.#koniState.removeAccountRef(address, () => {
        resolve();
      });
    });

    // Remove from auth list
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
      const currentAccountInfo = this.#koniState.keyringService.currentAccount;

      this.#koniState.setCurrentAccount({
        currentGenesisHash: currentAccountInfo?.allGenesisHash || null,
        address: ALL_ACCOUNT_KEY
      }, resolve);
    });

    await this.#koniState.disableMantaPay(address);

    if (lockAfter) {
      this.checkLockAfterMigrate();
    }

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
      assert(isHex(phrase, 256), t('Invalid seed phrase. Please try again.'));
    } else {
      // sadly isHex detects as string, so we need a cast here
      assert(SEED_LENGTHS.includes((phrase).split(' ').length), t('Seed phrase needs to contain {{x}} words', { replace: { x: SEED_LENGTHS.join(', ') } }));
      assert(mnemonicValidate(phrase), t('Invalid seed phrase. Please try again.'));
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
      assert(false, t('Invalid private key. Please try again.'));
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
      throw new Error(t('"{{suri}}" is not a valid derivation path', { replace: { suri } }));
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
          const newAccount = keyring.restoreAccount(file, password, withMasterPassword);

          // genesisHash is not used in SubWallet => reset it to empty string
          if (newAccount.meta?.genesisHash && newAccount.meta?.genesisHash !== '') {
            keyring.saveAccountMeta(newAccount, { ...newAccount.meta, genesisHash: '' });
          }

          this._addAddressToAuthList(address, isAllowed);
        });

        if (this.#alwaysLock) {
          this.keyringLock();
        }
      } catch (error) {
        throw new Error((error as Error).message);
      }
    } else {
      throw new Error(t('Wrong password'));
    }
  }

  private batchRestoreV2 ({ accountsInfo, file, isAllowed, password }: RequestBatchRestoreV2): void {
    const addressList: string[] = accountsInfo.map((acc) => acc.address);
    const isPasswordValidated = this.validatedAccountsPassword(file, password);

    if (isPasswordValidated) {
      try {
        this._saveCurrentAccountAddress(ALL_ACCOUNT_KEY, () => {
          keyring.restoreAccounts(file, password);

          this.#koniState.keyringService.removeNoneHardwareGenesisHash();
          this._addAddressesToAuthList(addressList, isAllowed);
        });

        // if (this.#alwaysLock) {
        //   this.keyringLock();
        // }
      } catch (error) {
        throw new Error((error as Error).message);
      }
    } else {
      throw new Error(t('Wrong password'));
    }
  }

  private async batchExportV2 ({ addresses, password }: RequestAccountBatchExportV2): Promise<ResponseAccountBatchExportV2> {
    try {
      if (addresses && !addresses.length) {
        throw new Error(t('No accounts found to export'));
      }

      return {
        exportedJson: await keyring.backupAccounts(password, addresses)
      };
    } catch (e) {
      const error = e as Error;

      if (error.message === 'Invalid master password') {
        throw new Error(t('Wrong password'));
      } else {
        throw error;
      }
    }
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

    const subscription = historySubject.subscribe((histories) => {
      const addresses = keyring.getAccounts().map((a) => a.address);

      // Re-filter
      cb(histories.filter((item) => addresses.some((address) => isSameAddress(item.address, address))));
    });

    this.createUnsubscriptionHandle(id, subscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    const addresses = keyring.getAccounts().map((a) => a.address);

    // Re-filter
    return historySubject.getValue().filter((item) => addresses.some((address) => isSameAddress(item.address, address)));
  }

  private subscribeHistoryByChainAndAddress ({ address, chain }: RequestSubscribeHistory, id: string, port: chrome.runtime.Port): ResponseSubscribeHistory {
    const cb = createSubscription<'pri(transaction.history.subscribe)'>(id, port);

    const subscribeHistoriesResponse = this.#koniState.historyService.subscribeHistories(chain, address, cb);

    this.createUnsubscriptionHandle(id, subscribeHistoriesResponse.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return {
      id,
      items: subscribeHistoriesResponse.value
    };
  }

  private async getOptimalTransferProcess (params: RequestOptimalTransferProcess): Promise<CommonOptimalPath> {
    return this.#koniState.balanceService.getOptimalTransferProcess(params);
  }

  private async approveSpending (params: TokenSpendingApprovalParams): Promise<SWTransactionResponse> {
    const { amount, chain, contractAddress, owner, spenderAddress } = params;

    if (!isSnowBridgeGatewayContract(spenderAddress)) {
      throw new Error('Only SnowBridge is supported'); // todo: support all ERC20 spending approval
    }

    const evmApi = this.#koniState.getEvmApi(chain);
    const transactionConfig = await getERC20SpendingApprovalTx(spenderAddress, owner, contractAddress, evmApi, amount);

    return this.#koniState.transactionService.handleTransaction({
      errors: [],
      warnings: [],
      address: owner,
      chain,
      chainType: ChainType.EVM,
      transferNativeAmount: '0',
      transaction: transactionConfig,
      data: params,
      resolveOnDone: true, // todo: double-check this for other transactions
      extrinsicType: ExtrinsicType.TOKEN_SPENDING_APPROVAL,
      isTransferAll: false
    });
  }

  private async makeTransfer (inputData: RequestTransfer): Promise<SWTransactionResponse> {
    const { from, networkKey, to, tokenSlug, transferAll, value } = inputData;
    const transferTokenInfo = this.#koniState.chainService.getAssetBySlug(tokenSlug);
    const [errors, ,] = validateTransferRequest(transferTokenInfo, from, to, value, transferAll);

    const warnings: TransactionWarning[] = [];
    const evmApiMap = this.#koniState.getEvmApiMap();
    const chainInfo = this.#koniState.getChainInfo(networkKey);

    const nativeTokenInfo = this.#koniState.getNativeTokenInfo(networkKey);
    const nativeTokenSlug: string = nativeTokenInfo.slug;
    const isTransferNativeToken = nativeTokenSlug === tokenSlug;
    const extrinsicType = isTransferNativeToken ? ExtrinsicType.TRANSFER_BALANCE : ExtrinsicType.TRANSFER_TOKEN;
    let chainType = ChainType.SUBSTRATE;

    const transferAmount: AmountData = { value: '0', symbol: _getAssetSymbol(transferTokenInfo), decimals: _getAssetDecimals(transferTokenInfo) };

    let transaction: ValidateTransactionResponseInput['transaction'];

    const transferTokenAvailable = await this.getAddressTransferableBalance({ address: from, networkKey, token: tokenSlug, extrinsicType });

    try {
      if (isEthereumAddress(from) && isEthereumAddress(to) && _isTokenTransferredByEvm(transferTokenInfo)) {
        chainType = ChainType.EVM;
        const txVal: string = transferAll ? transferTokenAvailable.value : (value || '0');
        const evmApi = evmApiMap[networkKey];

        // Estimate with EVM API
        if (_isTokenEvmSmartContract(transferTokenInfo) || _isLocalToken(transferTokenInfo)) {
          [
            transaction,
            transferAmount.value
          ] = await getERC20TransactionObject(_getContractAddressOfToken(transferTokenInfo), chainInfo, from, to, txVal, !!transferAll, evmApi);
        } else {
          [
            transaction,
            transferAmount.value
          ] = await getEVMTransactionObject(chainInfo, from, to, txVal, !!transferAll, evmApi);
        }
      } else if (_isMantaZkAsset(transferTokenInfo)) {
        transaction = undefined;
        transferAmount.value = '0';
      } else {
        const substrateApi = this.#koniState.getSubstrateApi(networkKey);

        [transaction, transferAmount.value] = await createTransferExtrinsic({
          transferAll: !!transferAll,
          value: value || '0',
          from: from,
          networkKey,
          tokenInfo: transferTokenInfo,
          to: to,
          substrateApi
        });
      }
    } catch (e) {
      const error = e as Error;

      if (error.message.includes('transfer amount exceeds balance')) {
        error.message = t('Insufficient balance');
      }

      throw error;
    }

    const transferNativeAmount = isTransferNativeToken ? transferAmount.value : '0';

    const additionalValidator = async (inputTransaction: SWTransactionResponse): Promise<void> => {
      let senderTransferTokenTransferable: string | undefined;
      let receiverNativeTransferable: string | undefined;

      // Check ed for sender
      if (!isTransferNativeToken) {
        const [_senderTransferTokenTransferable, _receiverNativeTransferable] = await Promise.all([
          this.getAddressTransferableBalance({ address: from, networkKey, token: tokenSlug, extrinsicType }),
          this.getAddressTransferableBalance({ address: to, networkKey, token: nativeTokenSlug, extrinsicType: ExtrinsicType.TRANSFER_BALANCE })
        ]);

        senderTransferTokenTransferable = _senderTransferTokenTransferable.value;
        receiverNativeTransferable = _receiverNativeTransferable.value;
      }

      const { value: receiverTransferTokenTransferable } = await this.getAddressTransferableBalance({ address: to, networkKey, token: tokenSlug, extrinsicType }); // todo: shouldn't be just transferable, locked also counts

      const [warnings, errors] = additionalValidateTransfer(transferTokenInfo, nativeTokenInfo, extrinsicType, receiverTransferTokenTransferable, transferAmount.value, senderTransferTokenTransferable, receiverNativeTransferable);

      warnings.length && inputTransaction.warnings.push(...warnings);
      errors.length && inputTransaction.errors.push(...errors);
    };

    return this.#koniState.transactionService.handleTransaction({
      errors,
      warnings,
      address: from,
      chain: networkKey,
      chainType,
      transferNativeAmount,
      transaction,
      data: inputData,
      extrinsicType,
      ignoreWarnings: transferAll,
      isTransferAll: isTransferNativeToken ? transferAll : false,
      edAsWarning: isTransferNativeToken,
      additionalValidator: additionalValidator
    });
  }

  private async makeCrossChainTransfer (inputData: RequestCrossChainTransfer): Promise<SWTransactionResponse> {
    const { destinationNetworkKey, from, originNetworkKey, to, tokenSlug, value } = inputData;

    const originTokenInfo = this.#koniState.getAssetBySlug(tokenSlug);
    const destinationTokenInfo = this.#koniState.getXcmEqualAssetByChain(destinationNetworkKey, tokenSlug);

    const [errors, fromKeyPair] = validateXcmTransferRequest(destinationTokenInfo, from, value);
    let extrinsic: SubmittableExtrinsic<'promise'> | TransactionConfig | null = null;

    if (errors.length > 0) {
      return this.#koniState.transactionService.generateBeforeHandleResponseErrors(errors);
    }

    const chainInfoMap = this.#koniState.getChainInfoMap();
    const isFromSnowBridgeXcm = _isPureEvmChain(chainInfoMap[originNetworkKey]) && _isSnowBridgeXcm(chainInfoMap[originNetworkKey], chainInfoMap[destinationNetworkKey]);

    let additionalValidator: undefined | ((inputTransaction: SWTransactionResponse) => Promise<void>);
    let eventsHandler: undefined | ((eventEmitter: TransactionEmitter) => void);

    if (fromKeyPair && destinationTokenInfo) {
      if (isFromSnowBridgeXcm) {
        const evmApi = this.#koniState.getEvmApi(originNetworkKey);

        extrinsic = await createSnowBridgeExtrinsic({
          destinationTokenInfo,
          originTokenInfo,
          sendingValue: value,
          sender: from,
          recipient: to,
          chainInfoMap,
          evmApi
        });
      } else {
        const substrateApi = this.#koniState.getSubstrateApi(originNetworkKey);

        extrinsic = await createXcmExtrinsic({
          destinationTokenInfo,
          originTokenInfo,
          sendingValue: value,
          recipient: to,
          chainInfoMap,
          substrateApi
        });
      }

      additionalValidator = async (inputTransaction: SWTransactionResponse): Promise<void> => {
        const { value: senderTransferable } = await this.getAddressTransferableBalance({ address: from, networkKey: originNetworkKey, token: originTokenInfo.slug });
        const isSnowBridge = _isSnowBridgeXcm(chainInfoMap[originNetworkKey], chainInfoMap[destinationNetworkKey]);
        let recipientNativeBalance = '0';

        if (isSnowBridge) {
          const { value } = await this.getAddressTransferableBalance({ address: to, networkKey: destinationNetworkKey, extrinsicType: ExtrinsicType.TRANSFER_BALANCE });

          recipientNativeBalance = value;
        }

        const [warning, error] = additionalValidateXcmTransfer(originTokenInfo, destinationTokenInfo, value, senderTransferable, recipientNativeBalance, chainInfoMap[destinationNetworkKey], isSnowBridge);

        error && inputTransaction.errors.push(error);
        warning && inputTransaction.warnings.push(warning);
      };

      eventsHandler = (eventEmitter: TransactionEmitter) => {
        eventEmitter.on('send', () => {
          try {
            const dest = keyring.getPair(to);

            if (dest) {
              this.updateAssetSetting({
                autoEnableNativeToken: false,
                tokenSlug: destinationTokenInfo.slug,
                assetSetting: { visible: true }
              }).catch(console.error);
            }
          } catch (e) {
          }
        });
      };
    }

    return await this.#koniState.transactionService.handleTransaction({
      url: EXTENSION_REQUEST_URL,
      address: from,
      chain: originNetworkKey,
      transaction: extrinsic,
      data: inputData,
      extrinsicType: ExtrinsicType.TRANSFER_XCM,
      chainType: !isFromSnowBridgeXcm ? ChainType.SUBSTRATE : ChainType.EVM,
      transferNativeAmount: _isNativeToken(originTokenInfo) ? value : '0',
      ignoreWarnings: inputData.transferAll,
      isTransferAll: inputData.transferAll,
      errors,
      additionalValidator: additionalValidator,
      eventsHandler: eventsHandler
    });
  }

  private async evmNftSubmitTransaction (inputData: NftTransactionRequest): Promise<SWTransactionResponse> {
    const { networkKey, params, recipientAddress, senderAddress } = inputData;
    const contractAddress = params.contractAddress as string;
    const tokenId = params.tokenId as string;

    if (UNSUPPORTED_TRANSFER_EVM_CHAIN_NAME.includes(networkKey)) {
      return await this.#koniState.transactionService.handleTransaction({
        address: senderAddress,
        chain: networkKey,
        chainType: ChainType.EVM,
        data: inputData,
        extrinsicType: ExtrinsicType.SEND_NFT,
        transaction: null,
        url: EXTENSION_REQUEST_URL
      });
    }

    const transaction = await getERC721Transaction(this.#koniState.getEvmApi(networkKey), networkKey, contractAddress, senderAddress, recipientAddress, tokenId);

    // this.addContact(recipientAddress);

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

  private async upsertChain (data: _NetworkUpsertParams): Promise<boolean> {
    try {
      return await this.#koniState.upsertChainInfo(data);
    } catch (e) {
      console.error(e);

      return false;
    }
  }

  private removeCustomChain (networkKey: string): boolean {
    return this.#koniState.removeCustomChain(networkKey);
  }

  private disableChain (networkKey: string): Promise<boolean> {
    return this.#koniState.disableChain(networkKey);
  }

  private async enableChain ({ chainSlug, enableTokens }: EnableChainParams): Promise<boolean> {
    return await this.#koniState.enableChain(chainSlug, enableTokens);
  }

  private async reconnectChain (chainSlug: string): Promise<boolean> {
    return this.#koniState.chainService.reconnectChain(chainSlug);
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
      console.error(e);

      return false;
    }
  }

  private async upsertCustomToken (data: _ChainAsset) {
    try {
      await this.#koniState.upsertCustomToken(data);

      return true;
    } catch (e) {
      console.error(e);

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

  private async getAddressTransferableBalance ({ address, extrinsicType, networkKey, token }: RequestFreeBalance): Promise<AmountData> {
    if (token && _MANTA_ZK_CHAIN_GROUP.includes(networkKey)) {
      const tokenInfo = this.#koniState.chainService.getAssetBySlug(token);

      if (tokenInfo.symbol.startsWith(_ZK_ASSET_PREFIX)) {
        return await this.#koniState.getMantaPayZkBalance(address, tokenInfo);
      }
    }

    return await this.#koniState.balanceService.getTransferableBalance(address, networkKey, token, extrinsicType);
  }

  private async getMaxTransferable ({ address, destChain, isXcmTransfer, networkKey, token }: RequestMaxTransferable): Promise<AmountData> {
    const tokenInfo = token ? this.#koniState.chainService.getAssetBySlug(token) : this.#koniState.chainService.getNativeTokenInfo(networkKey);

    if (!_isNativeToken(tokenInfo)) {
      return await this.getAddressTransferableBalance({
        extrinsicType: ExtrinsicType.TRANSFER_TOKEN,
        address,
        networkKey,
        token
      });
    } else {
      let maxTransferable: BigN;

      if (isXcmTransfer) {
        maxTransferable = await this.getXcmMaxTransferable(tokenInfo, destChain, address);
      } else {
        // regular transfer with native token
        maxTransferable = await this.getNativeTokenMaxTransferable(tokenInfo, networkKey, address);
      }

      return {
        value: maxTransferable.gt(BN_ZERO) ? (maxTransferable.toFixed(0) || '0') : '0',
        decimals: tokenInfo.decimals,
        symbol: tokenInfo.symbol
      } as AmountData;
    }
  }

  private async getXcmMaxTransferable (originTokenInfo: _ChainAsset, destChain: string, address: string): Promise<BigN> {
    const substrateApi = this.#koniState.chainService.getSubstrateApi(originTokenInfo.originChain);
    const chainInfoMap = this.#koniState.chainService.getChainInfoMap();
    const destinationTokenInfo = this.#koniState.getXcmEqualAssetByChain(destChain, originTokenInfo.slug);

    if (destinationTokenInfo) {
      const [bnMockFee, { value }] = await Promise.all([
        getXcmMockTxFee(substrateApi, chainInfoMap, originTokenInfo, destinationTokenInfo),
        this.getAddressTransferableBalance({ extrinsicType: ExtrinsicType.TRANSFER_XCM, address, networkKey: originTokenInfo.originChain, token: originTokenInfo.slug })
      ]);

      const bnMaxTransferable = new BigN(value);
      const estimatedFee = bnMockFee.multipliedBy(XCM_FEE_RATIO); // multiply by weight to account for destination chain fee

      return bnMaxTransferable.minus(estimatedFee);
    }

    return new BigN(0);
  }

  private async getNativeTokenMaxTransferable (tokenInfo: _ChainAsset, networkKey: string, address: string): Promise<BigN> {
    const chainInfo = this.#koniState.chainService.getChainInfoByKey(networkKey);
    const api = _isChainEvmCompatible(chainInfo) && _isTokenTransferredByEvm(tokenInfo)
      ? this.#koniState.chainService.getEvmApi(networkKey)
      : this.#koniState.chainService.getSubstrateApi(networkKey);

    const [mockTxFee, { value }] = await Promise.all([
      getTransferMockTxFee(address, chainInfo, tokenInfo, api),
      this.getAddressTransferableBalance({ extrinsicType: ExtrinsicType.TRANSFER_BALANCE, address, networkKey, token: tokenInfo.slug })
    ]);

    const bnMaxTransferable = new BigN(value);

    return bnMaxTransferable.minus(mockTxFee);
  }

  private async subscribeAddressTransferableBalance ({ address, extrinsicType, networkKey, token }: RequestFreeBalance, id: string, port: chrome.runtime.Port): Promise<AmountData> {
    const cb = createSubscription<'pri(freeBalance.subscribe)'>(id, port);

    const convertData = (data: AmountData): AmountDataWithId => {
      return ({ ...data, id });
    };

    const _cb = (data: AmountData) => {
      // eslint-disable-next-line node/no-callback-literal
      cb(convertData(data));
    };

    const [unsub, currentFreeBalance] = await this.#koniState.balanceService.subscribeTransferableBalance(address, networkKey, token, extrinsicType, _cb);

    this.createUnsubscriptionHandle(
      id,
      unsub
    );

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return convertData(currentFreeBalance);
  }

  private async substrateNftSubmitTransaction (inputData: RequestSubstrateNftSubmitTransaction): Promise<NftTransactionResponse> {
    const { params, recipientAddress, senderAddress } = inputData;
    const isSendingSelf = isRecipientSelf(senderAddress, recipientAddress);

    // TODO: do better to detect tokenType
    const isPSP34 = params?.isPsp34 as boolean | undefined;
    const networkKey = params?.networkKey as string;

    const apiProps = this.#koniState.getSubstrateApi(networkKey);
    const extrinsic = !isPSP34
      ? await getNftTransferExtrinsic(networkKey, apiProps, senderAddress, recipientAddress, params || {})
      : await getPSP34TransferExtrinsic(apiProps, senderAddress, recipientAddress, params || {});

    // this.addContact(recipientAddress);

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

  private async enableChains ({ chainSlugs, enableTokens }: EnableMultiChainParams) {
    try {
      await Promise.all(chainSlugs.map((chainSlug) => this.enableChain({ chainSlug, enableTokens })));
    } catch (e) {
      return false;
    }

    return true;
  }

  private getAccountMeta ({ address }: RequestAccountMeta): ResponseAccountMeta {
    const pair = keyring.getPair(address);

    assert(pair, t('Unable to find account'));

    return {
      meta: pair.meta
    };
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
            return [{ code: AccountExternalErrorCode.INVALID_ADDRESS, message: t('Account exists') }];
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
    name,
    originGenesisHash }: RequestAccountCreateHardwareV2): Promise<boolean> {
    const key = keyring.addHardware(address, hardwareType, {
      accountIndex,
      addressOffset,
      genesisHash,
      name,
      originGenesisHash
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
      throw new Error(t("Can't find an account. Please try again"));
    }

    const slugMap: Record<string, string> = {};

    for (const account of accounts) {
      const { accountIndex, address, addressOffset, genesisHash, hardwareType, isEthereum, isGeneric, name, originGenesisHash } = account;

      let result: KeyringPair;

      const baseMeta: KeyringPair$Meta = {
        name,
        hardwareType,
        accountIndex,
        addressOffset,
        genesisHash,
        originGenesisHash,
        isGeneric
      };

      if (isEthereum) {
        result = keyring.keyring.addFromAddress(address, {
          ...baseMeta,
          isExternal: true,
          isHardware: true
        }, null, 'ethereum');

        keyring.saveAccount(result);
        slugMap.ethereum = 'ethereum';
      } else {
        result = keyring.addHardware(address, hardwareType, {
          ...baseMeta,
          availableGenesisHashes: [genesisHash]
        }).pair;

        const [slug] = this.#koniState.findNetworkKeyByGenesisHash(genesisHash);

        if (slug) {
          slugMap[slug] = slug;
        }
      }

      const _address = result.address;

      addresses.push(_address);

      await new Promise<void>((resolve) => {
        this._addAddressToAuthList(_address, true);
        resolve();
      });
    }

    const currentAccount = this.#koniState.keyringService.currentAccount;
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

    if (Object.keys(slugMap).length) {
      this.enableChains({ chainSlugs: Object.keys(slugMap), enableTokens: true }).catch(console.error);
    }

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
          errors: [{ code: AccountExternalErrorCode.KEYRING_ERROR, message: t('Cannot create account') }]
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

      if (this.#alwaysLock) {
        this.keyringLock();
      }

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

    assert(pair, t('Unable to find account'));

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
      throw new Error(t('Cannot find network'));
    }

    const pair = keyring.getPair(address);

    if (!pair) {
      throw Error(t('Unable to find account'));
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
        throw new Error(t('Failed to decode data. Please use a valid QR code'));
      }

      const txObject: TransactionConfig = {
        gasPrice: new BigN(tx.gasPrice).toNumber(),
        to: tx.to,
        value: new BigN(tx.value).toNumber(),
        data: tx.data,
        nonce: new BigN(tx.nonce).toNumber(),
        gas: new BigN(tx.gas).toNumber()
      };

      const common = Common.custom({
        name: network.name,
        networkId: _getEvmChainId(network),
        chainId: _getEvmChainId(network)
      }, { hardfork: 'petersburg' });

      // @ts-ignore
      const transaction = new LegacyTransaction(txObject, { common });

      const signedTranaction = LegacyTransaction.fromSerializedTx(hexToU8a(pair.evmSigner.signTransaction(transaction)));

      signed = signatureToHex({
        r: signedTranaction.r?.toString(16) || '',
        s: signedTranaction.s?.toString(16) || '',
        v: signedTranaction.v?.toString(16) || ''
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
    const { address, amount, chain, nominatorMetadata, selectedValidators } = inputData;
    const chainInfo = this.#koniState.getChainInfo(chain);
    const chainStakingMetadata = await this.#koniState.getStakingMetadataByChain(chain, StakingType.NOMINATED);

    if (!chainStakingMetadata) {
      const errMessage = t('Unable to fetch staking data. Re-enable "{{chainName}}" and try again.', { replace: { chainName: chainInfo.name } });

      return this.#koniState.transactionService
        .generateBeforeHandleResponseErrors([new TransactionError(StakingTxErrorType.CAN_NOT_GET_METADATA, errMessage)]);
    }

    const bondingValidation = validateBondingCondition(chainInfo, amount, selectedValidators, address, chainStakingMetadata, nominatorMetadata);

    if (!amount || !selectedValidators || bondingValidation.length > 0) {
      return this.#koniState.transactionService
        .generateBeforeHandleResponseErrors(bondingValidation);
    }

    const substrateApi = this.#koniState.getSubstrateApi(chain);
    const extrinsic = await getBondingExtrinsic(chainInfo, amount, selectedValidators, substrateApi, address, nominatorMetadata);

    return await this.#koniState.transactionService.handleTransaction({
      address,
      chain: chain,
      chainType: ChainType.SUBSTRATE,
      data: inputData,
      extrinsicType: ExtrinsicType.STAKING_BOND,
      transaction: extrinsic,
      url: EXTENSION_REQUEST_URL,
      transferNativeAmount: amount
    });
  }

  private async submitUnbonding (inputData: RequestUnbondingSubmit): Promise<SWTransactionResponse> {
    const { amount, chain, nominatorMetadata, validatorAddress } = inputData;

    const chainStakingMetadata = await this.#koniState.getStakingMetadataByChain(chain, StakingType.NOMINATED);

    if (!chainStakingMetadata || !nominatorMetadata) {
      return this.#koniState.transactionService.generateBeforeHandleResponseErrors([new TransactionError(BasicTxErrorType.INTERNAL_ERROR)]);
    }

    const unbondingValidation = validateUnbondingCondition(nominatorMetadata, amount, chain, chainStakingMetadata, validatorAddress);

    if (!amount || unbondingValidation.length > 0) {
      return this.#koniState.transactionService.generateBeforeHandleResponseErrors(unbondingValidation);
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

  private async submitStakeClaimReward (inputData: RequestStakeClaimReward): Promise<SWTransactionResponse> {
    const { address, bondReward, slug } = inputData;
    const poolHandler = this.#koniState.earningService.getPoolHandler(slug);

    if (!address || !poolHandler) {
      return this.#koniState.transactionService.generateBeforeHandleResponseErrors([new TransactionError(BasicTxErrorType.INVALID_PARAMS)]);
    }

    const chain = poolHandler.chain;
    const stakingType: StakingType = poolHandler.type === YieldPoolType.NOMINATION_POOL ? StakingType.POOLED : StakingType.NOMINATED;
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
    const { address, selectedUnstaking, slug } = inputData;
    const chain = this.#koniState.earningService.getPoolHandler(slug)?.chain;

    if (!chain || !selectedUnstaking) {
      return this.#koniState.transactionService.generateBeforeHandleResponseErrors([new TransactionError(BasicTxErrorType.INVALID_PARAMS)]);
    }

    const substrateApi = this.#koniState.getSubstrateApi(chain);
    // @ts-ignore
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

  private async submitPoolBonding (inputData: RequestStakePoolingBonding): Promise<SWTransactionResponse> {
    const { address, amount, chain, nominatorMetadata, selectedPool } = inputData;

    const chainInfo = this.#koniState.getChainInfo(chain);
    const chainStakingMetadata = await this.#koniState.getStakingMetadataByChain(chain, StakingType.NOMINATED);

    if (!chainStakingMetadata) {
      const errMessage = t('Unable to fetch staking data. Re-enable "{{chainName}}" and try again.', { replace: { chainName: chainInfo.name } });

      return this.#koniState.transactionService
        .generateBeforeHandleResponseErrors([new TransactionError(StakingTxErrorType.CAN_NOT_GET_METADATA, errMessage)]);
    }

    const bondingValidation = validatePoolBondingCondition(chainInfo, amount, selectedPool, address, chainStakingMetadata, nominatorMetadata);

    if (!amount || bondingValidation.length > 0) {
      return this.#koniState.transactionService
        .generateBeforeHandleResponseErrors(bondingValidation);
    }

    const substrateApi = this.#koniState.getSubstrateApi(chain);
    const extrinsic = await getPoolingBondingExtrinsic(substrateApi, amount, selectedPool.id, nominatorMetadata);

    return await this.#koniState.transactionService.handleTransaction({
      address,
      chain,
      transaction: extrinsic,
      data: inputData,
      extrinsicType: ExtrinsicType.STAKING_JOIN_POOL,
      chainType: ChainType.SUBSTRATE,
      transferNativeAmount: amount
    });
  }

  private async submitPoolingUnbonding (inputData: RequestStakePoolingUnbonding): Promise<SWTransactionResponse> {
    const { amount, chain, nominatorMetadata } = inputData;

    const chainStakingMetadata = await this.#koniState.getStakingMetadataByChain(chain, StakingType.NOMINATED);

    if (!chainStakingMetadata || !nominatorMetadata) {
      const chainInfo = this.#koniState.getChainInfo(chain);
      const errMessage = t('Unable to fetch staking data. Re-enable "{{chainName}}" and try again.', { replace: { chainName: chainInfo?.name } });

      return this.#koniState.transactionService
        .generateBeforeHandleResponseErrors([new TransactionError(StakingTxErrorType.CAN_NOT_GET_METADATA, errMessage)]);
    }

    const unbondingValidation = validateRelayUnbondingCondition(amount, chainStakingMetadata, nominatorMetadata);

    if (!amount || unbondingValidation.length > 0) {
      return this.#koniState.transactionService
        .generateBeforeHandleResponseErrors(unbondingValidation);
    }

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

  /// Keyring state

  // Subscribe keyring state

  private keyringStateSubscribe (id: string, port: chrome.runtime.Port): KeyringState {
    const cb = createSubscription<'pri(keyring.subscribe)'>(id, port);
    const keyringStateSubject = this.#koniState.keyringService.keyringStateSubject;
    const subscription = keyringStateSubject.subscribe((value): void =>
      cb(value)
    );

    this.createUnsubscriptionHandle(id, subscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.#koniState.keyringService.keyringState;
  }

  // Change master password

  private keyringChangeMasterPassword ({ createNew,
    newPassword,
    oldPassword }: RequestChangeMasterPassword): ResponseChangeMasterPassword {
    try {
      // Remove isMasterPassword meta if createNew
      if (createNew && !keyring.keyring.hasMasterPassword) {
        const pairs = keyring.getPairs();

        for (const pair of pairs) {
          if (pair.meta.isInjected) {
            // Empty
          } else {
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
      }

      keyring.changeMasterPassword(newPassword, oldPassword);
    } catch (e) {
      console.error(e);

      return {
        errors: [t((e as Error).message)],
        status: false
      };
    }

    this.#koniState.updateKeyringState();

    if (this.#alwaysLock && !createNew) {
      this.keyringLock();
    }

    return {
      status: true,
      errors: []
    };
  }

  // Migrate password

  private checkLockAfterMigrate () {
    const pairs = keyring.getPairs();

    const needMigrate = !!pairs
      .filter((acc) => acc.address !== ALL_ACCOUNT_KEY && !acc.meta.isExternal && !acc.meta.isInjected)
      .filter((acc) => !acc.meta.isMasterPassword)
      .length;

    if (!needMigrate) {
      if (this.#alwaysLock) {
        this.keyringLock();
      }
    }
  }

  private keyringMigrateMasterPassword ({ address, password }: RequestMigratePassword): ResponseMigratePassword {
    try {
      keyring.migrateWithMasterPassword(address, password);

      this.checkLockAfterMigrate();
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

  // Unlock wallet

  private keyringUnlock ({ password }: RequestUnlockKeyring): ResponseUnlockKeyring {
    try {
      keyring.unlockKeyring(password);
      // this.#koniState.initMantaPay(password)
      //   .catch(console.error);
    } catch (e) {
      return {
        errors: [(e as Error).message],
        status: false
      };
    }

    this.#koniState.updateKeyringState();

    return {
      status: true,
      errors: []
    };
  }

  // Lock wallet

  private keyringLock (): void {
    this.#koniState.keyringService.lock();
    this.#keyringLockSubject.next(true);
    clearTimeout(this.#lockTimeOut);
  }

  public keyringLockSubscribe (cb: (state: boolean) => void): any {
    this.#keyringLockSubject.subscribe(cb);
  }

  // Export mnemonic

  private keyringExportMnemonic ({ address, password }: RequestKeyringExportMnemonic): ResponseKeyringExportMnemonic {
    const pair = keyring.getPair(address);

    const result = pair.exportMnemonic(password);

    return { result };
  }

  // Reset wallet

  private async resetWallet ({ resetAll }: RequestResetWallet): Promise<ResponseResetWallet> {
    try {
      await this.#koniState.resetWallet(resetAll);

      return {
        errors: [],
        status: true
      };
    } catch (e) {
      return {
        errors: [(e as Error).message],
        status: false
      };
    }
  }

  /// Signing substrate request
  private async signingApprovePasswordV2 ({ id }: RequestSigningApprovePasswordV2): Promise<boolean> {
    const queued = this.#koniState.getSignRequest(id);

    assert(queued, t('Unable to proceed. Please try again'));

    const { reject, request, resolve } = queued;
    const pair = keyring.getPair(queued.account.address);

    // unlike queued.account.address the following
    // address is encoded with the default prefix
    // which what is used for password caching mapping
    const { address } = pair;

    if (!pair) {
      reject(new Error(t('Unable to find account')));

      return false;
    }

    if (pair.isLocked) {
      keyring.unlockPair(address);
    }

    const { payload } = request;

    let registry: Registry;

    if (isJsonPayload(payload)) {
      const [, chainInfo] = this.#koniState.findNetworkKeyByGenesisHash(payload.genesisHash);
      let metadata: MetadataDef | MetadataItem | undefined;

      /**
       *  Get the metadata for the genesisHash
       *  @todo: need to handle case metadata store in db
      */
      metadata = this.#koniState.knownMetadata.find((meta: MetadataDef) =>
        meta.genesisHash === payload.genesisHash);

      if (metadata) {
        // we have metadata, expand it and extract the info/registry
        const expanded = metadataExpand(metadata, false);

        registry = expanded.registry;
        registry.setSignedExtensions(payload.signedExtensions, expanded.definition.userExtensions);
      } else {
        metadata = await this.#koniState.chainService.getMetadataByHash(payload.genesisHash);

        if (metadata) {
          registry = new TypeRegistry();

          const _metadata = new Metadata(registry, metadata.hexValue);

          registry.register(metadata.types);
          registry.setChainProperties(registry.createType('ChainProperties', {
            ss58Format: chainInfo?.substrateInfo?.addressPrefix || 42,
            tokenDecimals: chainInfo?.substrateInfo?.decimals,
            tokenSymbol: chainInfo?.substrateInfo?.symbol
          }) as unknown as ChainProperties);
          registry.setMetadata(_metadata, payload.signedExtensions, metadata.userExtensions);
        } else {
          // we have no metadata, create a new registry
          registry = new TypeRegistry();
          registry.setSignedExtensions(payload.signedExtensions);
        }
      }

      if (!metadata) {
        /*
        * Some networks must have metadata to signing,
        * so if the chain not active (cannot use metadata from api), it must be rejected
        *  */
        if (
          chainInfo &&
          (_API_OPTIONS_CHAIN_GROUP.avail.includes(chainInfo.slug) || _API_OPTIONS_CHAIN_GROUP.goldberg.includes(chainInfo.slug)) // The special case for chains that need metadata to signing
        ) {
          // For case the chain does not have any provider
          if (!Object.keys(chainInfo.providers).length) {
            reject(new Error('{{chain}} network does not have any provider to connect, please update metadata from dApp'.replaceAll('{{chain}}', chainInfo.name)));

            return false;
          }

          const isChainActive = this.#koniState.getChainStateByKey(chainInfo.slug).active;

          if (!isChainActive) {
            reject(new Error('Please activate {{chain}} network before signing'.replaceAll('{{chain}}', chainInfo.name)));

            return false;
          }

          registry = this.#koniState.getSubstrateApi(chainInfo.slug).api.registry as unknown as TypeRegistry;
        }
      }
    } else {
      // for non-payload, just create a registry to use
      registry = new TypeRegistry();
    }

    const result = request.sign(registry as unknown as TypeRegistry, pair);

    resolve({
      id,
      // In case evm chain, must be cut 2 character after 0x
      signature: result.signature
    });

    if (this.#alwaysLock) {
      this.keyringLock();
    }

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
          throw Error(t('Invalid derive path'));
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
        console.log(e);
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

    if (this.#alwaysLock) {
      this.keyringLock();
    }

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
        throw Error(t('Invalid derive path'));
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
  private async subscribeChainInfoMap (id: string, port: chrome.runtime.Port): Promise<Record<string, _ChainInfo>> {
    const cb = createSubscription<'pri(chainService.subscribeChainInfoMap)'>(id, port);
    let ready = false;
    const chainInfoMapSubscription = this.#koniState.subscribeChainInfoMap().subscribe({
      next: (rs) => {
        if (ready) {
          cb(rs);
        }
      }
    });

    this.createUnsubscriptionHandle(id, chainInfoMapSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    await this.#koniState.eventService.waitChainReady;
    ready = true;

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

  private subscribeChainStatusMap (id: string, port: chrome.runtime.Port): Record<string, _ChainApiStatus> {
    const cb = createSubscription<'pri(chainService.subscribeChainStatusMap)'>(id, port);
    const chainStateMapSubscription = this.#koniState.chainService.subscribeChainStatusMap().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    this.createUnsubscriptionHandle(id, chainStateMapSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.#koniState.chainService.getChainStatusMap();
  }

  private async subscribeAssetRegistry (id: string, port: chrome.runtime.Port): Promise<Record<string, _ChainAsset>> {
    const cb = createSubscription<'pri(chainService.subscribeAssetRegistry)'>(id, port);

    await this.#koniState.eventService.waitAssetOnlineReady;

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

  private subscribeXcmRefMap (id: string, port: chrome.runtime.Port): Record<string, _AssetRef> {
    const cb = createSubscription<'pri(chainService.subscribeXcmRefMap)'>(id, port);
    const xcmRefSubscription = this.#koniState.subscribeXcmRefMap().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    this.createUnsubscriptionHandle(id, xcmRefSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.#koniState.getXcmRefMap();
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
        const { additionalValidator, eventsHandler, transaction, ...transactionResult } = value;

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

  private async reloadCron ({ data }: CronReloadRequest) {
    if (data === 'nft') {
      return await this.#koniState.reloadNft();
    } else if (data === 'staking') {
      return await this.#koniState.reloadStaking();
    } else if (data === 'balance') {
      return await this.#koniState.reloadBalance();
    } else if (data === 'crowdloan') {
      return await this.#koniState.reloadCrowdloan();
    }

    return Promise.resolve(false);
  }

  private async getLogoMap () {
    const [chainLogoMap, assetLogoMap] = await Promise.all([this.#koniState.chainService.getChainLogoMap(), this.#koniState.chainService.getAssetLogoMap()]);

    return {
      chainLogoMap,
      assetLogoMap
    };
  }

  private subscribeAssetLogoMap (id: string, port: chrome.runtime.Port) {
    const cb = createSubscription<'pri(settings.logo.assets.subscribe)'>(id, port);
    const subscription = this.#koniState.chainService.subscribeAssetLogoMap().subscribe((rs) => {
      cb(rs);
    });

    port.onDisconnect.addListener((): void => {
      subscription.unsubscribe();
      this.cancelSubscription(id);
    });

    return this.#koniState.chainService.getAssetLogoMap();
  }

  private subscribeChainLogoMap (id: string, port: chrome.runtime.Port) {
    const cb = createSubscription<'pri(settings.logo.chains.subscribe)'>(id, port);
    const subscription = this.#koniState.chainService.subscribeChainLogoMap().subscribe((rs) => {
      cb(rs);
    });

    port.onDisconnect.addListener((): void => {
      subscription.unsubscribe();
      this.cancelSubscription(id);
    });

    return this.#koniState.chainService.getChainLogoMap();
  }

  // Phishing detect

  private async passPhishingPage ({ url }: RequestPassPhishingPage) {
    return await this.#koniState.approvePassPhishingPage(url);
  }

  /// Wallet connect

  // Connect
  private async connectWalletConnect ({ uri }: RequestConnectWalletConnect): Promise<boolean> {
    await this.#koniState.walletConnectService.connect(uri);

    return true;
  }

  private connectWCSubscribe (id: string, port: chrome.runtime.Port): WalletConnectSessionRequest[] {
    const cb = createSubscription<'pri(walletConnect.requests.connect.subscribe)'>(id, port);
    const subscription = this.#koniState.requestService.connectWCSubject.subscribe((requests: WalletConnectSessionRequest[]): void =>
      cb(requests)
    );

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
      subscription.unsubscribe();
    });

    return this.#koniState.requestService.allConnectWCRequests;
  }

  private async approveWalletConnectSession ({ accounts: selectedAccounts, id }: RequestApproveConnectWalletSession): Promise<boolean> {
    const request = this.#koniState.requestService.getConnectWCRequest(id);

    if (isProposalExpired(request.request.params)) {
      throw new Error('The proposal has been expired');
    }

    const wcId = request.request.id;
    const params = request.request.params;

    const requiredNamespaces: ProposalTypes.RequiredNamespaces = params.requiredNamespaces || {};
    const optionalNamespaces: ProposalTypes.OptionalNamespaces = params.optionalNamespaces || {};

    const availableNamespaces: ProposalTypes.RequiredNamespaces = {};

    const namespaces: SessionTypes.Namespaces = {};
    const chainInfoMap = this.#koniState.getChainInfoMap();

    Object.entries(requiredNamespaces)
      .forEach(([key, namespace]) => {
        if (isSupportWalletConnectNamespace(key)) {
          if (namespace.chains) {
            const unSupportChains = namespace.chains.filter((chain) => !isSupportWalletConnectChain(chain, chainInfoMap));

            if (unSupportChains.length) {
              throw new Error(getSdkError('UNSUPPORTED_CHAINS').message + ' ' + unSupportChains.toString());
            }

            availableNamespaces[key] = namespace;
          }
        } else {
          throw new Error(getSdkError('UNSUPPORTED_NAMESPACE_KEY').message + ' ' + key);
        }
      });

    Object.entries(optionalNamespaces)
      .forEach(([key, namespace]) => {
        if (isSupportWalletConnectNamespace(key)) {
          if (namespace.chains) {
            const supportChains = namespace.chains.filter((chain) => isSupportWalletConnectChain(chain, chainInfoMap)) || [];

            const requiredNameSpace = availableNamespaces[key];
            const defaultChains: string[] = [];

            if (requiredNameSpace) {
              availableNamespaces[key] = {
                chains: [...(requiredNameSpace.chains || defaultChains), ...(supportChains || defaultChains)],
                events: requiredNameSpace.events,
                methods: requiredNameSpace.methods
              };
            } else {
              if (supportChains.length) {
                availableNamespaces[key] = {
                  chains: supportChains,
                  events: namespace.events,
                  methods: namespace.methods
                };
              }
            }
          }
        }
      });

    Object.entries(availableNamespaces)
      .forEach(([key, namespace]) => {
        if (namespace.chains) {
          const accounts: string[] = [];

          const chains = uniqueStringArray(namespace.chains);

          chains.forEach((chain) => {
            accounts.push(...(selectedAccounts.filter((address) => isEthereumAddress(address) === (key === WALLET_CONNECT_EIP155_NAMESPACE)).map((address) => `${chain}:${address}`)));
          });

          namespaces[key] = {
            accounts,
            methods: namespace.methods,
            events: namespace.events,
            chains: chains
          };
        }
      });

    const result: ResultApproveWalletConnectSession = {
      id: wcId,
      namespaces: namespaces,
      relayProtocol: params.relays[0].protocol
    };

    await this.#koniState.walletConnectService.approveSession(result);
    request.resolve();

    return true;
  }

  private async rejectWalletConnectSession ({ id }: RequestRejectConnectWalletSession): Promise<boolean> {
    const request = this.#koniState.requestService.getConnectWCRequest(id);

    const wcId = request.request.id;

    if (isProposalExpired(request.request.params)) {
      request.reject(new Error('The proposal has been expired'));

      return true;
    }

    await this.#koniState.walletConnectService.rejectSession(wcId);
    request.reject(new Error('USER_REJECTED'));

    return true;
  }

  private subscribeWalletConnectSessions (id: string, port: chrome.runtime.Port): SessionTypes.Struct[] {
    const cb = createSubscription<'pri(walletConnect.session.subscribe)'>(id, port);

    const subscription = this.#koniState.walletConnectService.sessionSubject.subscribe((rs) => {
      cb(rs);
    });

    port.onDisconnect.addListener((): void => {
      subscription.unsubscribe();
      this.cancelSubscription(id);
    });

    return this.#koniState.walletConnectService.sessions;
  }

  private async disconnectWalletConnectSession ({ topic }: RequestDisconnectWalletConnectSession): Promise<boolean> {
    await this.#koniState.walletConnectService.disconnect(topic);

    return true;
  }

  private WCNotSupportSubscribe (id: string, port: chrome.runtime.Port): WalletConnectNotSupportRequest[] {
    const cb = createSubscription<'pri(walletConnect.requests.notSupport.subscribe)'>(id, port);
    const subscription = this.#koniState.requestService.notSupportWCSubject.subscribe((requests: WalletConnectNotSupportRequest[]): void =>
      cb(requests)
    );

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
      subscription.unsubscribe();
    });

    return this.#koniState.requestService.allNotSupportWCRequests;
  }

  private approveWalletConnectNotSupport ({ id }: RequestApproveWalletConnectNotSupport): boolean {
    const request = this.#koniState.requestService.getNotSupportWCRequest(id);

    request.resolve();

    return true;
  }

  private rejectWalletConnectNotSupport ({ id }: RequestRejectWalletConnectNotSupport): boolean {
    const request = this.#koniState.requestService.getNotSupportWCRequest(id);

    request.reject(new Error('USER_REJECTED'));

    return true;
  }

  /// Manta

  private async enableMantaPay ({ address, password }: MantaPayEnableParams): Promise<MantaPayEnableResponse> { // always takes the current account
    function timeout () {
      return new Promise((resolve) => setTimeout(resolve, 1500));
    }

    try {
      await this.#koniState.chainService.enableChain(_DEFAULT_MANTA_ZK_CHAIN);
      this.#koniState.chainService.setMantaZkAssetSettings(true);

      const mnemonic = this.keyringExportMnemonic({ address, password });
      const { connectionStatus } = this.#koniState.chainService.getChainStatusByKey(_DEFAULT_MANTA_ZK_CHAIN);

      if (connectionStatus !== _ChainConnectionStatus.CONNECTED) { // TODO: do better
        await timeout();
      }

      const result = await this.#koniState.enableMantaPay(true, address, password, mnemonic.result);

      this.#skipAutoLock = true;
      await this.saveCurrentAccountAddress({ address });
      const unsubSyncProgress = await this.#koniState.chainService?.mantaPay?.subscribeSyncProgress();

      console.debug('Start initial sync for MantaPay');

      this.#koniState.initialSyncMantaPay(address)
        .then(() => {
          console.debug('Finished initial sync for MantaPay');

          this.#skipAutoLock = false;
          unsubSyncProgress && unsubSyncProgress();
        })
        .catch((e) => {
          console.error('Error syncing MantaPay', e);

          this.#skipAutoLock = false;
          unsubSyncProgress && unsubSyncProgress();
        });

      return {
        success: !!result,
        message: result ? MantaPayEnableMessage.SUCCESS : MantaPayEnableMessage.UNKNOWN_ERROR
      };
    } catch (e) {
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      if (e.toString() === 'Error: Unable to decode using the supplied passphrase') {
        return {
          success: false,
          message: MantaPayEnableMessage.WRONG_PASSWORD
        };
      }

      return {
        success: false,
        message: MantaPayEnableMessage.UNKNOWN_ERROR
      };
    }
  }

  private async initSyncMantaPay (address: string) {
    if (this.#koniState.chainService?.mantaPay?.getSyncState().isSyncing || !MODULE_SUPPORT.MANTA_ZK) {
      return;
    }

    this.#skipAutoLock = true;
    await this.saveCurrentAccountAddress({ address });
    const unsubSyncProgress = await this.#koniState.chainService?.mantaPay?.subscribeSyncProgress();

    console.debug('Start initial sync for MantaPay');

    this.#koniState.initialSyncMantaPay(address)
      .then(() => {
        console.debug('Finished initial sync for MantaPay');

        this.#skipAutoLock = false;
        unsubSyncProgress && unsubSyncProgress();
        // make sure the sync state is set, just in case it gets unsubscribed
        this.#koniState.chainService?.mantaPay?.setSyncState({
          progress: 100,
          isSyncing: false
        });
      })
      .catch((e) => {
        console.error('Error syncing MantaPay', e);

        this.#skipAutoLock = false;
        unsubSyncProgress && unsubSyncProgress();
        this.#koniState.chainService?.mantaPay?.setSyncState({
          progress: 0,
          isSyncing: false
        });
      });
  }

  private async disableMantaPay (address: string) {
    return this.#koniState.disableMantaPay(address);
  }

  private subscribeMantaPayConfig (id: string, port: chrome.runtime.Port) {
    const cb = createSubscription<'pri(mantaPay.subscribeConfig)'>(id, port);
    const mantaPayConfigSubscription = this.#koniState.subscribeMantaPayConfig().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    this.createUnsubscriptionHandle(id, mantaPayConfigSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.#koniState.getMantaPayConfig('calamari');
  }

  private subscribeMantaPaySyncState (id: string, port: chrome.runtime.Port): MantaPaySyncState {
    const cb = createSubscription<'pri(mantaPay.subscribeSyncingState)'>(id, port);

    const syncingStateSubscription = this.#koniState.subscribeMantaPaySyncState()?.subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    this.createUnsubscriptionHandle(id, syncingStateSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.#koniState.chainService?.mantaPay?.getSyncState() || {
      isSyncing: false,
      progress: 0,
      needManualSync: false
    };
  }

  /* Metadata */

  private async findRawMetadata ({ genesisHash }: RequestFindRawMetadata): Promise<ResponseFindRawMetadata> {
    const { metadata, specVersion, types, userExtensions } = await this.#koniState.findMetadata(genesisHash);

    return {
      rawMetadata: metadata,
      specVersion,
      types,
      userExtensions
    };
  }

  private async calculateMetadataHash ({ chain }: RequestMetadataHash): Promise<ResponseMetadataHash> {
    const hash = await this.#koniState.calculateMetadataHash(chain);

    return {
      metadataHash: hash || ''
    };
  }

  private async shortenMetadata ({ chain, txBlob }: RequestShortenMetadata): Promise<ResponseShortenMetadata> {
    const shorten = await this.#koniState.shortenMetadata(chain, txBlob);

    return {
      txMetadata: shorten || ''
    };
  }

  /* Metadata */

  private async resolveDomainByAddress (request: ResolveDomainRequest) {
    const chainApi = this.#koniState.getSubstrateApi(request.chain);

    return await resolveAzeroDomainToAddress(request.domain, request.chain, chainApi.api);
  }

  private async resolveAddressByDomain (request: ResolveAddressToDomainRequest) {
    const chainApi = this.#koniState.getSubstrateApi(request.chain);

    return await resolveAzeroAddressToDomain(request.address, request.chain, chainApi.api);
  }

  /// Inject account
  private addInjects (request: RequestAddInjectedAccounts): boolean {
    this.#koniState.keyringService.addInjectAccounts(request.accounts);

    return true;
  }

  private removeInjects (request: RequestRemoveInjectedAccounts): boolean {
    this.#koniState.keyringService.removeInjectAccounts(request.addresses);

    return true;
  }

  private async subscribeYieldPoolInfo (id: string, port: chrome.runtime.Port) {
    const cb = createSubscription<'pri(yield.subscribePoolInfo)'>(id, port);

    await this.#koniState.earningService.waitForStarted();
    const yieldPoolSubscription = this.#koniState.earningService.subscribeYieldPoolInfo().subscribe({
      next: (rs) => {
        cb(Object.values(rs));
      }
    });

    this.createUnsubscriptionHandle(id, yieldPoolSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.#koniState.earningService.getYieldPoolInfo();
  }

  private async earlyValidateJoin (request: RequestEarlyValidateYield) {
    return await this.#koniState.earningService.earlyValidateJoin(request);
  }

  private async getOptimalYieldPath (request: OptimalYieldPathParams) {
    return await this.#koniState.earningService.generateOptimalSteps(request);
  }

  private async handleYieldStep (inputData: RequestYieldStepSubmit): Promise<SWTransactionResponse> {
    const { data, path } = inputData;
    const { address } = data;

    if (!data) {
      return this.#koniState.transactionService
        .generateBeforeHandleResponseErrors([new TransactionError(BasicTxErrorType.INTERNAL_ERROR)]);
    }

    const isLastStep = inputData.currentStep + 1 === path.steps.length;

    const yieldValidation: TransactionError[] = await this.#koniState.earningService.validateYieldJoin({ data, path }); // TODO: validate, set to fail upon submission

    if (yieldValidation.length > 0) {
      return this.#koniState.transactionService
        .generateBeforeHandleResponseErrors(yieldValidation);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { chainType, extrinsic, extrinsicType, transferNativeAmount, txChain, txData } = await this.#koniState.earningService.handleYieldJoin(inputData);
    const isPoolSupportAlternativeFee = this.#koniState.earningService.isPoolSupportAlternativeFee(inputData.data.slug);

    const isMintingStep = YIELD_EXTRINSIC_TYPES.includes(extrinsicType);

    return await this.#koniState.transactionService.handleTransaction({
      address,
      chain: txChain,
      transaction: extrinsic,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: txData,
      extrinsicType, // change this depends on step
      chainType,
      resolveOnDone: !isLastStep,
      transferNativeAmount,
      skipFeeValidation: isMintingStep && isPoolSupportAlternativeFee
    });
  }

  private async handleYieldLeave (params: RequestYieldLeave): Promise<SWTransactionResponse> {
    const { address, slug } = params;
    const leaveValidation = await this.#koniState.earningService.validateYieldLeave(params);

    if (leaveValidation.length > 0) {
      return this.#koniState.transactionService.generateBeforeHandleResponseErrors(leaveValidation);
    }

    const [extrinsicType, extrinsic] = await this.#koniState.earningService.handleYieldLeave(params);
    const handler = this.#koniState.earningService.getPoolHandler(slug);

    return await this.#koniState.transactionService.handleTransaction({
      address,
      chain: handler?.chain || '',
      transaction: extrinsic,
      data: params, // TODO
      extrinsicType,
      chainType: handler?.transactionChainType || ChainType.SUBSTRATE
    });
  }

  private async getYieldPoolTargets (request: RequestGetYieldPoolTargets): Promise<ResponseGetYieldPoolTargets> {
    const { slug } = request;

    await this.#koniState.earningService.waitForStarted();
    const targets = await this.#koniState.earningService.getPoolTargets(slug);

    return {
      slug,
      targets
    };
  }

  private async subscribeYieldPosition (id: string, port: chrome.runtime.Port) {
    const cb = createSubscription<'pri(yield.subscribeYieldPosition)'>(id, port);

    await this.#koniState.earningService.waitForStarted();
    const yieldPositionSubscription = this.#koniState.earningService.subscribeYieldPosition().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    this.createUnsubscriptionHandle(id, yieldPositionSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return await this.#koniState.earningService.getYieldPositionInfo();
  }

  private async subscribeYieldReward (id: string, port: chrome.runtime.Port): Promise<EarningRewardJson | null> {
    const cb = createSubscription<'pri(yield.subscribeYieldReward)'>(id, port);

    await this.#koniState.earningService.waitForStarted();
    const stakingRewardSubscription = this.#koniState.earningService.subscribeEarningReward().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    this.createUnsubscriptionHandle(id, stakingRewardSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.#koniState.earningService.getEarningRewards();
  }

  private async subscribeYieldRewardHistory (id: string, port: chrome.runtime.Port) {
    const cb = createSubscription<'pri(yield.subscribeRewardHistory)'>(id, port);

    await this.#koniState.earningService.waitForStarted();
    const rewardHistorySubscription = this.#koniState.earningService.subscribeEarningRewardHistory().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    this.createUnsubscriptionHandle(id, rewardHistorySubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.#koniState.earningService.getEarningRewardHistory();
  }

  private async subscribeEarningMinAmountPercent (id: string, port: chrome.runtime.Port) {
    const cb = createSubscription<'pri(yield.minAmountPercent)'>(id, port);

    await this.#koniState.earningService.waitForStarted();
    const earningMinAmountPercentSubscription = this.#koniState.earningService.subscribeMinAmountPercent().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    this.createUnsubscriptionHandle(id, earningMinAmountPercentSubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.#koniState.earningService.getMinAmountPercent();
  }

  private handleValidateYieldProcess (inputData: ValidateYieldProcessParams) {
    return this.#koniState.earningService.validateYieldJoin(inputData);
  }

  private async yieldSubmitWithdrawal (params: RequestYieldWithdrawal): Promise<SWTransactionResponse> {
    const { address, slug } = params;
    const poolHandler = this.#koniState.earningService.getPoolHandler(slug);

    if (!poolHandler) {
      return this.#koniState.transactionService.generateBeforeHandleResponseErrors([new TransactionError(BasicTxErrorType.INVALID_PARAMS)]);
    }

    const extrinsic = await this.#koniState.earningService.handleYieldWithdraw(params);

    return await this.#koniState.transactionService.handleTransaction({
      address: address,
      chain: poolHandler.chain,
      transaction: extrinsic,
      data: params,
      extrinsicType: ExtrinsicType.STAKING_WITHDRAW,
      chainType: poolHandler?.transactionChainType || ChainType.SUBSTRATE
    });
  }

  private async yieldSubmitCancelWithdrawal (params: RequestStakeCancelWithdrawal): Promise<SWTransactionResponse> {
    const { address, selectedUnstaking, slug } = params;
    const poolHandler = this.#koniState.earningService.getPoolHandler(slug);

    if (!poolHandler || !selectedUnstaking) {
      return this.#koniState.transactionService.generateBeforeHandleResponseErrors([new TransactionError(BasicTxErrorType.INVALID_PARAMS)]);
    }

    const chain = poolHandler.chain;
    const extrinsic = await this.#koniState.earningService.handleYieldCancelUnstake(params);

    return await this.#koniState.transactionService.handleTransaction({
      address,
      chain,
      transaction: extrinsic,
      data: params,
      extrinsicType: ExtrinsicType.STAKING_CANCEL_UNSTAKE,
      chainType: poolHandler?.transactionChainType || ChainType.SUBSTRATE
    });
  }

  private async yieldSubmitClaimReward (params: RequestStakeClaimReward): Promise<SWTransactionResponse> {
    const { address, slug } = params;
    const poolHandler = this.#koniState.earningService.getPoolHandler(slug);

    if (!address || !poolHandler) {
      return this.#koniState.transactionService.generateBeforeHandleResponseErrors([new TransactionError(BasicTxErrorType.INVALID_PARAMS)]);
    }

    const extrinsic = await this.#koniState.earningService.handleYieldClaimReward(params);

    return await this.#koniState.transactionService.handleTransaction({
      address,
      chain: poolHandler.chain,
      transaction: extrinsic,
      data: params,
      extrinsicType: ExtrinsicType.STAKING_CLAIM_REWARD,
      chainType: poolHandler?.transactionChainType || ChainType.SUBSTRATE
    });
  }

  /* Campaign */

  private unlockDotCheckCanMint ({ address, network, slug }: RequestUnlockDotCheckCanMint) {
    return this.#koniState.mintCampaignService.unlockDotCampaign.canMint(address, slug, network);
  }

  private unlockDotSubscribeMintedData (id: string, port: chrome.runtime.Port, { transactionId }: RequestUnlockDotSubscribeMintedData) {
    const cb = createSubscription<'pri(campaign.unlockDot.subscribe)'>(id, port);

    const subscription = this.#koniState.mintCampaignService.unlockDotCampaign.subscribeMintedNft(transactionId, cb);

    this.createUnsubscriptionHandle(id, subscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.#koniState.mintCampaignService.unlockDotCampaign.getMintedNft(transactionId);
  }

  private async subscribeProcessingBanner (id: string, port: chrome.runtime.Port) {
    const cb = createSubscription<'pri(campaign.banner.subscribe)'>(id, port);

    const filterBanner = (data: CampaignData[]) => {
      const result: CampaignBanner[] = [];

      for (const item of data) {
        if (item.type === CampaignDataType.BANNER) {
          result.push(item);
        }
      }

      return result;
    };

    const callback = (data: CampaignData[]) => {
      cb(filterBanner(data));
    };

    const subscription = this.#koniState.campaignService.subscribeProcessingCampaign().subscribe({
      next: callback
    });

    this.createUnsubscriptionHandle(id, subscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return filterBanner(await this.#koniState.campaignService.getProcessingCampaign());
  }

  private async completeCampaignBanner ({ slug }: RequestCampaignBannerComplete) {
    const campaign = await this.#koniState.dbService.getCampaign(slug);

    if (campaign) {
      await this.#koniState.dbService.upsertCampaign({
        ...campaign,
        isDone: true
      });
    }

    return true;
  }

  private async subscribeCampaignPopupVisibility (id: string, port: chrome.runtime.Port) {
    const cb = createSubscription<'pri(campaign.popup.subscribeVisibility)'>(id, port);

    const popupVisibilitySubscription = this.#koniState.campaignService.subscribeCampaignPopupVisibility().subscribe((rs) => {
      cb(rs);
    });

    this.createUnsubscriptionHandle(id, popupVisibilitySubscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return Promise.resolve(this.#koniState.campaignService.getIsPopupVisible());
  }

  private toggleCampaignPopup (value: ShowCampaignPopupRequest) {
    this.#koniState.campaignService.toggleCampaignPopup(value);

    return null;
  }

  private subscribeAppPopupData (id: string, port: chrome.runtime.Port): AppPopupData[] {
    const cb = createSubscription<'pri(campaign.popups.subscribe)'>(id, port);
    let ready = false;

    const callback = (rs: AppPopupData[]) => {
      if (ready) {
        cb(rs);
      }
    };

    const subscription = this.#koniState.mktCampaignService.subscribePopupsData(callback);

    this.createUnsubscriptionHandle(id, subscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });
    ready = true;

    return this.#koniState.mktCampaignService.getAppPopupsData();
  }

  private subscribeAppBannerData (id: string, port: chrome.runtime.Port): AppBannerData[] {
    const cb = createSubscription<'pri(campaign.banners.subscribe)'>(id, port);
    let ready = false;

    const callback = (rs: AppBannerData[]) => {
      if (ready) {
        cb(rs);
      }
    };

    const subscription = this.#koniState.mktCampaignService.subscribeBannersData(callback);

    this.createUnsubscriptionHandle(id, subscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });
    ready = true;

    return this.#koniState.mktCampaignService.getAppBannersData();
  }

  private subscribeAppConfirmationData (id: string, port: chrome.runtime.Port): AppConfirmationData[] {
    const cb = createSubscription<'pri(campaign.confirmations.subscribe)'>(id, port);
    let ready = false;

    const callback = (rs: AppConfirmationData[]) => {
      if (ready) {
        cb(rs);
      }
    };

    const subscription = this.#koniState.mktCampaignService.subscribeConfirmationsData(callback);

    this.createUnsubscriptionHandle(id, subscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });
    ready = true;

    return this.#koniState.mktCampaignService.getAppConfirmationsData();
  }

  /* Campaign */

  /* Buy service */

  private async subscribeBuyTokens (id: string, port: chrome.runtime.Port): Promise<Record<string, BuyTokenInfo>> {
    const cb = createSubscription<'pri(buyService.tokens.subscribe)'>(id, port);
    let ready = false;

    const callback = (rs: Record<string, BuyTokenInfo>) => {
      if (ready) {
        cb(rs);
      }
    };

    const subscription = this.#koniState.buyService.subscribeBuyTokens(callback);

    this.createUnsubscriptionHandle(id, subscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    await this.#koniState.eventService.waitBuyTokenReady;
    ready = true;

    return this.#koniState.buyService.getBuyTokens();
  }

  private async subscribeBuyServices (id: string, port: chrome.runtime.Port): Promise<Record<string, BuyServiceInfo>> {
    const cb = createSubscription<'pri(buyService.services.subscribe)'>(id, port);
    let ready = false;

    const callback = (rs: Record<string, BuyServiceInfo>) => {
      if (ready) {
        cb(rs);
      }
    };

    const subscription = this.#koniState.buyService.subscribeBuyServices(callback);

    this.createUnsubscriptionHandle(id, subscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    await this.#koniState.eventService.waitBuyServiceReady;
    ready = true;

    return this.#koniState.buyService.getBuyServices();
  }

  /* Buy service */

  /* Swap service */
  private async subscribeSwapPairs (id: string, port: chrome.runtime.Port): Promise<SwapPair[]> {
    const cb = createSubscription<'pri(swapService.subscribePairs)'>(id, port);
    let ready = false;

    await this.#koniState.swapService.waitForStarted();

    const callback = (rs: SwapPair[]) => {
      if (ready) {
        cb(rs);
      }
    };

    const subscription = this.#koniState.swapService.subscribeSwapPairs(callback);

    this.createUnsubscriptionHandle(id, subscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    ready = true;

    return this.#koniState.swapService.getSwapPairs();
  }

  private async handleSwapRequest (request: SwapRequest): Promise<SwapRequestResult> {
    return this.#koniState.swapService.handleSwapRequest(request);
  }

  private async getLatestSwapQuote (swapRequest: SwapRequest): Promise<SwapQuoteResponse> {
    return this.#koniState.swapService.getLatestQuotes(swapRequest);
  }

  private async validateSwapProcess (params: ValidateSwapProcessParams): Promise<TransactionError[]> {
    return this.#koniState.swapService.validateSwapProcess(params);
  }

  private async handleSwapStep (inputData: SwapSubmitParams): Promise<SWTransactionResponse> {
    const { address, process, quote, recipient } = inputData;

    if (!quote || !address || !process) {
      return this.#koniState.transactionService
        .generateBeforeHandleResponseErrors([new TransactionError(BasicTxErrorType.INTERNAL_ERROR)]);
    }

    const isLastStep = inputData.currentStep + 1 === process.steps.length;

    const swapValidations: TransactionError[] = await this.#koniState.swapService.validateSwapProcess({ address, process, selectedQuote: quote, recipient });

    if (swapValidations.length > 0) {
      return this.#koniState.transactionService
        .generateBeforeHandleResponseErrors(swapValidations);
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const { chainType, extrinsic, extrinsicType, transferNativeAmount, txChain, txData } = await this.#koniState.swapService.handleSwapProcess(inputData);
    // const chosenFeeToken = process.steps.findIndex((step) => step.type === SwapStepType.SET_FEE_TOKEN) > -1;
    // const allowSkipValidation = [ExtrinsicType.SET_FEE_TOKEN, ExtrinsicType.SWAP].includes(extrinsicType);

    return await this.#koniState.transactionService.handleTransaction({
      address,
      chain: txChain,
      transaction: extrinsic,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data: txData,
      extrinsicType, // change this depends on step
      chainType,
      resolveOnDone: !isLastStep,
      transferNativeAmount
      // skipFeeValidation: chosenFeeToken && allowSkipValidation
    });
  }
  /* Swap service */

  /* Ledger */

  private async subscribeLedgerGenericAllowChains (id: string, port: chrome.runtime.Port): Promise<string[]> {
    const cb = createSubscription<'pri(ledger.generic.allow)'>(id, port);

    await this.#koniState.eventService.waitLedgerReady;

    const subscription = this.#koniState.chainService.observable.ledgerGenericAllowChains.subscribe(cb);

    this.createUnsubscriptionHandle(id, subscription.unsubscribe);

    port.onDisconnect.addListener((): void => {
      this.cancelSubscription(id);
    });

    return this.#koniState.chainService.value.ledgerGenericAllowChains;
  }

  /* Ledger */

  // --------------------------------------------------------------
  // eslint-disable-next-line @typescript-eslint/require-await
  public async handle<TMessageType extends MessageTypes> (id: string, type: TMessageType, request: RequestTypes[TMessageType], port: chrome.runtime.Port): Promise<ResponseType<TMessageType>> {
    clearTimeout(this.#lockTimeOut);

    if (this.#timeAutoLock > 0) {
      this.#lockTimeOut = setTimeout(() => {
        if (!this.#skipAutoLock) {
          this.keyringLock();
        }
      }, this.#timeAutoLock * 60 * 1000);
    }

    switch (type) {
      case 'pri(ping)':
        return 'pong';
      /// Clone from PolkadotJs
      case 'pri(accounts.create.external)':
        return this.accountsCreateExternal(request as RequestAccountCreateExternal);

      case 'pri(accounts.create.hardware)':
        return this.accountsCreateHardware(request as RequestAccountCreateHardware);

      case 'pri(accounts.create.suri)':
        return this.accountsCreateSuri(request as RequestAccountCreateSuri);

      case 'pri(accounts.changePassword)':
        return this.accountsChangePassword(request as RequestAccountChangePassword);

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
        return this.windowOpen(request as WindowOpenParams);

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
      case 'pri(settings.changeBalancesVisibility)':
        return await this.toggleBalancesVisibility();

      // Settings
      case 'pri(settings.subscribe)':
        return await this.subscribeSettings(id, port);
      case 'pri(settings.saveAccountAllLogo)':
        return this.saveAccountAllLogo(request as string, id, port);
      case 'pri(settings.saveCamera)':
        return this.setCamera(request as RequestCameraSettings);
      case 'pri(settings.saveTheme)':
        return this.saveTheme(request as ThemeNames);
      case 'pri(settings.saveBrowserConfirmationType)':
        return this.saveBrowserConfirmationType(request as BrowserConfirmationType);
      case 'pri(settings.saveAutoLockTime)':
        return this.setAutoLockTime(request as RequestChangeTimeAutoLock);
      case 'pri(settings.saveUnlockType)':
        return this.setUnlockType(request as RequestUnlockType);
      case 'pri(settings.saveEnableChainPatrol)':
        return this.setEnableChainPatrol(request as RequestChangeEnableChainPatrol);
      case 'pri(settings.saveShowZeroBalance)':
        return this.setShowZeroBalance(request as RequestChangeShowZeroBalance);
      case 'pri(settings.saveLanguage)':
        return this.setLanguage(request as RequestChangeLanguage);
      case 'pri(settings.saveShowBalance)':
        return this.setShowBalance(request as RequestChangeShowBalance);

      case 'pri(price.getPrice)':
        return await this.getPrice();
      case 'pri(price.getSubscription)':
        return await this.subscribePrice(id, port);
      case 'pri(settings.savePriceCurrency)':
        return await this.setPriceCurrency(request as RequestChangePriceCurrency);
      case 'pri(balance.getBalance)':
        return await this.getBalance();
      case 'pri(balance.getSubscription)':
        return await this.subscribeBalance(id, port);
      case 'pri(crowdloan.getCrowdloan)':
        return this.getCrowdloan();
      case 'pri(crowdloan.getCrowdloanContributions)':
        return this.getCrowdloanContributions(request as RequestCrowdloanContributions);
      case 'pri(crowdloan.getSubscription)':
        return this.subscribeCrowdloan(id, port);
      case 'pri(derivation.createV2)':
        return this.derivationCreateV2(request as RequestDeriveCreateV2);
      case 'pri(accounts.batchExportV2)':
        return this.batchExportV2(request as RequestAccountBatchExportV2);
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
      case 'pri(transaction.history.subscribe)':
        return this.subscribeHistoryByChainAndAddress(request as RequestSubscribeHistory, id, port);

        /* Earning */

        /* Info */

      case 'pri(yield.subscribePoolInfo)':
        return this.subscribeYieldPoolInfo(id, port);
      case 'pri(yield.getTargets)':
        return this.getYieldPoolTargets(request as RequestGetYieldPoolTargets);
      case 'pri(yield.subscribeYieldPosition)':
        return this.subscribeYieldPosition(id, port);
      case 'pri(yield.subscribeYieldReward)':
        return this.subscribeYieldReward(id, port);
      case 'pri(yield.subscribeRewardHistory)':
        return this.subscribeYieldRewardHistory(id, port);
      case 'pri(yield.minAmountPercent)':
        return this.subscribeEarningMinAmountPercent(id, port);

        /* Info */

        /* Actions */

        /* Join */

      case 'pri(yield.join.earlyValidate)':
        return await this.earlyValidateJoin(request as RequestEarlyValidateYield);
      case 'pri(yield.join.getOptimalPath)':
        return await this.getOptimalYieldPath(request as OptimalYieldPathParams);
      case 'pri(yield.join.handleStep)':
        return await this.handleYieldStep(request as RequestYieldStepSubmit);
      case 'pri(yield.join.validateProcess)':
        return await this.handleValidateYieldProcess(request as ValidateYieldProcessParams);

        /* Join */

        /* Others */

      case 'pri(yield.leave.submit)':
        return await this.handleYieldLeave(request as RequestYieldLeave);
      case 'pri(yield.withdraw.submit)':
        return await this.yieldSubmitWithdrawal(request as RequestYieldWithdrawal);
      case 'pri(yield.cancelWithdrawal.submit)':
        return await this.yieldSubmitCancelWithdrawal(request as RequestStakeCancelWithdrawal);
      case 'pri(yield.claimReward.submit)':
        return await this.yieldSubmitClaimReward(request as RequestStakeClaimReward);

        /* Others */

        /* Actions */

        /* Earning */

      /* Account management */
      // Add account
      case 'pri(accounts.create.suriV2)':
        return await this.accountsCreateSuriV2(request as RequestAccountCreateSuriV2);
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

      // Remove account
      case 'pri(accounts.forget)':
        return await this.accountsForgetOverride(request as RequestAccountForget);

      // Validate account
      case 'pri(seed.validateV2)':
        return this.seedValidateV2(request as RequestSeedValidateV2);
      case 'pri(privateKey.validateV2)':
        return this.metamaskPrivateKeyValidateV2(request as RequestSeedValidateV2);
      case 'pri(accounts.checkPublicAndSecretKey)':
        return this.checkPublicAndSecretKey(request as RequestCheckPublicAndSecretKey);

      // Export account
      case 'pri(accounts.exportPrivateKey)':
        return this.accountExportPrivateKey(request as RequestAccountExportPrivateKey);

      // Subscribe account
      case 'pri(accounts.subscribeWithCurrentAddress)':
        return await this.accountsGetAllWithCurrentAddress(id, port);
      case 'pri(accounts.subscribeAccountsInputAddress)':
        return this.accountsGetAll(id, port);

      // Save current account
      case 'pri(currentAccount.saveAddress)':
        return await this.saveCurrentAccountAddress(request as RequestCurrentAccountAddress);
      case 'pri(accounts.updateCurrentAddress)':
        return this.updateCurrentAccountAddress(request as string);

      // Edit account
      case 'pri(accounts.edit)':
        return this.accountsEdit(request as RequestAccountEdit);

      // Save contact address
      case 'pri(accounts.saveRecent)':
        return this.saveRecentAccount(request as RequestSaveRecentAccount);
      case 'pri(accounts.editContact)':
        return this.editContactAccount(request as RequestEditContactAccount);
      case 'pri(accounts.deleteContact)':
        return this.deleteContactAccount(request as RequestDeleteContactAccount);

      // Subscribe address
      case 'pri(accounts.subscribeAddresses)':
        return this.subscribeAddresses(id, port);

      case 'pri(accounts.resolveDomainToAddress)':
        return await this.resolveDomainByAddress(request as ResolveDomainRequest);
      case 'pri(accounts.resolveAddressToDomain)':
        return await this.resolveAddressByDomain(request as ResolveAddressToDomainRequest);

      // Inject account
      case 'pri(accounts.inject.add)':
        return this.addInjects(request as RequestAddInjectedAccounts);
      case 'pri(accounts.inject.remove)':
        return this.removeInjects(request as RequestRemoveInjectedAccounts);

        /* Account management */

      // ChainService
      case 'pri(chainService.subscribeChainInfoMap)':
        return this.subscribeChainInfoMap(id, port);
      case 'pri(chainService.subscribeChainStateMap)':
        return this.subscribeChainStateMap(id, port);
      case 'pri(chainService.subscribeChainStatusMap)':
        return this.subscribeChainStatusMap(id, port);
      case 'pri(chainService.subscribeXcmRefMap)':
        return this.subscribeXcmRefMap(id, port);
      case 'pri(chainService.getSupportedContractTypes)':
        return this.getSupportedSmartContractTypes();
      case 'pri(chainService.enableChain)':
        return await this.enableChain(request as EnableChainParams);
      case 'pri(chainService.reconnectChain)':
        return await this.reconnectChain(request as string);
      case 'pri(chainService.disableChain)':
        return await this.disableChain(request as string);
      case 'pri(chainService.removeChain)':
        return this.removeCustomChain(request as string);
      case 'pri(chainService.validateCustomChain)':
        return await this.validateNetwork(request as ValidateNetworkRequest);
      case 'pri(chainService.upsertChain)':
        return await this.upsertChain(request as _NetworkUpsertParams);
      case 'pri(chainService.resetDefaultChains)':
        return this.resetDefaultNetwork();
      case 'pri(chainService.enableChains)':
        return await this.enableChains(request as EnableMultiChainParams);
      case 'pri(chainService.subscribeAssetRegistry)':
        return this.subscribeAssetRegistry(id, port);
      case 'pri(chainService.subscribeMultiChainAssetMap)':
        return this.subscribeMultiChainAssetMap(id, port);
      case 'pri(chainService.upsertCustomAsset)':
        return await this.upsertCustomToken(request as _ChainAsset);
      case 'pri(chainService.deleteCustomAsset)':
        return this.deleteCustomAsset(request as string);
      case 'pri(chainService.validateCustomAsset)':
        return await this.validateCustomAsset(request as _ValidateCustomAssetRequest);
      case 'pri(assetSetting.getSubscription)':
        return this.subscribeAssetSetting(id, port);
      case 'pri(assetSetting.update)':
        return await this.updateAssetSetting(request as AssetSettingUpdateReq);

      case 'pri(transfer.getMaxTransferable)':
        return this.getMaxTransferable(request as RequestMaxTransferable);
      case 'pri(transfer.subscribeMaxTransferable)':
        return this.getMaxTransferable(request as RequestMaxTransferable);
      case 'pri(freeBalance.get)':
        return this.getAddressTransferableBalance(request as RequestFreeBalance);
      case 'pri(freeBalance.subscribe)':
        return this.subscribeAddressTransferableBalance(request as RequestFreeBalance, id, port);
      case 'pri(subscription.cancel)':
        return this.cancelSubscription(request as string);
      case 'pri(chainService.recoverSubstrateApi)':
        return this.recoverDotSamaApi(request as string);

      case 'pri(accounts.get.meta)':
        return this.getAccountMeta(request as RequestAccountMeta);

      /// Send NFT
      case 'pri(evmNft.submitTransaction)':
        return this.evmNftSubmitTransaction(request as NftTransactionRequest);
      case 'pri(substrateNft.submitTransaction)':
        return this.substrateNftSubmitTransaction(request as RequestSubstrateNftSubmitTransaction);

      /// Transfer
      case 'pri(accounts.transfer)':
        return await this.makeTransfer(request as RequestTransfer);
      case 'pri(accounts.crossChainTransfer)':
        return await this.makeCrossChainTransfer(request as RequestCrossChainTransfer);
      case 'pri(accounts.getOptimalTransferProcess)':
        return await this.getOptimalTransferProcess(request as RequestOptimalTransferProcess);
      case 'pri(accounts.approveSpending)':
        return await this.approveSpending(request as TokenSpendingApprovalParams);

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
      case 'pri(staking.submitClaimReward)':
        return await this.submitStakeClaimReward(request as RequestStakeClaimReward);
      case 'pri(staking.submitCancelWithdrawal)':
        return await this.submitCancelStakeWithdrawal(request as RequestStakeCancelWithdrawal);
      case 'pri(staking.submitTuringCompound)':
        return await this.submitTuringStakeCompounding(request as RequestTuringStakeCompound);
      case 'pri(staking.submitTuringCancelCompound)':
        return await this.submitTuringCancelStakeCompound(request as RequestTuringCancelStakeCompound);
      case 'pri(bonding.nominationPool.submitBonding)':
        return await this.submitPoolBonding(request as RequestStakePoolingBonding);
      case 'pri(bonding.nominationPool.submitUnbonding)':
        return await this.submitPoolingUnbonding(request as RequestStakePoolingUnbonding);

      // EVM Transaction
      case 'pri(evm.transaction.parse.input)':
        return await this.parseContractInput(request as RequestParseEvmContractInput);

      // Auth Url subscribe
      case 'pri(authorize.subscribe)':
        return await this.subscribeAuthUrls(id, port);

      // Phishing page
      case 'pri(phishing.pass)':
        return await this.passPhishingPage(request as RequestPassPhishingPage);

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
      case 'pri(keyring.reset)':
        return await this.resetWallet(request as RequestResetWallet);

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

      case 'pri(cron.reload)':
        return await this.reloadCron(request as CronReloadRequest);

      case 'pri(settings.getLogoMaps)':
        return await this.getLogoMap();
      case 'pri(settings.logo.assets.subscribe)':
        return this.subscribeAssetLogoMap(id, port);
      case 'pri(settings.logo.chains.subscribe)':
        return this.subscribeChainLogoMap(id, port);

      /// Wallet Connect
      case 'pri(walletConnect.connect)':
        return this.connectWalletConnect(request as RequestConnectWalletConnect);
      case 'pri(walletConnect.requests.connect.subscribe)':
        return this.connectWCSubscribe(id, port);
      case 'pri(walletConnect.session.approve)':
        return this.approveWalletConnectSession(request as RequestApproveConnectWalletSession);
      case 'pri(walletConnect.session.reject)':
        return this.rejectWalletConnectSession(request as RequestRejectConnectWalletSession);
      case 'pri(walletConnect.session.subscribe)':
        return this.subscribeWalletConnectSessions(id, port);
      case 'pri(walletConnect.session.disconnect)':
        return this.disconnectWalletConnectSession(request as RequestDisconnectWalletConnectSession);

      // Not support
      case 'pri(walletConnect.requests.notSupport.subscribe)':
        return this.WCNotSupportSubscribe(id, port);
      case 'pri(walletConnect.notSupport.approve)':
        return this.approveWalletConnectNotSupport(request as RequestApproveWalletConnectNotSupport);
      case 'pri(walletConnect.notSupport.reject)':
        return this.rejectWalletConnectNotSupport(request as RequestRejectWalletConnectNotSupport);

      // Manta
      case 'pri(mantaPay.enable)':
        return await this.enableMantaPay(request as MantaPayEnableParams);
      case 'pri(mantaPay.initSyncMantaPay)':
        return await this.initSyncMantaPay(request as string);
      case 'pri(mantaPay.subscribeConfig)':
        return await this.subscribeMantaPayConfig(id, port);
      case 'pri(mantaPay.disable)':
        return await this.disableMantaPay(request as string);
      case 'pri(mantaPay.subscribeSyncingState)':
        return this.subscribeMantaPaySyncState(id, port);

        /* Campaign */

      case 'pri(campaign.unlockDot.canMint)':
        return this.unlockDotCheckCanMint(request as RequestUnlockDotCheckCanMint);
      case 'pri(campaign.unlockDot.subscribe)':
        return this.unlockDotSubscribeMintedData(id, port, request as RequestUnlockDotSubscribeMintedData);
      case 'pri(campaign.popup.subscribeVisibility)':
        return this.subscribeCampaignPopupVisibility(id, port);
      case 'pri(campaign.popup.toggle)':
        return this.toggleCampaignPopup(request as ShowCampaignPopupRequest);
      case 'pri(campaign.popups.subscribe)':
        return this.subscribeAppPopupData(id, port);
      case 'pri(campaign.banners.subscribe)':
        return this.subscribeAppBannerData(id, port);
      case 'pri(campaign.confirmations.subscribe)':
        return this.subscribeAppConfirmationData(id, port);

        /* Campaign */

      // Metadata
      case 'pri(metadata.find)':
        return this.findRawMetadata(request as RequestFindRawMetadata);
      case 'pri(metadata.hash)':
        return this.calculateMetadataHash(request as RequestMetadataHash);
      case 'pri(metadata.transaction.shorten)':
        return this.shortenMetadata(request as RequestShortenMetadata);

      /* Campaign */
      case 'pri(campaign.banner.subscribe)':
        return this.subscribeProcessingBanner(id, port);
      case 'pri(campaign.banner.complete)':
        return this.completeCampaignBanner(request as RequestCampaignBannerComplete);
        /* Campaign */

        /* Buy service */
      case 'pri(buyService.tokens.subscribe)':
        return this.subscribeBuyTokens(id, port);
      case 'pri(buyService.services.subscribe)':
        return this.subscribeBuyServices(id, port);
        /* Buy service */

        /* Database */
      case 'pri(database.export)':
        return this.#koniState.dbService.exportDB();
      case 'pri(database.import)':
        return this.#koniState.dbService.importDB(request as string);
      case 'pri(database.exportJson)':
        return this.#koniState.dbService.getExportJson();
      case 'pri(database.migrateLocalStorage)':
        return this.#koniState.migrateMV3LocalStorage(request as string);
      case 'pri(database.setLocalStorage)':
        return this.#koniState.setStorageFromWS(request as StorageDataInterface);
        /* Database */

        /* Swap service */
      case 'pri(swapService.subscribePairs)':
        return this.subscribeSwapPairs(id, port);
      case 'pri(swapService.handleSwapRequest)':
        return this.handleSwapRequest(request as SwapRequest);
      case 'pri(swapService.getLatestQuote)':
        return this.getLatestSwapQuote(request as SwapRequest);
      case 'pri(swapService.validateSwapProcess)':
        return this.validateSwapProcess(request as ValidateSwapProcessParams);
      case 'pri(swapService.handleSwapStep)':
        return this.handleSwapStep(request as SwapSubmitParams);
        /* Swap service */

        /* Ledger */
      case 'pri(ledger.generic.allow)':
        return this.subscribeLedgerGenericAllowChains(id, port);
        /* Ledger */
      // Default
      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }
}
