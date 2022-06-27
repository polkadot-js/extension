// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AuthUrls, Resolver } from '@subwallet/extension-base/background/handlers/State';
import { AccountAuthType, AccountJson, AuthorizeRequest, RequestAccountList, RequestAccountSubscribe, RequestAuthorizeCancel, RequestAuthorizeReject, RequestAuthorizeSubscribe, RequestAuthorizeTab, RequestCurrentAccountAddress, ResponseAuthorizeList, ResponseJsonGetAccountInfo, SeedLengths } from '@subwallet/extension-base/background/types';
import { InjectedAccount, MetadataDefBase } from '@subwallet/extension-inject/types';
import Web3 from 'web3';
import { RequestArguments, TransactionConfig } from 'web3-core';
import { JsonRpcPayload, JsonRpcResponse } from 'web3-core-helpers';

import { ApiPromise } from '@polkadot/api';
import { SubmittableExtrinsicFunction } from '@polkadot/api/promise/types';
import { KeyringPair$Json } from '@polkadot/keyring/types';
import { Registry } from '@polkadot/types/types';
import { SingleAddress } from '@polkadot/ui-keyring/observable/types';
import { KeyringOptions } from '@polkadot/ui-keyring/options/types';
import { KeyringPairs$Json } from '@polkadot/ui-keyring/types';
import { BN } from '@polkadot/util';
import { KeypairType } from '@polkadot/util-crypto/types';

export interface ServiceInfo {
  networkMap: Record<string, NetworkJson>;
  apiMap: ApiMap;
  isLock?: boolean;
  currentAccountInfo: CurrentAccountInfo;
  chainRegistry: Record<string, ChainRegistry>;
  customErc721Registry: CustomEvmToken[];
}

export enum ApiInitStatus {
  SUCCESS,
  ALREADY_EXIST,
  NOT_SUPPORT,
  NOT_EXIST
}

export interface AuthRequestV2 extends Resolver<ResultResolver> {
  id: string;
  idStr: string;
  request: RequestAuthorizeTab;
  url: string;
  accountAuthType: AccountAuthType
}

export interface RequestAuthorizeApproveV2 {
  id: string;
  accounts: string[];
}

export interface RequestAuthorizationAll {
  connectValue: boolean;
}

export interface RequestAuthorization extends RequestAuthorizationAll {
  url: string;
}

export interface RequestAuthorizationPerAccount extends RequestAuthorization {
  address: string;
}

export interface ResultResolver {
  result: boolean;
  accounts: string[];
}

export interface RejectResolver {
  error: Error;
  accounts: string[];
}

export interface RequestForgetSite {
  url: string;
}

export interface StakingRewardItem {
  state: APIItemState
  name: string,
  chainId: string,
  latestReward?: string,
  totalReward?: string,
  totalSlash?: string,
  smartContract?: string
}

export interface StakingRewardJson {
  ready: boolean;
  details: Array<StakingRewardItem>;
}

export interface DelegationItem {
  owner: string,
  amount: string, // raw amount string
  identity?: string,
  minBond: string
}

export interface StakingItem {
  name: string,
  chainId: string,
  balance?: string,
  activeBalance?: string,
  unlockingBalance?: string
  nativeToken: string,
  unit?: string,
  delegation?: DelegationItem[],
  state: APIItemState
}

export interface StakingJson {
  ready?: boolean,
  details: Record<string, StakingItem>
}

export interface PriceJson {
  ready?: boolean,
  currency: string,
  priceMap: Record<string, number>,
  tokenPriceMap: Record<string, number>
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
  id?: string;
  name?: string;
  image?: string;
  external_url?: string;
  rarity?: string;
  collectionId?: string;
  description?: string;
  properties?: Record<any, any> | null;
  chain?: string;
  rmrk_ver?: RMRK_VER;
}

export interface NftCollection {
  collectionId: string;
  collectionName?: string;
  image?: string;
  chain?: string;
  itemCount?: number;
}

export interface NftJson {
  total: number;
  nftList: Array<NftItem>;
}

export interface NftCollectionJson {
  ready: boolean;
  nftCollectionList: Array<NftCollection>;
}

export interface TokenBalanceRaw {
  reserved: BN,
  frozen: BN,
  free: BN
}

