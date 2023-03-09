// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _AssetType, _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { AuthUrls, Resolver } from '@subwallet/extension-base/background/handlers/State';
import { AccountAuthType, AccountJson, AuthorizeRequest, ConfirmationRequestBase, RequestAccountList, RequestAccountSubscribe, RequestAuthorizeCancel, RequestAuthorizeReject, RequestAuthorizeSubscribe, RequestAuthorizeTab, RequestCurrentAccountAddress, ResponseAuthorizeList, ResponseJsonGetAccountInfo, SeedLengths } from '@subwallet/extension-base/background/types';
import { _CHAIN_VALIDATION_ERROR } from '@subwallet/extension-base/services/chain-service/handler/types';
import { _ChainState, _EvmApi, _NetworkUpsertParams, _SubstrateApi, _ValidateCustomAssetRequest, _ValidateCustomAssetResponse } from '@subwallet/extension-base/services/chain-service/types';
import { InjectedAccount, MetadataDefBase } from '@subwallet/extension-inject/types';
import { KeyringPair$Json, KeyringPair$Meta } from '@subwallet/keyring/types';
import { SingleAddress } from '@subwallet/ui-keyring/observable/types';
import { KeyringOptions } from '@subwallet/ui-keyring/options/types';
import { KeyringPairs$Json } from '@subwallet/ui-keyring/types';
import Web3 from 'web3';
import { RequestArguments, TransactionConfig } from 'web3-core';
import { JsonRpcPayload, JsonRpcResponse } from 'web3-core-helpers';

import { SignerResult } from '@polkadot/types/types/extrinsic';
import { BN } from '@polkadot/util';
import { KeypairType } from '@polkadot/util-crypto/types';

import { TransactionWarning } from './warnings/TransactionWarning';

export interface ServiceInfo {
  chainInfoMap: Record<string, _ChainInfo>;
  chainStateMap: Record<string, _ChainState>;
  chainApiMap: ApiMap;
  currentAccountInfo: CurrentAccountInfo;
  assetRegistry: Record<string, _ChainAsset>;
}

export interface AssetSetting {
  visible: boolean,
  // restrictions on assets can be implemented later
}

/// Request Auth

export interface AuthRequestV2 extends Resolver<ResultResolver> {
  id: string;
  idStr: string;
  request: RequestAuthorizeTab;
  url: string;
  accountAuthType: AccountAuthType
}

/// Manage Auth

// Get Auth

export interface RequestAuthorizeApproveV2 {
  id: string;
  accounts: string[];
}

// Auth All site

export interface RequestAuthorizationAll {
  connectValue: boolean;
}

// Manage site auth (all allowed/unAllowed)

export interface RequestAuthorization extends RequestAuthorizationAll {
  url: string;
}

// Manage single auth with single account

export interface RequestAuthorizationPerAccount extends RequestAuthorization {
  address: string;
}

// Manage single site with multi account

export interface RequestAuthorizationPerSite {
  id: string;
  values: Record<string, boolean>;
}

// Manage site block

export interface RequestAuthorizationBlock {
  id: string;
  connectedValue: boolean;
}

// Forget site auth

export interface RequestForgetSite {
  url: string;
}

export interface ResultResolver {
  result: boolean;
  accounts: string[];
}

export interface RejectResolver {
  error: Error;
  accounts: string[];
}

/// Staking subscribe

export enum StakingType {
  NOMINATED = 'nominated',
  POOLED = 'pooled',
}

export interface StakingRewardItem {
  state: APIItemState
  name: string,
  chain: string,
  address: string,
  type: StakingType,

  latestReward?: string,
  totalReward?: string,
  totalSlash?: string,
  unclaimedReward?: string
}
export interface UnlockingStakeInfo {
  chain: string,
  address: string,
  type: StakingType,

  nextWithdrawal: number,
  redeemable: number,
  nextWithdrawalAmount: number,
  nextWithdrawalAction?: string,
  validatorAddress?: string // validator to unstake from
}

export interface StakingItem {
  name: string,
  chain: string,
  address: string,
  type: StakingType,

  balance?: string,
  activeBalance?: string,
  unlockingBalance?: string,
  nativeToken: string,
  unit?: string,

  state: APIItemState,

  unlockingInfo?: UnlockingStakeInfo,
  rewardInfo?: StakingRewardItem
}

export interface StakingJson {
  reset?: boolean,
  ready?: boolean,
  details: StakingItem[]
}

export interface StakingRewardJson {
  ready: boolean;
  slowInterval: Array<StakingRewardItem>;
  fastInterval: Array<StakingRewardItem>;
}

export interface StakeUnlockingJson {
  timestamp: number,
  details: UnlockingStakeInfo[]
}

export interface PriceJson {
  ready?: boolean,
  currency: string,
  priceMap: Record<string, number>,
  price24hMap: Record<string, number>
}

export enum APIItemState {
  PENDING = 'pending',
  READY = 'ready',
  CACHED = 'cached',
  ERROR = 'error',
  NOT_SUPPORT = 'not_support'
}

export enum RMRK_VER {
  VER_1 = '1.0.0',
  VER_2 = '2.0.0'
}

export enum CrowdloanParaState {
  ONGOING = 'ongoing',
  COMPLETED = 'completed',
  FAILED = 'failed'
}

export interface NftTransferExtra {
  cronUpdate: boolean;
  forceUpdate: boolean;
  selectedNftCollection?: NftCollection; // for rendering
  nftItems?: NftItem[]; // for rendering, remaining nfts
}

export interface NftItem {
  // must-have
  id: string;
  chain: string;
  collectionId: string;
  originAsset?: string;

  name?: string;
  image?: string;
  externalUrl?: string;
  rarity?: string;
  description?: string;
  properties?: Record<any, any> | null;
  type?: _AssetType.ERC721 | _AssetType.PSP34 | RMRK_VER; // for sending
  rmrk_ver?: RMRK_VER;
  owner: string;
  onChainOption?: any; // for sending PSP-34 tokens, should be done better
}

export interface NftCollection {
  // must-have
  collectionId: string;
  chain: string;
  originAsset?: string;

  collectionName?: string;
  image?: string;
  itemCount?: number;
  externalUrl?: string;
}

export interface NftJson {
  total: number;
  nftList: Array<NftItem>;
}

export interface NftCollectionJson {
  ready: boolean;
  nftCollectionList: Array<NftCollection>;
}

// export interface NftStoreJson {
//   nftList: Array<NftItem>;
//   nftCollectionList: Array<NftCollection>;
// }

export interface TokenBalanceRaw {
  reserved: BN,
  frozen: BN,
  free: BN
}

export interface SubstrateBalance {
  reserved?: string,
  miscFrozen?: string,
  feeFrozen?: string
}

export interface BalanceItem {
  // metadata
  tokenSlug: string,
  state: APIItemState,
  timestamp?: number

  // must-have, total = free + locked
  free: string,
  locked: string,

  // substrate fields
  substrateInfo?: SubstrateBalance
}

export interface BalanceJson {
  reset?: boolean,
  details: Record<string, BalanceItem>
}

export interface CrowdloanItem {
  state: APIItemState,
  paraState?: CrowdloanParaState,
  contribute: string
}

export interface CrowdloanJson {
  reset?: boolean,
  details: Record<string, CrowdloanItem>
}

export type NetWorkGroup = 'RELAY_CHAIN' | 'POLKADOT_PARACHAIN' | 'KUSAMA_PARACHAIN' | 'MAIN_NET' | 'TEST_NET' | 'UNKNOWN';

export enum ContractType {
  wasm = 'wasm',
  evm = 'evm'
}

export interface NetworkJson {
  // General Information
  key: string; // Key of network in NetworkMap
  chain: string; // Name of the network
  icon?: string; // Icon name, available with known network
  active: boolean; // Network is active or not

  // Provider Information
  providers: Record<string, string>; // Predefined provider map
  currentProvider: string | null; // Current provider key
  currentProviderMode: 'http' | 'ws'; // Current provider mode, compute depend on provider protocol. the feature need to know this to decide use subscribe or cronjob to use this features.
  customProviders?: Record<string, string>; // Custom provider map, provider name same with provider map
  nftProvider?: string;

  // Metadata get after connect to provider
  genesisHash: string; // identifier for network
  groups: NetWorkGroup[];
  ss58Format: number;
  paraId?: number;
  chainType?: 'substrate' | 'ethereum';
  crowdloanUrl?: string;

  // Ethereum related information for predefined network only
  isEthereum?: boolean; // Only show network with isEthereum=true when select one EVM account // user input
  evmChainId?: number;

  isHybrid?: boolean;

  // Native token information
  nativeToken?: string;
  decimals?: number;

  // Other information
  coinGeckoKey?: string; // Provider key to get token price from CoinGecko // user input
  blockExplorer?: string; // Link to block scanner to check transaction with extrinsic hash // user input
  abiExplorer?: string; // Link to block scanner to check transaction with extrinsic hash // user input
  dependencies?: string[]; // Auto active network in dependencies if current network is activated
  getStakingOnChain?: boolean; // support get bonded on chain
  supportBonding?: boolean;
  supportSmartContract?: ContractType[]; // if network supports PSP smart contracts

  apiStatus?: NETWORK_STATUS;
  requestId?: string;
}

export interface DonateInfo {
  key: string;
  name: string;
  value: string;
  icon: string;
  link: string;
}

export interface DropdownTransformOptionType {
  label: string;
  value: string;
}

export interface NetWorkMetadataDef extends MetadataDefBase {
  networkKey: string;
  groups: NetWorkGroup[];
  isEthereum: boolean;
  paraId?: number;
  isAvailable: boolean;
  active: boolean;
  apiStatus: NETWORK_STATUS;
}

export type CurrentNetworkInfo = {
  networkKey: string;
  networkPrefix: number;
  icon: string;
  genesisHash: string;
  isEthereum: boolean;
  isReady?: boolean; // check if current network info is lifted from initial state
}

// all Accounts and the address of the current Account
export interface AccountsWithCurrentAddress {
  accounts: AccountJson[];
  currentAddress?: string;
  currentGenesisHash?: string | null;
  isShowBalance?: boolean;
  allAccountLogo?: string;
}

export interface OptionInputAddress {
  options: KeyringOptions;
}

export interface CurrentAccountInfo {
  address: string;
  currentGenesisHash: string | null;
  allGenesisHash?: string;
}

export type LanguageType = 'en'
|'zh'
|'fr'
|'tr'
|'pl'
|'th'
|'ur';

export type LanguageOptionType = {
  text: string;
  value: LanguageType;
}

export type BrowserConfirmationType = 'extension'|'popup'|'window';

export interface UiSettings {
  // language: LanguageType,
  browserConfirmationType: BrowserConfirmationType,
  // isShowZeroBalance: boolean,
  isShowBalance: boolean;
  accountAllLogo: string;
  theme: ThemeNames;
}

export type RequestSettingsType = UiSettings;

export interface RandomTestRequest {
  start: number;
  end: number;
}

export enum TransactionDirection {
  SEND = 'send',
  RECEIVED = 'received'
}

export enum ChainType {
  EVM = 'evm',
  SUBSTRATE = 'substrate'
}

export enum ExtrinsicType {
  TRANSFER_BALANCE = 'transfer.balance',
  TRANSFER_TOKEN = 'transfer.token',
  TRANSFER_XCM = 'transfer.xcm',
  SEND_NFT = 'send_nft',
  CROWDLOAN = 'crowdloan',
  STAKING_STAKE = 'staking.stake',
  STAKING_UNSTAKE = 'staking.unstake',
  STAKING_BOND = 'staking.bond',
  STAKING_UNBOND = 'staking.unbond',
  STAKING_CLAIM_REWARD = 'staking.claim_reward',
  STAKING_WITHDRAW = 'staking.withdraw',
  STAKING_COMPOUNDING = 'staking.compounding',
  STAKING_CANCEL_COMPOUNDING = 'staking.cancel_compounding',
  EVM_EXECUTE = 'evm.smart_contract',
}

export enum ExtrinsicStatus {
  PENDING = 'pending',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  FAIL = 'fail',
  UNKNOWN = 'unknown'
}

export interface TxHistoryItem {
  time: number | string;
  networkKey: string;
  isSuccess: boolean;
  action: TransactionDirection;
  extrinsicHash: string;

  change?: string;
  changeSymbol?: string; // if undefined => main token
  fee?: string;
  feeSymbol?: string;
  // if undefined => main token, sometime "fee" uses different token than "change"
  // ex: sub token (DOT, AUSD, KSM, ...) of Acala, Karura uses main token to pay fee
  origin?: 'app' | 'network';
}

export interface TransactionHistoryItemJson {
  items: TxHistoryItem[],
  total: number
}

export interface AmountData {
  value: string,
  decimals: number,
  symbol: string
}

export interface XCMTransactionAdditionalInfo {
  destinationChain: string,
  fee: AmountData
}

export interface NFTTransactionAdditionalInfo {
  collectionName: string
}

export type TransactionAdditionalInfo<T extends ExtrinsicType> = T extends ExtrinsicType.TRANSFER_XCM
  ? XCMTransactionAdditionalInfo
  : T extends ExtrinsicType.SEND_NFT
    ? NFTTransactionAdditionalInfo
    : undefined;