export interface BalanceChildItem {
  reserved: string,
  frozen: string,
  free: string,
  decimals: number
}

export interface BalanceItem {
  state: APIItemState,
  free: string,
  reserved: string,
  miscFrozen: string,
  feeFrozen: string,
  children?: Record<string, BalanceChildItem>
}

export interface BalanceJson {
  details: Record<string, BalanceItem>
}

export interface CrowdloanItem {
  state: APIItemState,
  paraState?: CrowdloanParaState,
  contribute: string
}

export interface CrowdloanJson {
  details: Record<string, CrowdloanItem>
}

export interface ChainRegistry {
  chainDecimals: number[];
  chainTokens: string[];
  tokenMap: Record<string, TokenInfo>
}

export interface DefaultFormatBalance {
  decimals?: number[] | number;
  unit?: string[] | string;
}

export interface ApiState {
  apiDefaultTx: SubmittableExtrinsicFunction;
  apiDefaultTxSudo: SubmittableExtrinsicFunction;
  isApiReady: boolean;
  isApiReadyOnce: boolean;
  isDevelopment?: boolean;
  isEthereum?: boolean;
  specName: string;
  specVersion: string;
  systemChain: string;
  systemName: string;
  systemVersion: string;
  registry: Registry;
  defaultFormatBalance: DefaultFormatBalance;
}

export interface ApiProps extends ApiState {
  api: ApiPromise;
  apiError?: string;
  apiUrl: string;
  isNotSupport?: boolean;
  isApiReadyOnce: boolean;
  isApiConnected: boolean;
  isEthereum: boolean;
  isApiInitialized: boolean;
  isReady: Promise<ApiProps>;
  apiRetry?: number;
  recoverConnect?: () => void;
  useEvmAddress?: boolean
}

export type NetWorkGroup = 'RELAY_CHAIN' | 'POLKADOT_PARACHAIN' | 'KUSAMA_PARACHAIN' | 'MAIN_NET' | 'TEST_NET' | 'UNKNOWN';

export interface NetWorkInfo {
  chain: string;
  genesisHash: string;
  icon?: string;
  ss58Format: number;
  chainType?: 'substrate' | 'ethereum';
  provider: string;
  groups: NetWorkGroup[];
  paraId?: number;
  isEthereum?: boolean;
  nativeToken?: string;
  crowdloanUrl?: string;
  decimals?: number;
}

export interface NetworkJson {
  // General Informations
  key: string; // Key of network in NetworkMap
  chain: string; // Name of the network
  icon?: string; // Icon name, available with known network
  active: boolean; // Network is active or not

  // Provider Informations
  providers: Record<string, string>; // Predefined provider map
  currentProvider: string; // Current provider key
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

  // Ethereum informations for predefine network only
  isEthereum?: boolean; // Only show network with isEthereum=true when select one EVM account // user input
  evmChainId?: number;

  isHybrid?: boolean;

  // Native token information
  nativeToken?: string;
  decimals?: number;