export interface TransactionHistoryItem<ET extends ExtrinsicType = ExtrinsicType.TRANSFER_BALANCE> {
  origin?: string, // 'app' or history source
  callhash?: string,
  signature?: string,
  chain: string,
  chainType?: ChainType,
  chainName?: string,
  direction: TransactionDirection,
  type: ExtrinsicType,
  from: string,
  fromName?: string,
  to: string,
  toName?: string,
  address: string,
  status: ExtrinsicStatus,
  extrinsicHash: string,
  time: number,
  data?: string,
  blockNumber: number,
  blockHash: string,
  amount?: AmountData,
  tip?: AmountData,
  fee?: AmountData,
  explorerUrl?: string,

  additionalInfo?: TransactionAdditionalInfo<ET>
}

export interface SWError extends Error {
  code?: number;
  errorType: string;
  data?: unknown;
}

export interface SWWarning {
  errorType: string;
  code?: number;
  message: string;
  data?: unknown;
}

export enum BasicTxErrorType {
  NOT_ENOUGH_FEE = 'NOT_ENOUGH_FEE',
  NOT_ENOUGH_BALANCE = 'NOT_ENOUGH_BALANCE',
  CHAIN_DISCONNECTED = 'CHAIN_DISCONNECTED',
  INVALID_PARAMS = 'INVALID_PARAMS',
  DUPLICATE_TRANSACTION = 'DUPLICATE_TRANSACTION',
  UNABLE_TO_SIGN = 'UNABLE_TO_SIGN',
  USER_REJECT_REQUEST = 'USER_REJECT_REQUEST',
  UNABLE_TO_SEND = 'UNABLE_TO_SEND',
  SEND_TRANSACTION_FAILED = 'SEND_TRANSACTION_FAILED',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  UNSUPPORTED = 'UNSUPPORTED',
}

export enum StakingTxErrorType {
  STAKING_ERROR = 'stakingError',
  UN_STAKING_ERROR = 'unStakingError',
  WITHDRAW_STAKING_ERROR = 'withdrawStakingError',
  CLAIM_REWARD_ERROR = 'claimRewardError',
  CREATE_COMPOUND_ERROR = 'createCompoundError',
  CANCEL_COMPOUND_ERROR = 'cancelCompoundError',
}

export enum TransferTxErrorType {
  NOT_ENOUGH_VALUE = 'NOT_ENOUGH_VALUE',
  NOT_ENOUGH_FEE = 'NOT_ENOUGH_FEE',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TRANSFER_ERROR = 'TRANSFER_ERROR',
}

export type TransactionErrorType = BasicTxErrorType | TransferTxErrorType | StakingTxErrorType
export enum BasicTxWarningCode {
  NOT_ENOUGH_EXISTENTIAL_DEPOSIT = 'notEnoughExistentialDeposit'
}

export type BasicTxError = {
  errorType: TxErrorCode,
  data?: object,
  message: string
}

export type BasicTxWarning = {
  warningType: TransactionWarningType,
  data?: object,
  message: string
}

export interface TransactionResponse {
  extrinsicHash?: string;
  txError?: boolean;
  errors?: TransactionError[];
  status?: boolean;
  txResult?: TxResultType
  passwordError?: string | null;
}

export interface NftTransactionResponse extends TransactionResponse {
  isSendingSelf: boolean;
}

export type HandleBasicTx = (data: TransactionResponse) => void;

export type TxErrorCode = TransferTxErrorType | TransactionErrorType

export type TransactionWarningType = BasicTxWarningCode

export enum ProviderErrorType {
  CHAIN_DISCONNECTED = 'CHAIN_DISCONNECTED',
  INVALID_PARAMS = 'INVALID_PARAMS',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  USER_REJECT = 'USER_REJECT',
}

// Manage account
// Export private key

export interface RequestAccountExportPrivateKey {
  address: string;
  password: string;
}

export interface ResponseAccountExportPrivateKey {
  privateKey: string;
  publicKey: string;
}

// Get account info with private key

export interface RequestCheckPublicAndSecretKey {
  secretKey: string;
  publicKey: string;
}

export interface ResponseCheckPublicAndSecretKey {
  address: string;
  isValid: boolean;
  isEthereum: boolean;
}

// Create seed phase

export interface RequestSeedCreateV2 {
  length?: SeedLengths;
  seed?: string;
  types?: Array<KeypairType>;
}

export interface ResponseSeedCreateV2 {
  seed: string,
  addressMap: Record<KeypairType, string>
}

// Get account info with suri

export interface RequestSeedValidateV2 {
  suri: string;
  types?: Array<KeypairType>;
}

export type ResponseSeedValidateV2 = ResponseSeedCreateV2

// Create account with suri

export interface RequestAccountCreateSuriV2 {
  name: string;
  genesisHash?: string | null;
  password?: string;
  suri: string;
  types?: Array<KeypairType>;
  isAllowed: boolean;
}

export type ResponseAccountCreateSuriV2 = Record<KeypairType, string>

// Create derive account

export interface RequestDeriveCreateV2 {
  name: string;
  genesisHash?: string | null;
  suri: string;
  parentAddress: string;
  isAllowed: boolean;
}

export interface CreateDeriveAccountInfo {
  name: string;
  suri: string;
}

export interface RequestDeriveCreateV3 {
  address: string;
}

export interface RequestDeriveCreateMultiple {
  parentAddress: string;
  isAllowed: boolean;
  items: CreateDeriveAccountInfo[];
}

export interface DeriveAccountInfo {
  address: string;
  suri: string;
}

export interface RequestDeriveValidateV2 {
  suri: string;
  parentAddress: string;
}

export type ResponseDeriveValidateV2 = DeriveAccountInfo;
export interface RequestGetDeriveAccounts {
  page: number;
  limit: number;
  parentAddress: string;
}

export interface ResponseGetDeriveAccounts {
  result: DeriveAccountInfo[];
}

// Restore account with json file (single account)

export interface RequestJsonRestoreV2 {
  file: KeyringPair$Json;
  password: string;
  address: string;
  isAllowed: boolean;
  withMasterPassword: boolean;
}

// Restore account with json file (multi account)

export interface RequestBatchRestoreV2 {
  file: KeyringPairs$Json;
  password: string;
  accountsInfo: ResponseJsonGetAccountInfo[];
  isAllowed: boolean;
}

// Restore account with privateKey

export interface ResponsePrivateKeyValidateV2 {
  addressMap: Record<KeypairType, string>,
  autoAddPrefix: boolean
}

// External account

export enum AccountExternalErrorCode {
  INVALID_ADDRESS = 'invalidToAccount',
  KEYRING_ERROR = 'keyringError',
  UNKNOWN_ERROR = 'unknownError'
}

export interface AccountExternalError{
  code: AccountExternalErrorCode;
  message: string;
}

// Attach QR-signer account

export interface RequestAccountCreateExternalV2 {
  address: string;
  genesisHash?: string | null;
  name: string;
  isEthereum: boolean;
  isAllowed: boolean;
  isReadOnly: boolean;
}

// Attach Ledger account

export interface RequestAccountCreateHardwareV2 {
  accountIndex: number;
  address: string;
  addressOffset: number;
  genesisHash: string;
  hardwareType: string;
  name: string;
  isAllowed?: boolean;
}

// Restore account with public and secret key

export interface RequestAccountCreateWithSecretKey {
  publicKey: string;
  secretKey: string;
  name: string;
  isAllow: boolean;
  isEthereum: boolean;
}

export interface ResponseAccountCreateWithSecretKey {
  errors: AccountExternalError[];
  success: boolean;
}

/// Sign Transaction

/// Sign External Request

// Status

export enum ExternalRequestPromiseStatus {
  PENDING,
  REJECTED,
  FAILED,
  COMPLETED
}

// Structure

export interface ExternalRequestPromise {
  resolve?: (result: SignerResult | PromiseLike<SignerResult>) => void,
  reject?: (error?: Error) => void,
  status: ExternalRequestPromiseStatus,
  message?: string;
  createdAt: number
}

// Prepare to create

export interface PrepareExternalRequest {
  id: string;
  setState: (promise: ExternalRequestPromise) => void;
  updateState: (promise: Partial<ExternalRequestPromise>) => void;
}

// Reject

export interface RequestRejectExternalRequest {
  id: string;
  message?: string;
  throwError?: boolean;
}

export type ResponseRejectExternalRequest = void

// Resolve

export interface RequestResolveExternalRequest {
  id: string;
  data: SignerResult;
}

export type ResponseResolveExternalRequest = void

///

export type AccountRef = Array<string>
export type AccountRefMap = Record<string, AccountRef>

export type RequestPrice = null
export type RequestSubscribePrice = null
export type RequestBalance = null
export type RequestSubscribeBalance = null
export type RequestSubscribeBalancesVisibility = null
export type RequestCrowdloan = null
export type RequestSubscribeCrowdloan = null
export type RequestSubscribeNft = null
export type RequestSubscribeStaking = null
export type RequestSubscribeStakingReward = null
export enum ThemeNames {
  LIGHT = 'light',
  DARK = 'dark',
  SUBSPACE = 'subspace'
}

export type RequestNftForceUpdate = {
  collectionId: string,
  nft: NftItem,
  isSendingSelf: boolean,
  chain: string,
  senderAddress: string,
  recipientAddress: string
}

export enum NETWORK_ERROR {
  INVALID_INFO_TYPE = 'invalidInfoType',
  INJECT_SCRIPT_DETECTED = 'injectScriptDetected',
  EXISTED_NETWORK = 'existedNetwork',
  EXISTED_PROVIDER = 'existedProvider',
  INVALID_PROVIDER = 'invalidProvider',
  NONE = 'none',
  CONNECTION_FAILURE = 'connectionFailure',
  PROVIDER_NOT_SAME_NETWORK = 'providerNotSameNetwork'
}

export enum NETWORK_STATUS {
  CONNECTED = 'connected',
  CONNECTING = 'connecting',
  DISCONNECTED = 'disconnected',
  PENDING = 'pending'
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type BaseRequestSign = {};

// Internal request: request from extension, not dApp.
export type InternalRequestSign<T extends BaseRequestSign> = Omit<T, 'password'>;

export type TxResultType = {
  change: string;
  changeSymbol?: string;
  fee?: string;
  feeSymbol?: string;
}

export interface NftTransactionRequest {
  networkKey: string,
  senderAddress: string,
  recipientAddress: string,
  params: Record<string, any>
}

export interface EvmNftTransaction {
  tx: Record<string, any> | null,
  estimatedFee: string | null,
  balanceError: boolean
}

export interface EvmNftSubmitTransaction extends BaseRequestSign {
  senderAddress: string,
  recipientAddress: string,
  networkKey: string,
  rawTransaction: Record<string, any>
}

export interface ValidateNetworkResponse {
  // validation state
  success: boolean,
  error?: _CHAIN_VALIDATION_ERROR,
  conflictChain?: string,
  conflictKey?: string,

  // chain spec
  genesisHash: string,
  addressPrefix: string,
  name: string,
  paraId: number | null,
  evmChainId: number | null, // null if not evm compatible
  symbol: string,
  decimals: number,
  existentialDeposit: string
}

export interface ValidateNetworkRequest {
  provider: string,
  existedChainSlug?: string
}

export interface ApiMap {
  substrate: Record<string, _SubstrateApi>;
  evm: Record<string, _EvmApi>;
}

export interface SupportTransferResponse {
  supportTransfer: boolean;
  supportTransferAll: boolean;
}

export interface RequestFreeBalance {
  address: string,
  networkKey: string,
  token?: string
}

export interface RequestTransferCheckReferenceCount {
  address: string,
  networkKey: string
}

export interface RequestTransferCheckSupporting {
  networkKey: string,
  tokenSlug: string
}

export interface RequestTransferExistentialDeposit {
  tokenSlug: string
}

export interface RequestSaveRecentAccount {
  accountId: string;
}

export interface SubstrateNftTransaction {
  error: boolean;
  estimatedFee?: string;
  balanceError: boolean;
}

export interface SubstrateNftSubmitTransaction extends BaseRequestSign {
  params: Record<string, any> | null;
  senderAddress: string;
  recipientAddress: string;
}

export type RequestSubstrateNftSubmitTransaction = InternalRequestSign<SubstrateNftSubmitTransaction>
export type RequestEvmNftSubmitTransaction = InternalRequestSign<EvmNftSubmitTransaction>

export interface RequestAccountMeta{
  address: string | Uint8Array;
}

export interface ResponseAccountMeta{
  meta: KeyringPair$Meta;
}

export type RequestEvmEvents = null;
export type EvmEventType = 'connect' | 'disconnect' | 'accountsChanged' | 'chainChanged' | 'message' | 'data' | 'reconnect' | 'error';
export type EvmAccountsChangedPayload = string [];
export type EvmChainChangedPayload = string;
export type EvmConnectPayload = { chainId: EvmChainChangedPayload }
export type EvmDisconnectPayload = unknown

export interface EvmEvent {
  type: EvmEventType,
  payload: EvmAccountsChangedPayload | EvmChainChangedPayload | EvmConnectPayload | EvmDisconnectPayload;
}

export interface EvmAppState {
  networkKey?: string,
  chainId?: string,
  isConnected?: boolean,
  web3?: Web3,
  listenEvents?: string[]
}

export type RequestEvmProviderSend = JsonRpcPayload;

export interface ResponseEvmProviderSend {
  error: (Error | null);
  result?: JsonRpcResponse;
}

export enum EvmProviderErrorType {
  USER_REJECTED_REQUEST = 'USER_REJECTED_REQUEST',
  UNAUTHORIZED = 'UNAUTHORIZED',
  UNSUPPORTED_METHOD = 'UNSUPPORTED_METHOD',
  DISCONNECTED = 'DISCONNECTED',
  CHAIN_DISCONNECTED = 'CHAIN_DISCONNECTED',
  INVALID_PARAMS = 'INVALID_PARAMS',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
}

export interface EvmSendTransactionParams {
  from: string;
  to?: string;
  value?: string | number;
  gasLimit?: string | number;
  maxPriorityFeePerGas?: string | number;
  maxFeePerGas?: string | number;
  gasPrice?: string | number;
  data?: string
}

export interface SwitchNetworkRequest {
  networkKey: string;
  address?: string;
}

export interface EvmSignatureRequest {
  address: string,
  type: string;
  payload: unknown
}

export interface ConfirmationsQueueItemOptions {
  requiredPassword?: boolean;
  address?: string;
  networkKey?: string;
}

export interface ConfirmationsQueueItem<T> extends ConfirmationsQueueItemOptions, ConfirmationRequestBase{
  payload: T;
  payloadJson: string;
}

export interface ConfirmationResult<T> extends ConfirmationRequestBase {
  isApproved: boolean;
  payload?: T;
}
export interface ConfirmationResultExternal<T> extends ConfirmationResult<T>{
  signature: `0x${string}`;
}

export interface EvmSendTransactionRequest extends TransactionConfig {
  estimateGas: string;
  hashPayload: string;
}

export interface EvmRequestExternal {
  hashPayload: string;
  canSign: boolean;
}

export interface EvmSendTransactionRequestExternal extends EvmSendTransactionRequest, EvmRequestExternal {}

export interface EvmSignatureRequestExternal extends EvmSignatureRequest, EvmRequestExternal {}

export interface AddNetworkRequestExternal { // currently only support adding pure EVM network
  chainId: string,
  rpcUrls: string[],
  chainName: string,
  blockExplorerUrls?: string[],
  requestId?: string
}

export interface AddTokenRequestExternal {
  contractAddress: string,
  originChain: string,
  type: string,