  // Other informations
  coinGeckoKey?: string; // Provider key to get token price from CoinGecko // user input
  blockExplorer?: string; // Link to block scanner to check transaction with extrinsic hash // user input
  dependencies?: string[]; // Auto active network in dependencies if current network is activated
  getStakingOnChain?: boolean; // support get bonded on chain
  supportBonding?: boolean;

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

export interface DropdownOptionType {
  text: string;
  value: string;
}

export interface DropdownTransformOptionType {
  label: string;
  value: string;
}

export interface DropdownTransformGroupOptionType {
  label: string;
  options: DropdownTransformOptionType[];
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

export type TokenInfo = {
  isMainToken: boolean,
  symbol: string,
  symbolAlt?: string, // Alternate display for symbol
  erc20Address?: string,
  assetIndex?: number,
  decimals: number,
  name: string,
  coinGeckoKey?: string,
  specialOption?: object
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
}

export interface RequestSettingsType {
  isShowBalance: boolean;
  accountAllLogo: string;
  theme: ThemeTypes;
}

export interface ResponseSettingsType {
  isShowBalance: boolean;
  accountAllLogo: string;
  theme: ThemeTypes;
}

export interface RandomTestRequest {
  start: number;
  end: number;
}

export interface TransactionHistoryItemType {
  time: number;
  networkKey: string;
  change: string;
  changeSymbol?: string; // if undefined => main token
  fee?: string;
  feeSymbol?: string;
  // if undefined => main token, sometime "fee" uses different token than "change"
  // ex: sub token (DOT, AUSD, KSM, ...) of Acala, Karaura uses main token to pay fee
  isSuccess: boolean;
  action: 'send' | 'received';
  extrinsicHash: string
}

export interface RequestTransactionHistoryGet {
  address: string;
  networkKey: string;
}

export interface RequestTransactionHistoryGetByMultiNetworks {
  address: string;
  networkKeys: string[];
}

export interface RequestTransactionHistoryAdd {
  address: string;
  networkKey: string;
  item: TransactionHistoryItemType;
}

export interface RequestApi {
  networkKey: string;
}

export interface RequestAccountExportPrivateKey {
  address: string;
  password: string;
}

export interface ResponseAccountExportPrivateKey {
  privateKey: string;
}

export interface RequestSeedCreateV2 {
  length?: SeedLengths;
  seed?: string;
  types?: Array<KeypairType>;
}

export interface RequestSeedValidateV2 {
  suri: string;
  types?: Array<KeypairType>;
}

export interface RequestAccountCreateSuriV2 {
  name: string;
  genesisHash?: string | null;
  password: string;
  suri: string;
  types?: Array<KeypairType>;
  isAllowed: boolean;
}

export interface RequestDeriveCreateV2 {
  name: string;
  genesisHash?: string | null;
  suri: string;
  parentAddress: string;
  parentPassword: string;
  password: string;
  isAllowed: boolean;
}

export interface RequestJsonRestoreV2 {
  file: KeyringPair$Json;
  password: string;
  address: string;
  isAllowed: boolean;
}

export interface RequestBatchRestoreV2 {
  file: KeyringPairs$Json;
  password: string;
  accountsInfo: ResponseJsonGetAccountInfo[];
  isAllowed: boolean;
}

export interface ResponseSeedCreateV2 {
  seed: string,
  addressMap: Record<KeypairType, string>
}

export interface RequestCheckTransfer {
  networkKey: string,
  from: string,
  to: string,
  value?: string,
  transferAll?: boolean
  token?: string
}

export interface RequestTransfer extends RequestCheckTransfer {
  password: string;
}

export interface RequestCheckCrossChainTransfer {
  originNetworkKey: string,
  destinationNetworkKey: string,
  from: string,
  to: string,
  transferAll?: boolean,
  value: string,
  token: string
}

export interface RequestCrossChainTransfer extends RequestCheckCrossChainTransfer {
  password: string;
}

export interface ResponseCheckCrossChainTransfer {
  errors?: Array<TransferError>,
  estimateFee?: string,
  feeSymbol?: string // if undefined => use main token
}

export interface ResponsePrivateKeyValidateV2 {
  addressMap: Record<KeypairType, string>,
  autoAddPrefix: boolean
}

export type ResponseSeedValidateV2 = ResponseSeedCreateV2
export type ResponseAccountCreateSuriV2 = Record<KeypairType, string>
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
export type ThemeTypes = 'light' | 'dark'
export type RequestNftForceUpdate = {
  collectionId: string,
  nft: NftItem,
  isSendingSelf: boolean,
  chain: string
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

export enum TransferErrorCode {
  INVALID_FROM_ADDRESS = 'invalidFromAccount',
  INVALID_TO_ADDRESS = 'invalidToAccount',
  NOT_ENOUGH_VALUE = 'notEnoughValue',
  INVALID_VALUE = 'invalidValue',
  INVALID_TOKEN = 'invalidToken',
  KEYRING_ERROR = 'keyringError',
  TRANSFER_ERROR = 'transferError',
  TIMEOUT = 'timeout',
  UNSUPPORTED = 'unsupported'
}

export type TransferError = {
  code: TransferErrorCode,
  data?: object,
  message: string
}

export interface ResponseCheckTransfer {
  errors?: Array<TransferError>,
  fromAccountFree: string,
  toAccountFree: string,
  estimateFee?: string,
  feeSymbol?: string // if undefined => use main token
}

export enum TransferStep {
  READY = 'ready',
  START = 'start',
  PROCESSING = 'processing',
  SUCCESS = 'success',
  ERROR = 'error'
}

type TxResultType = {
  change: string;
  changeSymbol?: string;
  fee?: string;
  feeSymbol?: string;
}

export interface ResponseTransfer {
  step: TransferStep,
  errors?: Array<TransferError>,
  extrinsicHash?: string,
  extrinsicStatus?: string,
  data?: object,
  txResult?: TxResultType,
  isFinalized?: boolean
}

export interface EvmNftTransactionRequest {
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

export interface EvmNftSubmitTransaction {
  senderAddress: string,
  password: string,
  recipientAddress: string,
  networkKey: string,
  rawTransaction: Record<string, any>
}

export interface NftTransactionResponse {
  passwordError?: string | null,
  callHash?: string,
  status?: boolean,
  transactionHash?: string,
  txError?: boolean,
  isSendingSelf: boolean
}

export interface ValidateNetworkResponse {
  success: boolean,
  key: string,
  genesisHash: string,
  ss58Prefix: string,
  networkGroup: NetWorkGroup[],
  chain: string,
  evmChainId: number,
  nativeToken?: string,
  decimal?: number

  error?: NETWORK_ERROR,
  conflictChain?: string,
  conflictKey?: string,
}

export interface ValidateNetworkRequest {
  provider: string,
  isEthereum: boolean,
  existedNetwork?: NetworkJson
}

export interface ApiMap {
  dotSama: Record<string, ApiProps>;
  web3: Record<string, Web3>;
}

export interface DisableNetworkResponse {
  success: boolean,
  activeNetworkCount?: number
}

export interface CustomEvmToken {
  name?: string,
  smartContract: string,
  symbol?: string,
  decimals?: number,
  chain: string,
  type: 'erc20' | 'erc721',
  isCustom?: boolean,
  isDeleted?: boolean,
  image?: string
}

export interface EvmTokenJson {
  erc20: CustomEvmToken[],
  erc721: CustomEvmToken[]
}

export interface DeleteEvmTokenParams {
  smartContract: string,
  chain: string,
  type: 'erc20' | 'erc721'
}

export interface ValidateEvmTokenRequest {
  smartContract: string,
  chain: string,
  type: 'erc20' | 'erc721'
}

export interface ValidateEvmTokenResponse {
  name: string,
  symbol: string,
  decimals?: number,
  isExist: boolean
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
  token: string
}

export interface RequestTransferExistentialDeposit {
  networkKey: string,
  token: string
}

export interface RequestSaveRecentAccount {
  accountId: string;
}

export interface SubstrateNftTransactionRequest {
  params: Record<string, any>;
  senderAddress: string;
  recipientAddress: string;
  networkKey: string;
}

export interface SubstrateNftTransaction {
  error: boolean;
  estimatedFee?: string;
  balanceError: boolean;
}

export interface SubstrateNftSubmitTransaction {
  params: Record<string, any> | null;
  password: string;
  senderAddress: string;
  recipientAddress: string;
}

export type ChainRelationType = 'p' | 'r'; // parachain | relaychain

export interface ChainRelationInfo {
  type: ChainRelationType;
  supportedToken: string[];
}

export interface CrossChainRelation {
  type: ChainRelationType;
  relationMap: Record<string, ChainRelationInfo>;
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

export interface EvmProviderRpcErrorInterface extends Error{
  message: string;
  code: number;
  data?: unknown;
}

export type EvmRpcErrorHelperMap = Record<'USER_REJECTED_REQUEST'| 'UNAUTHORIZED'| 'UNSUPPORTED_METHOD'| 'DISCONNECTED'| 'CHAIN_DISCONNECTED'| 'INVALID_PARAMS'| 'INTERNAL_ERROR', [number, string]>;

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

export interface ConfirmationsQueueItem<T> extends ConfirmationsQueueItemOptions{
  id: string;
  url: string;
  payload: T;
  payloadJson: string;
}

export interface ConfirmationResult<T> {
  id: string;
  isApproved: boolean;
  url?: string;
  payload?: T
  password?: string
}

export interface EvmSendTransactionRequest extends TransactionConfig {
  estimateGas: string;
}

export interface ConfirmationDefinitions {
  addNetworkRequest: [ConfirmationsQueueItem<NetworkJson>, ConfirmationResult<NetworkJson>],
  addTokenRequest: [ConfirmationsQueueItem<CustomEvmToken>, ConfirmationResult<boolean>],
  switchNetworkRequest: [ConfirmationsQueueItem<SwitchNetworkRequest>, ConfirmationResult<boolean>],
  evmSignatureRequest: [ConfirmationsQueueItem<EvmSignatureRequest>, ConfirmationResult<string>],
  evmSendTransactionRequest: [ConfirmationsQueueItem<EvmSendTransactionRequest>, ConfirmationResult<boolean>]
}

export type ConfirmationType = keyof ConfirmationDefinitions;

export type ConfirmationsQueue = {
  [ConfirmationType in keyof ConfirmationDefinitions]: Record<string, ConfirmationDefinitions[ConfirmationType][0]>;
}

export type RequestConfirmationsSubscribe = null;

// Design to use only one confirmation
export type RequestConfirmationComplete = {
  [ConfirmationType in keyof ConfirmationDefinitions]?: ConfirmationDefinitions[ConfirmationType][1];
}

export interface ValidatorInfo {
  address: string;
  totalStake: number;
  ownStake: number;
  otherStake: number;
  nominatorCount: number;
  commission?: number;
  expectedReturn?: number;
  blocked: boolean;
  identity?: string;
  isVerified: boolean;
  minBond: number;
  isNominated: boolean; // this validator has been staked to before
}

export interface BondingOptionInfo {
  isBondedBefore: boolean,
  era: number,
  maxNominations: number,
  maxNominatorPerValidator: number,
  validators: ValidatorInfo[],
  bondedValidators: string[]
}

export interface ChainBondingBasics {
  stakedReturn: number,
  // minBond: number,
  isMaxNominators: boolean
}

export interface BasicTxInfo {
  fee: string,
  balanceError: boolean
}

export interface BondingSubmitParams {
  networkKey: string,
  nominatorAddress: string,
  amount: number,
  validatorInfo: ValidatorInfo,
  password?: string,
  isBondedBefore: boolean,
  bondedValidators: string[],
}

export interface BasicTxResponse {
  passwordError?: string | null,
  callHash?: string,
  status?: boolean,
  transactionHash?: string,
  txError?: boolean,
}

export interface BondingOptionParams {
  networkKey: string;
  address: string;
}

export interface UnbondingSubmitParams {
  amount: number,
  networkKey: string,
  address: string,
  password?: string,
  validatorAddress?: string
}

export interface UnlockingStakeParams {
  address: string,
  networkKey: string,
  validatorList?: string[]
}

export interface UnlockingStakeInfo {
  nextWithdrawal: number,
  redeemable: number,
  nextWithdrawalAmount: number,
  nextWithdrawalAction?: 'bondLess' | 'revoke',
  validatorAddress?: string // validator to unstake from
}

export interface StakeWithdrawalParams {
  address: string,
  networkKey: string,
  password?: string,
  validatorAddress?: string
}

export interface KoniRequestSignatures {
  'pri(unbonding.submitWithdrawal)': [StakeWithdrawalParams, BasicTxResponse, BasicTxResponse]
  'pri(unbonding.withdrawalTxInfo)': [StakeWithdrawalParams, BasicTxInfo];
  'pri(unbonding.unlockingInfo)': [UnlockingStakeParams, UnlockingStakeInfo];
  'pri(unbonding.submitTransaction)': [UnbondingSubmitParams, BasicTxResponse, BasicTxResponse];
  'pri(unbonding.txInfo)': [UnbondingSubmitParams, BasicTxInfo];
  'pri(bonding.txInfo)': [BondingSubmitParams, BasicTxInfo];
  'pri(bonding.submitTransaction)': [BondingSubmitParams, BasicTxResponse, BasicTxResponse];
  'pri(bonding.getChainBondingBasics)': [NetworkJson[], Record<string, ChainBondingBasics>];
  'pri(bonding.getBondingOptions)': [BondingOptionParams, BondingOptionInfo];
  'pri(networkMap.recoverDotSama)': [string, boolean];
  'pri(substrateNft.submitTransaction)': [SubstrateNftSubmitTransaction, NftTransactionResponse, NftTransactionResponse]
  'pri(substrateNft.getTransaction)': [SubstrateNftTransactionRequest, SubstrateNftTransaction];
  'pri(networkMap.disableAll)': [null, boolean];
  'pri(networkMap.enableAll)': [null, boolean];
  'pri(networkMap.resetDefault)': [null, boolean];
  'pri(apiMap.validate)': [ValidateNetworkRequest, ValidateNetworkResponse];
  'pri(networkMap.enableMany)': [string[], boolean];
  'pri(networkMap.enableOne)': [string, boolean];
  'pri(networkMap.disableOne)': [string, DisableNetworkResponse];
  'pri(networkMap.removeOne)': [string, boolean];
  'pri(networkMap.upsert)': [NetworkJson, boolean];
  'pri(networkMap.getNetworkMap)': [null, Record<string, NetworkJson>];
  'pri(networkMap.getSubscription)': [null, Record<string, NetworkJson>, Record<string, NetworkJson>];
  'pri(evmTokenState.validateEvmToken)': [ValidateEvmTokenRequest, ValidateEvmTokenResponse];
  'pri(evmTokenState.deleteMany)': [DeleteEvmTokenParams[], boolean];
  'pri(evmTokenState.upsertEvmTokenState)': [CustomEvmToken, boolean];
  'pri(evmTokenState.getEvmTokenState)': [null, EvmTokenJson];
  'pri(evmTokenState.getSubscription)': [null, EvmTokenJson, EvmTokenJson];
  'pri(evmNft.submitTransaction)': [EvmNftSubmitTransaction, NftTransactionResponse, NftTransactionResponse];
  'pri(evmNft.getTransaction)': [EvmNftTransactionRequest, EvmNftTransaction];
  'pri(nftTransfer.setNftTransfer)': [NftTransferExtra, boolean];
  'pri(nftTransfer.getNftTransfer)': [null, NftTransferExtra];
  'pri(nftTransfer.getSubscription)': [null, NftTransferExtra, NftTransferExtra];
  'pri(nft.forceUpdate)': [RequestNftForceUpdate, boolean];
  'pri(staking.getStaking)': [null, StakingJson];
  'pri(staking.getSubscription)': [RequestSubscribeStaking, StakingJson, StakingJson];
  'pri(stakingReward.getStakingReward)': [null, StakingRewardJson];
  'pri(stakingReward.getSubscription)': [RequestSubscribeStakingReward, StakingRewardJson, StakingRewardJson];
  'pri(nft.getNft)': [null, NftJson];
  'pri(nft.getSubscription)': [RequestSubscribeNft, NftJson, NftJson];
  'pri(nftCollection.getNftCollection)': [null, NftCollectionJson];
  'pri(nftCollection.getSubscription)': [null, NftCollectionJson, NftCollectionJson];
  'pri(price.getPrice)': [RequestPrice, PriceJson];
  'pri(price.getSubscription)': [RequestSubscribePrice, PriceJson, PriceJson];
  'pri(balance.getBalance)': [RequestBalance, BalanceJson];
  'pri(balance.getSubscription)': [RequestSubscribeBalance, BalanceJson, BalanceJson];
  'pri(crowdloan.getCrowdloan)': [RequestCrowdloan, CrowdloanJson];
  'pri(crowdloan.getSubscription)': [RequestSubscribeCrowdloan, CrowdloanJson, CrowdloanJson];
  'pri(authorize.listV2)': [null, ResponseAuthorizeList];
  'pri(authorize.requestsV2)': [RequestAuthorizeSubscribe, boolean, AuthorizeRequest[]];
  'pri(authorize.approveV2)': [RequestAuthorizeApproveV2, boolean];
  'pri(authorize.changeSiteAll)': [RequestAuthorizationAll, boolean, AuthUrls];
  'pri(authorize.changeSite)': [RequestAuthorization, boolean, AuthUrls];
  'pri(authorize.changeSitePerAccount)': [RequestAuthorizationPerAccount, boolean, AuthUrls];
  'pri(authorize.forgetSite)': [RequestForgetSite, boolean, AuthUrls];
  'pri(authorize.forgetAllSite)': [null, boolean, AuthUrls];
  'pri(authorize.rejectV2)': [RequestAuthorizeReject, boolean];
  'pri(authorize.cancelV2)': [RequestAuthorizeCancel, boolean];
  'pri(seed.createV2)': [RequestSeedCreateV2, ResponseSeedCreateV2];
  'pri(seed.validateV2)': [RequestSeedValidateV2, ResponseSeedValidateV2];
  'pri(privateKey.validateV2)': [RequestSeedValidateV2, ResponsePrivateKeyValidateV2];
  'pri(accounts.create.suriV2)': [RequestAccountCreateSuriV2, ResponseAccountCreateSuriV2];
  'pri(accounts.checkTransfer)': [RequestCheckTransfer, ResponseCheckTransfer];
  'pri(accounts.checkCrossChainTransfer)': [RequestCheckCrossChainTransfer, ResponseCheckCrossChainTransfer];
  'pri(accounts.transfer)': [RequestTransfer, Array<TransferError>, ResponseTransfer];
  'pri(accounts.crossChainTransfer)': [RequestCrossChainTransfer, Array<TransferError>, ResponseTransfer];
  'pri(derivation.createV2)': [RequestDeriveCreateV2, boolean];
  'pri(json.restoreV2)': [RequestJsonRestoreV2, void];
  'pri(json.batchRestoreV2)': [RequestBatchRestoreV2, void];
  'pri(accounts.exportPrivateKey)': [RequestAccountExportPrivateKey, ResponseAccountExportPrivateKey];
  'pri(accounts.subscribeWithCurrentAddress)': [RequestAccountSubscribe, boolean, AccountsWithCurrentAddress];
  'pri(accounts.subscribeAccountsInputAddress)': [RequestAccountSubscribe, string, OptionInputAddress];
  'pri(accounts.saveRecent)': [RequestSaveRecentAccount, SingleAddress];
  'pri(accounts.triggerSubscription)': [null, boolean];
  'pri(currentAccount.saveAddress)': [RequestCurrentAccountAddress, boolean, CurrentAccountInfo];
  'pri(settings.changeBalancesVisibility)': [null, boolean, ResponseSettingsType];
  'pri(settings.subscribe)': [null, ResponseSettingsType, ResponseSettingsType];
  'pri(settings.saveAccountAllLogo)': [string, boolean, ResponseSettingsType];
  'pri(settings.saveTheme)': [ThemeTypes, boolean, ResponseSettingsType];
  'pri(chainRegistry.getSubscription)': [null, Record<string, ChainRegistry>, Record<string, ChainRegistry>];
  'pri(transaction.history.getSubscription)': [null, Record<string, TransactionHistoryItemType[]>, Record<string, TransactionHistoryItemType[]>];
  'pri(transaction.history.add)': [RequestTransactionHistoryAdd, boolean, TransactionHistoryItemType[]];
  'pri(transfer.checkReferenceCount)': [RequestTransferCheckReferenceCount, boolean];
  'pri(transfer.checkSupporting)': [RequestTransferCheckSupporting, SupportTransferResponse];
  'pri(transfer.getExistentialDeposit)': [RequestTransferExistentialDeposit, string];
  'pri(subscription.cancel)': [string, boolean];
  'pri(freeBalance.subscribe)': [RequestFreeBalance, string, string];

  // Confirmation Queues
  'pri(confirmations.subscribe)': [RequestConfirmationsSubscribe, ConfirmationsQueue, ConfirmationsQueue],
  'pri(confirmations.complete)': [RequestConfirmationComplete, boolean]

  'pub(utils.getRandom)': [RandomTestRequest, number];
  'pub(accounts.listV2)': [RequestAccountList, InjectedAccount[]];
  'pub(accounts.subscribeV2)': [RequestAccountSubscribe, boolean, InjectedAccount[]];

  // EVM inject request
  'evm(events.subscribe)': [RequestEvmEvents, boolean, EvmEvent];
  'evm(request)': [RequestArguments, unknown];
  'evm(provider.send)': [RequestEvmProviderSend, string | number, ResponseEvmProviderSend]
}