  name: string,
  symbol: string,
  decimals: number
}

export interface ConfirmationDefinitions {
  addNetworkRequest: [ConfirmationsQueueItem<AddNetworkRequestExternal>, ConfirmationResult<AddNetworkRequestExternal>],
  addTokenRequest: [ConfirmationsQueueItem<AddTokenRequestExternal>, ConfirmationResult<boolean>],
  switchNetworkRequest: [ConfirmationsQueueItem<SwitchNetworkRequest>, ConfirmationResult<boolean>],
  evmSignatureRequest: [ConfirmationsQueueItem<EvmSignatureRequest>, ConfirmationResult<string>],
  evmSignatureRequestExternal: [ConfirmationsQueueItem<EvmSignatureRequestExternal>, ConfirmationResultExternal<string>],
  evmSendTransactionRequest: [ConfirmationsQueueItem<EvmSendTransactionRequest>, ConfirmationResult<string>]
  evmSendTransactionRequestExternal: [ConfirmationsQueueItem<EvmSendTransactionRequestExternal>, ConfirmationResultExternal<string>]
}

export type ConfirmationType = keyof ConfirmationDefinitions;

export type ConfirmationsQueue = {
  [CT in ConfirmationType]: Record<string, ConfirmationDefinitions[CT][0]>;
}

export type RequestConfirmationsSubscribe = null;

// Design to use only one confirmation
export type RequestConfirmationComplete = {
  [CT in ConfirmationType]?: ConfirmationDefinitions[CT][1];
}

export interface ValidatorInfo {
  address: string;
  chain: string;

  totalStake: string;
  ownStake: string;
  otherStake: string;

  minBond: string;
  nominatorCount: number;
  commission: number; // in %
  expectedReturn: number; // in %, annually

  blocked: boolean;
  identity?: string;
  isVerified: boolean;
  isNominated: boolean; // this validator has been staked to before
  icon?: string;
  hasScheduledRequest?: boolean; // for parachain, can't stake more on a collator that has existing scheduled request
}

export interface NominationPoolInfo {
  id: string,
  identity?: string,
  address: string,
  memberCount: number,
  bondedAmount: string
}

export interface ExtraDelegationInfo {
  chain: string;
  address: string;
  collatorAddress: string;
}

export interface BasicTxInfo {
  fee: string,
  balanceError: boolean,
  rawFee?: number
}

export interface BondingOptionParams {
  networkKey: string;
  address: string;
}

export interface SingleModeJson {
  networkKeys: string[],
  theme: ThemeNames,
  autoTriggerDomain: string // Regex for auto trigger single mode
}

/// EVM transaction

export type NestedArray<T> = T | NestedArray<T>[];

/// EVM Contract Input

export interface EVMTransactionArg {
  name: string;
  type: string;
  value: string;
  children?: EVMTransactionArg[];
}

export interface ParseEVMTransactionData{
  method: string;
  methodName: string;
  args: EVMTransactionArg[];
}

export interface RequestParseEVMContractInput {
  data: string;
  contract: string;
  chainId: number;
}

export interface ResponseParseEVMContractInput {
  result: ParseEVMTransactionData | string
}

/// Ledger

export interface LedgerNetwork {
  genesisHash: string;
  displayName: string;
  network: string;
  icon: 'substrate' | 'ethereum';
  isDevMode: boolean;
}

/// On-ramp

export interface TransakNetwork {
  networks: string[];
  tokens?: string[];
}

/// Qr Sign

// Parse Substrate

export interface FormattedMethod {
  args?: ArgInfo[];
  methodName: string;
}

export interface ArgInfo {
  argName: string;
  argValue: string | string[];
}

export interface EraInfo{
  period: number;
  phase: number;
}

export interface ResponseParseTransactionSubstrate {
  era: EraInfo | string;
  nonce: number;
  method: string | FormattedMethod[];
  tip: number;
  specVersion: number;
  message: string;
}

export interface RequestParseTransactionSubstrate {
  data: string;
  networkKey: string;
}

// Parse EVM

export interface RequestQrParseRLP {
  data: string;
}

export interface ResponseQrParseRLP {
  data: ParseEVMTransactionData | string;
  input: string;
  nonce: number;
  to: string;
  gas: number;
  gasPrice: number;
  value: number;
}

// Check lock

export interface RequestAccountIsLocked {
  address: string;
}

export interface ResponseAccountIsLocked {
  isLocked: boolean;
  remainingTime: number;
}

// Sign

export type SignerDataType = 'transaction' | 'message'

export interface RequestQrSignSubstrate {
  address: string;
  data: string;
  networkKey: string;
}

export interface ResponseQrSignSubstrate {
  signature: string;
}

export interface RequestQrSignEVM {
  address: string;
  message: string;
  type: 'message' | 'transaction'
  chainId?: number;
}

export interface ResponseQrSignEVM {
  signature: string;
}

/// Transfer

export interface RequestCheckTransfer extends BaseRequestSign{
  networkKey: string,
  from: string,
  to: string,
  value?: string,
  transferAll?: boolean
  tokenSlug: string
}

export interface ValidateTransactionResponse {
  errors?: TransactionError[],
  warnings?: TransactionWarning[],
  estimateFee?: AmountData
}

export type RequestTransfer = InternalRequestSign<RequestCheckTransfer>

export interface RequestCheckCrossChainTransfer extends BaseRequestSign {
  originNetworkKey: string,
  destinationNetworkKey: string,
  from: string,
  to: string,
  transferAll?: boolean,
  value: string,
  sendingTokenSlug: string
}

export type RequestCrossChainTransfer = InternalRequestSign<RequestCheckCrossChainTransfer>;

export interface ResponseCheckCrossChainTransfer {
  errors?: TransactionError[],
  feeString?: string,
  estimatedFee: string,
  feeSymbol: string
}

/// Stake

// Bonding
export interface NominatorInfo {
  chain: string,
  address: string,

  isBondedBefore: boolean,
  bondedValidators: string[],
  bondedPool: string[]
}

export interface BondingOptionInfo {
  isBondedBefore: boolean,
  era: number,
  maxNominations: number,
  maxNominatorPerValidator: number,
  validators: ValidatorInfo[],
  bondedValidators: string[]
}

export interface ChainBondingInfo {
  chain: string,
  estimatedReturn: number, // yearly
  activeNominatorCount: number,
  totalNominatorCount: number,
  unbondingPeriod: number, // in hours
  totalStake: string
}

export interface BondingSubmitParams extends BaseRequestSign {
  networkKey: string,
  nominatorAddress: string,
  amount: number,
  validatorInfo: ValidatorInfo,
  isBondedBefore: boolean,
  bondedValidators: string[], // already delegated validators
  lockPeriod?: number // in month
}

export type RequestBondingSubmit = InternalRequestSign<BondingSubmitParams>;

// UnBonding

export interface UnbondingSubmitParams extends BaseRequestSign {
  amount: number,
  networkKey: string,
  address: string,
  // for some chains
  validatorAddress?: string,
  unstakeAll?: boolean
}

export type RequestUnbondingSubmit = InternalRequestSign<UnbondingSubmitParams>;

// Withdraw

export interface StakeWithdrawalParams extends BaseRequestSign {
  address: string,
  networkKey: string,
  validatorAddress?: string,
  action?: string
}

export type RequestStakeWithdrawal = InternalRequestSign<StakeWithdrawalParams>;

// Claim

export interface StakeClaimRewardParams extends BaseRequestSign {
  address: string,
  networkKey: string,
  validatorAddress?: string,
  stakingType: StakingType
}

export type RequestStakeClaimReward = InternalRequestSign<StakeClaimRewardParams>;

// Compound

export interface DelegationItem {
  owner: string,
  amount: string, // raw amount string
  identity?: string,
  minBond: string,
  hasScheduledRequest: boolean
  icon?: string;
}

export interface StakeDelegationRequest {
  address: string,
  networkKey: string
}

export interface CheckExistingTuringCompoundParams {
  address: string;
  collatorAddress: string;
  networkKey: string;
}

export interface ExistingTuringCompoundTask {
  exist: boolean;
  taskId: string;
  accountMinimum: number;
  frequency: number;
}

export interface TuringStakeCompoundResp {
  txInfo: BasicTxInfo,
  optimalFrequency: string,
  initTime: number,
  compoundFee: string,
  rawCompoundFee?: number
}

export interface TuringStakeCompoundParams extends BaseRequestSign {
  address: string,
  collatorAddress: string,
  networkKey: string,
  accountMinimum: string,
  bondedAmount: string,
}

export type RequestTuringStakeCompound = InternalRequestSign<TuringStakeCompoundParams>;

export interface TuringCancelStakeCompoundParams extends BaseRequestSign {
  taskId: string;
  networkKey: string;
  address: string;
}

export type RequestTuringCancelStakeCompound = InternalRequestSign<TuringCancelStakeCompoundParams>;

/// Create QR

// Transfer

export type RequestTransferExternal = InternalRequestSign<RequestCheckTransfer>;

// XCM

export type RequestCrossChainTransferExternal = InternalRequestSign<RequestCheckCrossChainTransfer>;

// NFT

export type RequestNftTransferExternalSubstrate = InternalRequestSign<SubstrateNftSubmitTransaction>;

export type RequestNftTransferExternalEVM = InternalRequestSign<EvmNftSubmitTransaction>;

// Stake

export type RequestStakeExternal = InternalRequestSign<BondingSubmitParams>;

export type RequestUnStakeExternal = InternalRequestSign<UnbondingSubmitParams>;

export type RequestWithdrawStakeExternal = InternalRequestSign<StakeWithdrawalParams>;

export type RequestClaimRewardExternal = InternalRequestSign<StakeClaimRewardParams>;

export type RequestCreateCompoundStakeExternal = InternalRequestSign<TuringStakeCompoundParams>;

export type RequestCancelCompoundStakeExternal = InternalRequestSign<TuringCancelStakeCompoundParams>;

/// Keyring state

export interface KeyringState {
  isReady: boolean;
  hasMasterPassword: boolean;
  isLocked: boolean;
}

export interface RequestChangeMasterPassword {
  oldPassword?: string;
  newPassword: string;

  createNew: boolean;
}

export enum ChainEditStandard {
  EVM = 'EVM',
  SUBSTRATE = 'SUBSTRATE',
  UNKNOWN = 'UNKNOWN',
  MIXED = 'MIXED' // takes root in a standard (Substrate, EVM,...) but also compatible with other standards
}

// ChainService
// for custom network
export type ChainEditInfo = { // only support pure substrate or EVM network
  slug: string;
  currentProvider: string;
  providers: Record<string, string>;
  name: string;
  chainType: ChainEditStandard;
  blockExplorer?: string;
  crowdloanUrl?: string;
  priceId?: string;
  symbol: string;
}

export interface ChainSpecInfo {
  // Substrate
  addressPrefix: number,
  genesisHash: string,
  paraId: number | null,

  // EVM
  evmChainId: number | null // null means not EVM

  // Common
  existentialDeposit: string,
  decimals: number
}

export interface ResponseChangeMasterPassword {
  status: boolean;
  errors: string[];
}

export interface RequestMigratePassword {
  address: string;
  password: string;
}

export interface ResponseMigratePassword {
  status: boolean;
  errors: string[];
}

export interface RequestUnlockKeyring {
  password: string;
}

export interface ResponseUnlockKeyring {
  status: boolean;
  errors: string[];
}

export interface RequestKeyringExportMnemonic {
  address: string;
  password: string;
}

export interface ResponseKeyringExportMnemonic {
  result: string;
}

/// Signing
export interface RequestSigningApprovePasswordV2 {
  id: string;
}

export interface AssetSettingUpdateReq {
  tokenSlug: string,
  assetSetting: AssetSetting
}

export interface KoniRequestSignatures {
  // Bonding functions
  'pri(staking.submitTuringCancelCompound)': [RequestTuringCancelStakeCompound, TransactionResponse];
  'pri(staking.turingCancelCompound)': [TuringCancelStakeCompoundParams, BasicTxInfo];
  'pri(staking.checkTuringCompoundTask)': [CheckExistingTuringCompoundParams, ExistingTuringCompoundTask];
  'pri(staking.submitTuringCompound)': [RequestTuringStakeCompound, TransactionResponse];
  'pri(staking.turingCompound)': [TuringStakeCompoundParams, TuringStakeCompoundResp];
  'pri(staking.delegationInfo)': [StakeDelegationRequest, DelegationItem[]];
  'pri(staking.submitClaimReward)': [RequestStakeClaimReward, TransactionResponse];
  'pri(staking.claimRewardTxInfo)': [StakeClaimRewardParams, BasicTxInfo];
  'pri(unbonding.submitWithdrawal)': [RequestStakeWithdrawal, TransactionResponse];
  'pri(unbonding.withdrawalTxInfo)': [StakeWithdrawalParams, BasicTxInfo];
  'pri(unbonding.subscribeUnlockingInfo)': [null, StakeUnlockingJson, StakeUnlockingJson];
  'pri(unbonding.submitTransaction)': [RequestUnbondingSubmit, TransactionResponse];
  'pri(unbonding.txInfo)': [UnbondingSubmitParams, BasicTxInfo];
  'pri(bonding.txInfo)': [BondingSubmitParams, BasicTxInfo];
  'pri(bonding.submitTransaction)': [RequestBondingSubmit, TransactionResponse];
  'pri(bonding.getChainBondingBasics)': [NetworkJson[], Record<string, ChainBondingInfo>, Record<string, ChainBondingInfo>];
  'pri(bonding.getBondingOptions)': [BondingOptionParams, BondingOptionInfo];

  // Chains, assets functions
  'pri(chainService.subscribeChainInfoMap)': [null, Record<string, any>, Record<string, any>];
  'pri(chainService.subscribeChainStateMap)': [null, Record<string, any>, Record<string, any>];
  'pri(chainService.subscribeAssetRegistry)': [null, Record<string, any>, Record<string, any>];
  'pri(chainService.subscribeMultiChainAssetMap)': [null, Record<string, any>, Record<string, any>];
  'pri(chainService.upsertChain)': [_NetworkUpsertParams, boolean];
  'pri(chainService.enableChains)': [string[], boolean];
  'pri(chainService.disableChains)': [string[], boolean];
  'pri(chainService.enableChain)': [string, boolean];
  'pri(chainService.disableChain)': [string, boolean];
  'pri(chainService.removeChain)': [string, boolean];
  'pri(chainService.deleteCustomAsset)': [string, boolean];
  'pri(chainService.upsertCustomAsset)': [Record<string, any>, boolean];
  'pri(chainService.validateCustomAsset)': [_ValidateCustomAssetRequest, _ValidateCustomAssetResponse];
  'pri(chainService.resetDefaultChains)': [null, boolean];
  'pri(chainService.getSupportedContractTypes)': [null, string[]];
  'pri(chainService.validateCustomChain)': [ValidateNetworkRequest, ValidateNetworkResponse];
  'pri(chainService.recoverSubstrateApi)': [string, boolean];
  'pri(chainService.disableAllChains)': [null, boolean];
  'pri(assetSetting.getSubscription)': [null, Record<string, AssetSetting>, Record<string, AssetSetting>]
  'pri(assetSetting.update)': [AssetSettingUpdateReq, boolean];

  // NFT functions
  'pri(evmNft.submitTransaction)': [RequestEvmNftSubmitTransaction, NftTransactionResponse];
  'pri(evmNft.getTransaction)': [NftTransactionRequest, EvmNftTransaction];
  'pri(substrateNft.submitTransaction)': [RequestSubstrateNftSubmitTransaction, NftTransactionResponse];
  'pri(substrateNft.getTransaction)': [NftTransactionRequest, SubstrateNftTransaction];
  'pri(nftTransfer.setNftTransfer)': [NftTransferExtra, boolean];
  'pri(nftTransfer.getNftTransfer)': [null, NftTransferExtra];
  'pri(nftTransfer.getSubscription)': [null, NftTransferExtra, NftTransferExtra];
  'pri(nft.forceUpdate)': [RequestNftForceUpdate, boolean];
  'pri(nft.getNft)': [null, NftJson];
  'pri(nft.getSubscription)': [RequestSubscribeNft, NftJson, NftJson];
  'pri(nftCollection.getNftCollection)': [null, NftCollectionJson];
  'pri(nftCollection.getSubscription)': [null, NftCollection[], NftCollection[]];
  'pri(wasmNft.getTransaction)': [NftTransactionRequest, SubstrateNftTransaction];

  // Staking functions
  'pri(staking.getStaking)': [null, StakingJson];
  'pri(staking.getSubscription)': [RequestSubscribeStaking, StakingJson, StakingJson];
  'pri(stakingReward.getStakingReward)': [null, StakingRewardJson];
  'pri(stakingReward.getSubscription)': [RequestSubscribeStakingReward, StakingRewardJson, StakingRewardJson];

  // Price, balance, crowdloan functions
  'pri(price.getPrice)': [RequestPrice, PriceJson];
  'pri(price.getSubscription)': [RequestSubscribePrice, PriceJson, PriceJson];
  'pri(balance.getBalance)': [RequestBalance, BalanceJson];
  'pri(balance.getSubscription)': [RequestSubscribeBalance, BalanceJson, BalanceJson];
  'pri(crowdloan.getCrowdloan)': [RequestCrowdloan, CrowdloanJson];
  'pri(crowdloan.getSubscription)': [RequestSubscribeCrowdloan, CrowdloanJson, CrowdloanJson];

  // Auth
  'pri(authorize.listV2)': [null, ResponseAuthorizeList];
  'pri(authorize.requestsV2)': [RequestAuthorizeSubscribe, boolean, AuthorizeRequest[]];
  'pri(authorize.approveV2)': [RequestAuthorizeApproveV2, boolean];
  'pri(authorize.changeSiteAll)': [RequestAuthorizationAll, boolean, AuthUrls];
  'pri(authorize.changeSite)': [RequestAuthorization, boolean, AuthUrls];
  'pri(authorize.changeSitePerAccount)': [RequestAuthorizationPerAccount, boolean, AuthUrls];
  'pri(authorize.changeSitePerSite)': [RequestAuthorizationPerSite, boolean];
  'pri(authorize.changeSiteBlock)': [RequestAuthorizationBlock, boolean];
  'pri(authorize.forgetSite)': [RequestForgetSite, boolean, AuthUrls];
  'pri(authorize.forgetAllSite)': [null, boolean, AuthUrls];
  'pri(authorize.rejectV2)': [RequestAuthorizeReject, boolean];
  'pri(authorize.cancelV2)': [RequestAuthorizeCancel, boolean];

  // Account management
  'pri(seed.createV2)': [RequestSeedCreateV2, ResponseSeedCreateV2];
  'pri(seed.validateV2)': [RequestSeedValidateV2, ResponseSeedValidateV2];
  'pri(privateKey.validateV2)': [RequestSeedValidateV2, ResponsePrivateKeyValidateV2];
  'pri(accounts.create.suriV2)': [RequestAccountCreateSuriV2, ResponseAccountCreateSuriV2];
  'pri(accounts.create.externalV2)': [RequestAccountCreateExternalV2, AccountExternalError[]];
  'pri(accounts.create.hardwareV2)': [RequestAccountCreateHardwareV2, boolean];
  'pri(accounts.create.withSecret)': [RequestAccountCreateWithSecretKey, ResponseAccountCreateWithSecretKey];
  'pri(derivation.createV2)': [RequestDeriveCreateV2, boolean]; // Substrate
  'pri(json.restoreV2)': [RequestJsonRestoreV2, void];
  'pri(json.batchRestoreV2)': [RequestBatchRestoreV2, void];
  'pri(accounts.exportPrivateKey)': [RequestAccountExportPrivateKey, ResponseAccountExportPrivateKey];
  'pri(accounts.checkPublicAndSecretKey)': [RequestCheckPublicAndSecretKey, ResponseCheckPublicAndSecretKey];
  'pri(accounts.subscribeWithCurrentAddress)': [RequestAccountSubscribe, AccountsWithCurrentAddress, AccountsWithCurrentAddress];
  'pri(accounts.subscribeAccountsInputAddress)': [RequestAccountSubscribe, string, OptionInputAddress];
  'pri(accounts.saveRecent)': [RequestSaveRecentAccount, SingleAddress];
  'pri(accounts.triggerSubscription)': [null, boolean];
  'pri(accounts.get.meta)': [RequestAccountMeta, ResponseAccountMeta];
  'pri(accounts.updateCurrentAddress)': [string, boolean];
  'pri(currentAccount.saveAddress)': [RequestCurrentAccountAddress, boolean, CurrentAccountInfo];

  // Settings
  'pri(settings.changeBalancesVisibility)': [null, boolean, UiSettings];
  'pri(settings.subscribe)': [null, UiSettings, UiSettings];
  'pri(settings.saveAccountAllLogo)': [string, boolean, UiSettings];
  'pri(settings.saveTheme)': [ThemeNames, boolean, UiSettings];
  'pri(settings.saveBrowserConfirmationType)': [BrowserConfirmationType, boolean, UiSettings];

  // Subscription
  'pri(transaction.history.getSubscription)': [null, TransactionHistoryItem[], TransactionHistoryItem[]];
  // 'pri(transaction.history.add)': [RequestTransactionHistoryAdd, boolean, TransactionHistoryItem[]];
  'pri(transfer.checkReferenceCount)': [RequestTransferCheckReferenceCount, boolean];
  'pri(transfer.checkSupporting)': [RequestTransferCheckSupporting, SupportTransferResponse];
  'pri(transfer.getExistentialDeposit)': [RequestTransferExistentialDeposit, string];
  'pri(subscription.cancel)': [string, boolean];
  'pri(freeBalance.subscribe)': [RequestFreeBalance, string, string];

  // Transfer
  'pri(accounts.checkTransfer)': [RequestCheckTransfer, ValidateTransactionResponse];
  'pri(accounts.transfer)': [RequestTransfer, TransactionResponse];

  'pri(accounts.checkCrossChainTransfer)': [RequestCheckCrossChainTransfer, ResponseCheckCrossChainTransfer];
  'pri(accounts.crossChainTransfer)': [RequestCrossChainTransfer, TransactionResponse];

  // Confirmation Queues
  'pri(confirmations.subscribe)': [RequestConfirmationsSubscribe, ConfirmationsQueue, ConfirmationsQueue];
  'pri(confirmations.complete)': [RequestConfirmationComplete, boolean];

  'pub(utils.getRandom)': [RandomTestRequest, number];
  'pub(accounts.listV2)': [RequestAccountList, InjectedAccount[]];
  'pub(accounts.subscribeV2)': [RequestAccountSubscribe, boolean, InjectedAccount[]];

  // Sign QR
  'pri(account.isLocked)': [RequestAccountIsLocked, ResponseAccountIsLocked];
  'pri(qr.transaction.parse.substrate)': [RequestParseTransactionSubstrate, ResponseParseTransactionSubstrate];
  'pri(qr.transaction.parse.evm)': [RequestQrParseRLP, ResponseQrParseRLP];
  'pri(qr.sign.substrate)': [RequestQrSignSubstrate, ResponseQrSignSubstrate];
  'pri(qr.sign.evm)': [RequestQrSignEVM, ResponseQrSignEVM];

  // External account request
  'pri(account.external.reject)': [RequestRejectExternalRequest, ResponseRejectExternalRequest];
  'pri(account.external.resolve)': [RequestResolveExternalRequest, ResponseResolveExternalRequest];

  // EVM
  'evm(events.subscribe)': [RequestEvmEvents, boolean, EvmEvent];
  'evm(request)': [RequestArguments, unknown];
  'evm(provider.send)': [RequestEvmProviderSend, string | number, ResponseEvmProviderSend]

  // EVM Transaction
  'pri(evm.transaction.parse.input)': [RequestParseEVMContractInput, ResponseParseEVMContractInput];

  // Authorize
  'pri(authorize.subscribe)': [null, AuthUrls, AuthUrls];

  // Keyring state
  'pri(keyring.subscribe)': [null, KeyringState, KeyringState];
  'pri(keyring.change)': [RequestChangeMasterPassword, ResponseChangeMasterPassword];
  'pri(keyring.migrate)': [RequestMigratePassword, ResponseMigratePassword];
  'pri(keyring.unlock)': [RequestUnlockKeyring, ResponseUnlockKeyring];
  'pri(keyring.lock)': [null, void];
  'pri(keyring.export.mnemonic)': [RequestKeyringExportMnemonic, ResponseKeyringExportMnemonic];

  // Signing
  'pri(signing.approve.passwordV2)': [RequestSigningApprovePasswordV2, boolean];

  // Derive
  'pri(derivation.validateV2)': [RequestDeriveValidateV2, ResponseDeriveValidateV2];
  'pri(derivation.getList)': [RequestGetDeriveAccounts, ResponseGetDeriveAccounts];
  'pri(derivation.create.multiple)': [RequestDeriveCreateMultiple, boolean];
  'pri(derivation.createV3)': [RequestDeriveCreateV3, boolean];
}

export interface ApplicationMetadataType {
  version: string;
}
