// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _AssetRef, _AssetType, _ChainAsset, _ChainInfo, _FundStatus, _MultiChainAsset } from '@subwallet/chain-list/types';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { AuthUrls, Resolver } from '@subwallet/extension-base/background/handlers/State';
import { AccountAuthType, AccountJson, AddressJson, AuthorizeRequest, ConfirmationRequestBase, RequestAccountList, RequestAccountSubscribe, RequestAccountUnsubscribe, RequestAuthorizeCancel, RequestAuthorizeReject, RequestAuthorizeSubscribe, RequestAuthorizeTab, RequestCurrentAccountAddress, ResponseAuthorizeList, ResponseJsonGetAccountInfo, SeedLengths } from '@subwallet/extension-base/background/types';
import { RequestOptimalTransferProcess } from '@subwallet/extension-base/services/balance-service/helpers';
import { _CHAIN_VALIDATION_ERROR } from '@subwallet/extension-base/services/chain-service/handler/types';
import { _ChainState, _EvmApi, _NetworkUpsertParams, _SubstrateApi, _ValidateCustomAssetRequest, _ValidateCustomAssetResponse, EnableChainParams, EnableMultiChainParams } from '@subwallet/extension-base/services/chain-service/types';
import { AppBannerData, AppConfirmationData, AppPopupData } from '@subwallet/extension-base/services/mkt-campaign-service/types';
import { CrowdloanContributionsResponse } from '@subwallet/extension-base/services/subscan-service/types';
import { SWTransactionResponse, SWTransactionResult } from '@subwallet/extension-base/services/transaction-service/types';
import { WalletConnectNotSupportRequest, WalletConnectSessionRequest } from '@subwallet/extension-base/services/wallet-connect-service/types';
import { BalanceJson, BuyServiceInfo, BuyTokenInfo, EarningRewardHistoryItem, EarningRewardJson, EarningStatus, HandleYieldStepParams, LeavePoolAdditionalData, NominationPoolInfo, OptimalYieldPath, OptimalYieldPathParams, RequestEarlyValidateYield, RequestGetYieldPoolTargets, RequestMetadataHash, RequestShortenMetadata, RequestStakeCancelWithdrawal, RequestStakeClaimReward, RequestUnlockDotCheckCanMint, RequestUnlockDotSubscribeMintedData, RequestYieldLeave, RequestYieldStepSubmit, RequestYieldWithdrawal, ResponseEarlyValidateYield, ResponseGetYieldPoolTargets, ResponseMetadataHash, ResponseShortenMetadata, StorageDataInterface, SubmitYieldStepData, TokenSpendingApprovalParams, UnlockDotTransactionNft, UnstakingStatus, ValidateYieldProcessParams, YieldPoolInfo, YieldPositionInfo, YieldValidationStatus } from '@subwallet/extension-base/types';
import { CommonOptimalPath } from '@subwallet/extension-base/types/service-base';
import { SwapErrorType, SwapPair, SwapQuoteResponse, SwapRequest, SwapRequestResult, SwapSubmitParams, SwapTxData, ValidateSwapProcessParams } from '@subwallet/extension-base/types/swap';
import { InjectedAccount, InjectedAccountWithMeta, MetadataDefBase } from '@subwallet/extension-inject/types';
import { KeyringPair$Json, KeyringPair$Meta } from '@subwallet/keyring/types';
import { KeyringOptions } from '@subwallet/ui-keyring/options/types';
import { KeyringAddress, KeyringPairs$Json } from '@subwallet/ui-keyring/types';
import { SessionTypes } from '@walletconnect/types/dist/types/sign-client/session';
import { DexieExportJsonStructure } from 'dexie-export-import';
import Web3 from 'web3';
import { RequestArguments, TransactionConfig } from 'web3-core';
import { JsonRpcPayload, JsonRpcResponse } from 'web3-core-helpers';

import { ExtDef } from '@polkadot/types/extrinsic/signedExtensions/types';
import { SignerResult } from '@polkadot/types/types/extrinsic';
import { HexString } from '@polkadot/util/types';
import { KeypairType } from '@polkadot/util-crypto/types';

import { TransactionWarning } from './warnings/TransactionWarning';

export enum RuntimeEnvironment {
  Web = 'Web',
  Node = 'Node',
  ExtensionChrome = 'Extension (Chrome)',
  ExtensionFirefox = 'Extension (Firefox)',
  WebWorker = 'Web Worker',
  ServiceWorker = 'Service Worker',
  Unknown = 'Unknown',
}

export interface RuntimeEnvironmentInfo {
  environment: RuntimeEnvironment;
  version: string;
  host?: string;
  protocol?: string;
}

export type TargetEnvironment = 'extension' | 'webapp' | 'mobile';

export interface EnvironmentSupport {
  MANTA_ZK: boolean;
}

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
  accountAuthType: AccountAuthType;
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

/// Staking subscribe

export enum StakingType {
  NOMINATED = 'nominated',
  POOLED = 'pooled',
  LIQUID_STAKING = 'liquid_staking'
}

export interface StakingRewardItem {
  state: APIItemState,
  name: string,
  chain: string,
  address: string,
  type: StakingType,

  latestReward?: string,
  totalReward?: string,
  totalSlash?: string,
  unclaimedReward?: string
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

  state: APIItemState
}

export interface StakingJson {
  reset?: boolean,
  ready?: boolean,
  details: StakingItem[]
}

export interface StakingRewardJson {
  ready: boolean;
  data: Record<string, StakingRewardItem>;
}

export interface PriceJson {
  currency: CurrencyType;
  ready?: boolean,
  currencyData: CurrencyJson,
  exchangeRateMap: Record<string, ExchangeRateJSON>,
  priceMap: Record<string, number>,
  price24hMap: Record<string, number>
}

export interface ExchangeRateJSON {
  exchange: number;
  label: string;
}

export interface CurrencyJson {
  label: string;
  isPrefix: boolean;
  symbol: string;
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

export interface NftItem extends NftItemExtraInfo {
  // must-have
  id: string;
  chain: string;
  collectionId: string;
  owner: string;
  originAsset?: string;

  name?: string;
  image?: string;
  externalUrl?: string;
  rarity?: string;
  description?: string;
  properties?: Record<any, any> | null;
}

interface NftItemExtraInfo {
  type?: _AssetType.ERC721 | _AssetType.PSP34 | RMRK_VER; // for sending
  rmrk_ver?: RMRK_VER;
  onChainOption?: any; // for sending PSP-34 tokens, should be done better
  assetHubType?: AssetHubNftType // for sending assetHub nft. There're 2 types nft
}

export enum AssetHubNftType {
  NFTS = 'nfts',
  UNIQUES = 'uniques'
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

export interface MetadataItem {
  genesisHash: string;
  specName: string;
  specVersion: string;
  hexValue: HexString;
  types: Record<string, Record<string, string> | string>;
  userExtensions?: ExtDef;
  hexV15?: HexString;
}

export interface CrowdloanItem {
  state: APIItemState,
  paraState?: CrowdloanParaState,
  contribute: string,
  fundId: string;
  paraId: number;
  status: _FundStatus;
  startTime: Date;
  endTime: Date;
  auctionIndex: number;
  firstPeriod: number;
  lastPeriod: number;
}

export interface CrowdloanJson {
  reset?: boolean,
  details: Record<string, CrowdloanItem>
}

export type NetWorkGroup =
  'RELAY_CHAIN'
  | 'POLKADOT_PARACHAIN'
  | 'KUSAMA_PARACHAIN'
  | 'MAIN_NET'
  | 'TEST_NET'
  | 'UNKNOWN';

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
  isEthereum?: boolean; // Only show network with isEthereum=true when select one Evm account // user input
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
  isShowBalance?: boolean; // Deprecated and move to setting
  allAccountLogo?: string; // Deprecated and move to setting
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
| 'zh'
| 'fr'
| 'tr'
| 'pl'
| 'th'
| 'ur'
| 'vi'
| 'ja'
| 'ru';

export type CurrencyType = 'USD'
| 'BRL'
| 'CNY'
| 'EUR'
| 'GBP'
| 'HKD'
| 'JPY'
| 'RUB'
| 'VND'

export type LanguageOptionType = {
  text: string;
  value: LanguageType;
}

export type BrowserConfirmationType = 'extension' | 'popup' | 'window';

export enum WalletUnlockType {
  ALWAYS_REQUIRED = 'always_required',
  WHEN_NEEDED = 'when_needed',
}

export interface UiSettings {
  language: LanguageType,
  currency: string,
  browserConfirmationType: BrowserConfirmationType;
  isShowZeroBalance: boolean;
  isShowBalance: boolean;
  accountAllLogo: string;
  theme: ThemeNames;
  camera: boolean;
  timeAutoLock: number;
  unlockType: WalletUnlockType;
  enableChainPatrol: boolean;
  // On-ramp service account reference
  walletReference: string;
}

export type RequestSettingsType = UiSettings;

export type RequestCameraSettings = { camera: boolean };

export type RequestChangeTimeAutoLock = { autoLockTime: number };

export type RequestUnlockType = { unlockType: WalletUnlockType };

export type RequestChangeEnableChainPatrol = { enable: boolean };

export type RequestChangeShowZeroBalance = { show: boolean };

export type RequestChangeLanguage = { language: LanguageType };

export type RequestChangePriceCurrency = { currency: CurrencyType }

export type RequestChangeShowBalance = { enable: boolean };

export type DetectBalanceCache = Record<string, number>;

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

  STAKING_JOIN_POOL = 'staking.join_pool',
  STAKING_LEAVE_POOL = 'staking.leave_pool',
  STAKING_POOL_WITHDRAW = 'staking.pool_withdraw',
  STAKING_BOND = 'staking.bond',
  STAKING_UNBOND = 'staking.unbond',
  STAKING_CLAIM_REWARD = 'staking.claim_reward',
  STAKING_WITHDRAW = 'staking.withdraw',
  STAKING_COMPOUNDING = 'staking.compounding',
  STAKING_CANCEL_COMPOUNDING = 'staking.cancel_compounding',
  STAKING_CANCEL_UNSTAKE = 'staking.cancel_unstake',

  JOIN_YIELD_POOL = 'earn.join_pool', // TODO: review this
  MINT_VDOT = 'earn.mint_vdot',
  MINT_LDOT = 'earn.mint_ldot',
  MINT_SDOT = 'earn.mint_sdot',
  MINT_QDOT = 'earn.mint_qdot',
  MINT_STDOT = 'earn.mint_stdot',
  MINT_VMANTA = 'earn.mint_vmanta',

  REDEEM_QDOT = 'earn.redeem_qdot',
  REDEEM_VDOT = 'earn.redeem_vdot',
  REDEEM_LDOT = 'earn.redeem_ldot',
  REDEEM_SDOT = 'earn.redeem_sdot',
  REDEEM_STDOT = 'earn.redeem_stdot',
  REDEEM_VMANTA = 'earn.redeem_vmanta',

  UNSTAKE_QDOT = 'earn.unstake_qdot',
  UNSTAKE_VDOT = 'earn.unstake_vdot',
  UNSTAKE_LDOT = 'earn.unstake_ldot',
  UNSTAKE_SDOT = 'earn.unstake_sdot',
  UNSTAKE_STDOT = 'earn.unstake_stdot',
  UNSTAKE_VMANTA = 'earn.unstake_vmanta',

  TOKEN_SPENDING_APPROVAL = 'token.spending_approval',

  SWAP = 'swap',

  // SET_FEE_TOKEN = 'set_fee-token',

  EVM_EXECUTE = 'evm.execute',
  UNKNOWN = 'unknown'
}

export interface ExtrinsicDataTypeMap {
  // Transfer
  [ExtrinsicType.TRANSFER_BALANCE]: RequestTransfer,
  [ExtrinsicType.TRANSFER_TOKEN]: RequestTransfer,
  [ExtrinsicType.TRANSFER_XCM]: RequestCrossChainTransfer,

  // NFT
  [ExtrinsicType.SEND_NFT]: NftTransactionRequest,

  // Staking
  [ExtrinsicType.STAKING_JOIN_POOL]: RequestStakePoolingBonding,
  [ExtrinsicType.STAKING_LEAVE_POOL]: RequestYieldLeave,
  [ExtrinsicType.STAKING_BOND]: RequestStakePoolingBonding,
  [ExtrinsicType.STAKING_UNBOND]: RequestUnbondingSubmit,
  [ExtrinsicType.STAKING_CLAIM_REWARD]: RequestStakeClaimReward,
  [ExtrinsicType.STAKING_WITHDRAW]: RequestYieldWithdrawal,
  [ExtrinsicType.STAKING_COMPOUNDING]: RequestTuringStakeCompound,
  [ExtrinsicType.STAKING_CANCEL_COMPOUNDING]: RequestTuringCancelStakeCompound,
  [ExtrinsicType.STAKING_CANCEL_UNSTAKE]: RequestStakeCancelWithdrawal,
  [ExtrinsicType.STAKING_POOL_WITHDRAW]: any,

  // Yield
  [ExtrinsicType.JOIN_YIELD_POOL]: RequestYieldStepSubmit,
  [ExtrinsicType.MINT_VDOT]: SubmitYieldStepData,
  [ExtrinsicType.MINT_LDOT]: SubmitYieldStepData,
  [ExtrinsicType.MINT_SDOT]: SubmitYieldStepData,
  [ExtrinsicType.MINT_QDOT]: SubmitYieldStepData,
  [ExtrinsicType.MINT_STDOT]: SubmitYieldStepData,
  [ExtrinsicType.MINT_STDOT]: SubmitYieldStepData,
  [ExtrinsicType.MINT_VMANTA]: SubmitYieldStepData,

  [ExtrinsicType.UNSTAKE_VDOT]: RequestYieldLeave,
  [ExtrinsicType.UNSTAKE_QDOT]: RequestYieldLeave,
  [ExtrinsicType.UNSTAKE_LDOT]: RequestYieldLeave,
  [ExtrinsicType.UNSTAKE_SDOT]: RequestYieldLeave,
  [ExtrinsicType.UNSTAKE_STDOT]: RequestYieldLeave,
  [ExtrinsicType.UNSTAKE_VMANTA]: RequestYieldLeave,

  [ExtrinsicType.REDEEM_VDOT]: RequestYieldLeave,
  [ExtrinsicType.REDEEM_QDOT]: RequestYieldLeave,
  [ExtrinsicType.REDEEM_LDOT]: RequestYieldLeave,
  [ExtrinsicType.REDEEM_SDOT]: RequestYieldLeave,
  [ExtrinsicType.REDEEM_STDOT]: RequestYieldLeave,
  [ExtrinsicType.REDEEM_VMANTA]: RequestYieldLeave,

  [ExtrinsicType.TOKEN_SPENDING_APPROVAL]: TokenSpendingApprovalParams,

  [ExtrinsicType.EVM_EXECUTE]: TransactionConfig,
  [ExtrinsicType.CROWDLOAN]: any,
  [ExtrinsicType.SWAP]: SwapTxData
  [ExtrinsicType.UNKNOWN]: any
}

export enum ExtrinsicStatus {
  QUEUED = 'queued', // Transaction in queue
  SUBMITTING = 'submitting', // Transaction in queue
  PROCESSING = 'processing', // Transaction is sending
  SUCCESS = 'success', // Send successfully
  FAIL = 'fail', // Send failed
  CANCELLED = 'cancelled', // Is remove before sending,
  TIMEOUT = 'timeout',
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

export interface BasicTokenInfo {
  decimals: number;
  symbol: string;
}

export interface AmountData extends BasicTokenInfo {
  value: string;
  metadata?: unknown;
}

export interface FeeData extends AmountData {
  tooHigh?: boolean;
}

export interface AmountDataWithId extends AmountData {
  id: string;
}

export interface XCMTransactionAdditionalInfo {
  destinationChain: string,
  originalChain: string,
  fee?: AmountData
}

export interface NFTTransactionAdditionalInfo {
  collectionName: string;
}

export type TransactionAdditionalInfo = {
  [ExtrinsicType.TRANSFER_XCM]: XCMTransactionAdditionalInfo,
  [ExtrinsicType.SEND_NFT]: NFTTransactionAdditionalInfo,
  [ExtrinsicType.MINT_VDOT]: Pick<SubmitYieldStepData, 'derivativeTokenSlug' | 'exchangeRate' | 'slug'>,
  [ExtrinsicType.MINT_VMANTA]: Pick<SubmitYieldStepData, 'derivativeTokenSlug' | 'exchangeRate' | 'slug'>,
  [ExtrinsicType.MINT_QDOT]: Pick<SubmitYieldStepData, 'derivativeTokenSlug' | 'exchangeRate' | 'slug'>,
  [ExtrinsicType.MINT_SDOT]: Pick<SubmitYieldStepData, 'derivativeTokenSlug' | 'exchangeRate' | 'slug'>,
  [ExtrinsicType.MINT_LDOT]: Pick<SubmitYieldStepData, 'derivativeTokenSlug' | 'exchangeRate' | 'slug'>,
  [ExtrinsicType.MINT_STDOT]: Pick<SubmitYieldStepData, 'derivativeTokenSlug' | 'exchangeRate' | 'slug'>,
  [ExtrinsicType.REDEEM_VDOT]: LeavePoolAdditionalData,
  [ExtrinsicType.REDEEM_VMANTA]: LeavePoolAdditionalData,
  [ExtrinsicType.REDEEM_QDOT]: LeavePoolAdditionalData,
  [ExtrinsicType.REDEEM_SDOT]: LeavePoolAdditionalData,
  [ExtrinsicType.REDEEM_LDOT]: LeavePoolAdditionalData,
  [ExtrinsicType.REDEEM_STDOT]: LeavePoolAdditionalData,
  [ExtrinsicType.UNSTAKE_VDOT]: LeavePoolAdditionalData,
  [ExtrinsicType.UNSTAKE_VMANTA]: LeavePoolAdditionalData,
  [ExtrinsicType.UNSTAKE_QDOT]: LeavePoolAdditionalData,
  [ExtrinsicType.UNSTAKE_SDOT]: LeavePoolAdditionalData,
  [ExtrinsicType.UNSTAKE_LDOT]: LeavePoolAdditionalData,
  [ExtrinsicType.UNSTAKE_STDOT]: LeavePoolAdditionalData,
  [ExtrinsicType.STAKING_UNBOND]: Pick<SubmitYieldStepData, 'inputTokenSlug' | 'exchangeRate'>
}

// export type TransactionAdditionalInfo<T extends ExtrinsicType> = T extends ExtrinsicType.TRANSFER_XCM
//   ? XCMTransactionAdditionalInfo
//   : T extends ExtrinsicType.SEND_NFT
//     ? NFTTransactionAdditionalInfo
//     : T extends ExtrinsicType.MINT_VDOT
//       ? Pick<SubmitBifrostLiquidStaking, 'rewardTokenSlug' | 'estimatedAmountReceived'>
//       : undefined;
export interface TransactionHistoryItem<ET extends ExtrinsicType = ExtrinsicType.TRANSFER_BALANCE> {
  origin?: 'app' | 'migration' | 'subsquid' | 'subscan', // 'app' or history source
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
  transactionId?: string, // Available for transaction history
  extrinsicHash: string,
  time: number,
  data?: string,
  blockNumber: number,
  blockHash: string,
  amount?: AmountData,
  tip?: AmountData,
  fee?: AmountData,
  explorerUrl?: string,
  additionalInfo?: any,
  startBlock?: number,
  nonce?: number,
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
  TIMEOUT = 'TIMEOUT',
  NOT_ENOUGH_EXISTENTIAL_DEPOSIT = 'NOT_ENOUGH_EXISTENTIAL_DEPOSIT',
}

export enum StakingTxErrorType {
  NOT_ENOUGH_MIN_STAKE = 'NOT_ENOUGH_MIN_STAKE',
  EXCEED_MAX_NOMINATIONS = 'EXCEED_MAX_NOMINATIONS',
  EXIST_UNSTAKING_REQUEST = 'EXIST_UNSTAKING_REQUEST',
  INVALID_ACTIVE_STAKE = 'INVALID_ACTIVE_STAKE',
  EXCEED_MAX_UNSTAKING = 'EXCEED_MAX_UNSTAKING',
  INACTIVE_NOMINATION_POOL = 'INACTIVE_NOMINATION_POOL',
  CAN_NOT_GET_METADATA = 'CAN_NOT_GET_METADATA',
  NOT_ENOUGH_MIN_UNSTAKE = 'NOT_ENOUGH_MIN_UNSTAKE'
}

export enum TransferTxErrorType {
  NOT_ENOUGH_VALUE = 'NOT_ENOUGH_VALUE',
  NOT_ENOUGH_FEE = 'NOT_ENOUGH_FEE',
  INVALID_TOKEN = 'INVALID_TOKEN',
  TRANSFER_ERROR = 'TRANSFER_ERROR',
  RECEIVER_NOT_ENOUGH_EXISTENTIAL_DEPOSIT = 'RECEIVER_NOT_ENOUGH_EXISTENTIAL_DEPOSIT',
}

export type TransactionErrorType = BasicTxErrorType | TransferTxErrorType | StakingTxErrorType | YieldValidationStatus | SwapErrorType

export enum BasicTxWarningCode {
  NOT_ENOUGH_EXISTENTIAL_DEPOSIT = 'notEnoughExistentialDeposit'
}

export interface TransactionResponse {
  extrinsicHash?: string;
  txError?: boolean;
  errors?: TransactionError[];
  status?: boolean;
  txResult?: TxResultType;
  passwordError?: string | null;
}

export interface NftTransactionResponse extends SWTransactionResponse {
  isSendingSelf: boolean;
}

export type HandleBasicTx = (data: TransactionResponse) => void;

export enum BalanceErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  TOKEN_ERROR = 'TOKEN_ERROR',
  TIMEOUT = 'TIMEOUT',
  GET_BALANCE_ERROR = 'GET_BALANCE_ERROR',
}

export type TransactionWarningType = BasicTxWarningCode

export enum ProviderErrorType {
  CHAIN_DISCONNECTED = 'CHAIN_DISCONNECTED',
  INVALID_PARAMS = 'INVALID_PARAMS',
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  USER_REJECT = 'USER_REJECT',
}

/// Manage account
// Export private key

export interface RequestAccountExportPrivateKey {
  address: string;
  password: string;
}

export interface ResponseAccountExportPrivateKey {
  privateKey: string;
  publicKey: string;
}

// Export batch accounts

export interface RequestAccountBatchExportV2 {
  password: string;
  addresses?: string[];
}

export interface ResponseAccountBatchExportV2 {
  exportedJson: KeyringPairs$Json;
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

export interface AccountExternalError {
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
  originGenesisHash: string;
  hardwareType: string;
  name: string;
  isAllowed?: boolean;
}

export interface CreateHardwareAccountItem {
  accountIndex: number;
  address: string;
  addressOffset: number;
  genesisHash: string;
  originGenesisHash: string;
  hardwareType: string;
  name: string;
  isEthereum: boolean;
  isGeneric: boolean;
}

export interface RequestAccountCreateHardwareMultiple {
  accounts: CreateHardwareAccountItem[];
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

// Subscribe Address Book

export interface AddressBookInfo {
  addresses: AddressJson[];
}

export interface RequestEditContactAccount {
  address: string;
  meta: KeyringPair$Meta;
}

export interface RequestDeleteContactAccount {
  address: string;
}

// Inject account

export interface RequestAddInjectedAccounts {
  accounts: InjectedAccountWithMeta[];
}

export interface RequestRemoveInjectedAccounts {
  addresses: string[];
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
export type RequestCrowdloanContributions = {
  relayChain: string;
  address: string;
  page?: number;
};
export type RequestSubscribeCrowdloan = null
export type RequestSubscribeNft = null
export type RequestSubscribeStaking = null
export type RequestSubscribeStakingReward = null

export enum ThemeNames {
  LIGHT = 'light',
  DARK = 'dark',
  SUBSPACE = 'subspace'
}

export enum NETWORK_STATUS {
  CONNECTED = 'connected',
  CONNECTING = 'connecting',
  DISCONNECTED = 'disconnected',
  PENDING = 'pending'
}

// eslint-disable-next-line @typescript-eslint/ban-types
export type BaseRequestSign = {
  ignoreWarnings?: boolean;
};

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

  nftItemName?: string, // Use for confirmation view only
  params: Record<string, any>,
  nftItem: NftItem
}

export interface EvmNftTransaction extends ValidateTransactionResponse {
  tx: Record<string, any> | null;
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

export interface RequestFreeBalance {
  address: string,
  networkKey: string,
  token?: string,
  extrinsicType?: ExtrinsicType
}

export interface RequestMaxTransferable {
  address: string,
  networkKey: string,
  token?: string,
  isXcmTransfer?: boolean,
  destChain: string
}

export interface RequestSaveRecentAccount {
  accountId: string;
  chain?: string;
}

export interface SubstrateNftTransaction {
  error: boolean;
  estimatedFee?: string;
  balanceError: boolean;
}

export interface SubstrateNftSubmitTransaction extends BaseRequestSign {
  params: Record<string, any> | null;
  senderAddress: string;
  nftItemName?: string;
  recipientAddress: string;
}

export type RequestSubstrateNftSubmitTransaction = InternalRequestSign<SubstrateNftSubmitTransaction>;

export interface RequestAccountMeta {
  address: string | Uint8Array;
}

export interface ResponseAccountMeta {
  meta: KeyringPair$Meta;
}

export type RequestEvmEvents = null;
export type EvmEventType =
  'connect'
  | 'disconnect'
  | 'accountsChanged'
  | 'chainChanged'
  | 'message'
  | 'data'
  | 'reconnect'
  | 'error';
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
  data?: string;
  gas?: string | number;
}

export interface EvmSignRequest {
  account: AccountJson;
  hashPayload: string;
  canSign: boolean;
}

export interface ErrorValidation {
  message: string;
  name: string;
}

export interface EvmSignatureRequest extends EvmSignRequest {
  id: string;
  type: string;
  payload: unknown;
  errors?: ErrorValidation[]
}

export interface EvmSendTransactionRequest extends TransactionConfig, EvmSignRequest {
  estimateGas: string;
  parseData: EvmTransactionData;
  isToContract: boolean;
  errors?: ErrorValidation[]
}

export type EvmWatchTransactionRequest = EvmSendTransactionRequest;

export interface ConfirmationsQueueItemOptions {
  requiredPassword?: boolean;
  address?: string;
  networkKey?: string;
}

export interface ConfirmationsQueueItem<T> extends ConfirmationsQueueItemOptions, ConfirmationRequestBase {
  payload: T;
  payloadJson: string;
}

export interface ConfirmationResult<T> extends ConfirmationRequestBase {
  isApproved: boolean;
  payload?: T;
}

export interface AddNetworkRequestExternal { // currently only support adding pure Evm network
  chainId: string;
  rpcUrls: string[];
  chainName: string;
  blockExplorerUrls?: string[];
  requestId?: string;
  nativeCurrency: {
    name: string;
    symbol: string;
    decimals: number;
  };
}

export type AddNetworkToRequestConnect = AddNetworkRequestExternal;

export interface AddTokenRequestExternal {
  slug?: string;
  contractAddress: string;
  originChain: string;
  type: _AssetType;
  name: string;
  symbol: string;
  decimals: number;
  validated: boolean;
  contractError: boolean;
}

export interface ErrorNetworkConnection {
  networkKey: string,
  address: string,
  errors: ErrorValidation[]
}

export interface ConfirmationDefinitions {
  addNetworkRequest: [ConfirmationsQueueItem<_NetworkUpsertParams>, ConfirmationResult<null>],
  addTokenRequest: [ConfirmationsQueueItem<AddTokenRequestExternal>, ConfirmationResult<boolean>],
  evmSignatureRequest: [ConfirmationsQueueItem<EvmSignatureRequest>, ConfirmationResult<string>],
  evmSendTransactionRequest: [ConfirmationsQueueItem<EvmSendTransactionRequest>, ConfirmationResult<string>]
  evmWatchTransactionRequest: [ConfirmationsQueueItem<EvmWatchTransactionRequest>, ConfirmationResult<string>],
  errorConnectNetwork: [ConfirmationsQueueItem<ErrorNetworkConnection>, ConfirmationResult<null>]
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

export interface BondingOptionParams {
  chain: string;
  type: StakingType;
}

export interface SingleModeJson {
  networkKeys: string[],
  theme: ThemeNames,
  autoTriggerDomain: string // Regex for auto trigger single mode
}

/// Evm transaction

export type NestedArray<T> = T | NestedArray<T>[];

/// Evm Contract Input

export interface EvmTransactionArg {
  name: string;
  type: string;
  value: string;
  children?: EvmTransactionArg[];
}

export interface ParseEvmTransactionData {
  method: string;
  methodName: string;
  args: EvmTransactionArg[];
}

export interface RequestParseEvmContractInput {
  data: string;
  contract: string;
  chainId: number;
}

export type EvmTransactionData = ParseEvmTransactionData | string;

export interface ResponseParseEvmContractInput {
  result: EvmTransactionData;
}

/// Ledger

export interface LedgerNetwork {
  /** GenesisHash for substrate app */
  genesisHash: string;
  /** Display in selector */
  networkName: string;
  /** Name for account(Ledger X Account) */
  accountName: string;
  /** Name in Ledger */
  appName: string;
  /** Network is predefined in ledger lib */
  network: string;
  /** slug in chain list */
  slug: string;
  /** Deprecated */
  icon: 'substrate' | 'ethereum';
  /** Dev mode on Ledger */
  isDevMode: boolean;
  /** Is use generic Ledger app */
  isGeneric: boolean;
  /** Use for evm account */
  isEthereum: boolean;
  /** Hide networks that are supported by the dot migration app */
  isHide?: boolean;
  /** Slip44 in the derivation path */
  slip44: number;
}

export interface MigrationLedgerNetwork extends Omit<LedgerNetwork, 'isGeneric' | 'isEthereum' | 'isDevMode' | 'icon' > {
  ss58_addr_type: number
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

export interface EraInfo {
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

// Parse Evm

export interface RequestQrParseRLP {
  data: string;
}

export interface ResponseQrParseRLP {
  data: EvmTransactionData;
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

export interface RequestQrSignEvm {
  address: string;
  message: string;
  type: 'message' | 'transaction';
  chainId?: number;
}

export interface ResponseQrSignEvm {
  signature: string;
}

export interface RequestChangeFeeToken {
  currentFeeToken?: string;
  selectedFeeToken: string;
}

/// Transfer

export interface RequestCheckTransfer extends BaseRequestSign {
  networkKey: string,
  from: string,
  to: string,
  value?: string,
  transferAll?: boolean
  tokenSlug: string
}

export interface ValidateTransactionResponse {
  errors: TransactionError[],
  warnings: TransactionWarning[],
  transferNativeAmount?: string
}

export type RequestTransfer = InternalRequestSign<RequestCheckTransfer>;

export interface RequestCheckCrossChainTransfer extends BaseRequestSign {
  originNetworkKey: string,
  destinationNetworkKey: string,
  from: string,
  to: string,
  transferAll?: boolean,
  value: string,
  tokenSlug: string,
  showExtraWarning?: boolean
}

export type RequestCrossChainTransfer = InternalRequestSign<RequestCheckCrossChainTransfer>;

/// Stake

export interface ChainStakingMetadata {
  chain: string;
  type: StakingType;

  // essential
  era: number, // also round for parachains
  minJoinNominationPool?: string; // for relaychain supports nomination pool
  minStake: string;
  maxValidatorPerNominator: number;
  maxWithdrawalRequestPerValidator: number;
  allowCancelUnstaking: boolean;
  unstakingPeriod: number; // in hours

  // supplemental
  expectedReturn?: number; // in %, annually
  inflation?: number; // in %, annually
  nominatorCount?: number;
}// Staking & Bonding

export interface NominationInfo {
  chain: string;
  validatorAddress: string; // can be a nomination pool id
  validatorIdentity?: string;
  activeStake: string;

  hasUnstaking?: boolean;
  validatorMinStake?: string;
  status: EarningStatus;
}

export interface UnstakingInfo {
  chain: string;
  status: UnstakingStatus;
  claimable: string; // amount to be withdrawn
  waitingTime?: number;
  targetTimestampMs?: number;
  validatorAddress?: string; // might unstake from a validator or not
}

// Migrated
export interface NominatorMetadata {
  chain: string,
  type: StakingType,

  status: EarningStatus,
  address: string,
  activeStake: string,
  nominations: NominationInfo[],
  unstakings: UnstakingInfo[],
  isBondedBefore?: boolean
}

// Migrated
export interface ValidatorInfo {
  address: string;
  chain: string;

  totalStake: string;
  ownStake: string;
  otherStake: string;

  minBond: string;
  nominatorCount: number;
  commission: number; // in %
  expectedReturn?: number; // in %, annually

  blocked: boolean;
  identity?: string;
  isVerified: boolean;
  icon?: string;
  isCrowded: boolean;
}

export interface BondingSubmitParams extends BaseRequestSign {
  chain: string,
  type: StakingType,
  nominatorMetadata?: NominatorMetadata, // undefined if user has no stake
  amount: string,
  address: string,
  selectedValidators: ValidatorInfo[],
  lockPeriod?: number // in month
}

export type RequestBondingSubmit = InternalRequestSign<BondingSubmitParams>;

// UnBonding

export interface UnbondingSubmitParams extends BaseRequestSign {
  amount: string;
  chain: string;

  nominatorMetadata: NominatorMetadata;
  // for some chains
  validatorAddress?: string;

  isLiquidStaking?: boolean;
  derivativeTokenInfo?: _ChainAsset;
  exchangeRate?: number;
  inputTokenInfo?: _ChainAsset;
  isFastUnbond: boolean;
}

export type RequestUnbondingSubmit = InternalRequestSign<UnbondingSubmitParams>;

// Claim

// Compound

export interface StakePoolingBondingParams extends BaseRequestSign {
  nominatorMetadata?: NominatorMetadata,
  chain: string,
  selectedPool: NominationPoolInfo,
  amount: string,
  address: string
}

export type RequestStakePoolingBonding = InternalRequestSign<StakePoolingBondingParams>;

export interface StakePoolingUnbondingParams extends BaseRequestSign {
  nominatorMetadata: NominatorMetadata,
  chain: string,
  amount: string
}

export type RequestStakePoolingUnbonding = InternalRequestSign<StakePoolingUnbondingParams>;

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

/// Keyring state

export interface KeyringState {
  isReady: boolean;
  hasMasterPassword: boolean;
  isLocked: boolean;
}

export interface UIViewState {
  isUILocked: boolean;
}

export interface AddressBookState {
  contacts: AddressJson[];
  recent: AddressJson[];
}

// Change master password
export interface RequestChangeMasterPassword {
  oldPassword?: string;
  newPassword: string;

  createNew: boolean;
}

export interface ResponseChangeMasterPassword {
  status: boolean;
  errors: string[];
}

// Migrate password

export interface RequestMigratePassword {
  address: string;
  password: string;
}

export interface ResponseMigratePassword {
  status: boolean;
  errors: string[];
}

// Unlock

export interface RequestUnlockKeyring {
  password: string;
}

export interface ResponseUnlockKeyring {
  status: boolean;
  errors: string[];
}

// Export mnemonic

export interface RequestKeyringExportMnemonic {
  address: string;
  password: string;
}

export interface ResponseKeyringExportMnemonic {
  result: string;
}

// Reset wallet

export interface RequestResetWallet {
  resetAll: boolean;
}

export interface ResponseResetWallet {
  status: boolean;
  errors: string[];
}

/// Signing
export interface RequestSigningApprovePasswordV2 {
  id: string;
}

export interface AssetSettingUpdateReq {
  tokenSlug: string;
  assetSetting: AssetSetting;
  autoEnableNativeToken?: boolean;
}

export interface RequestGetTransaction {
  id: string;
}

// Mobile update
export type SubscriptionServiceType = 'chainRegistry' | 'balance' | 'crowdloan' | 'staking';

export interface MobileData {
  storage: string
  indexedDB: string
}

export type CronServiceType = 'price' | 'nft' | 'staking' | 'history' | 'recoverApi' | 'checkApiStatus';

export type CronType =
  'recoverApiMap' |
  'checkApiMapStatus' |
  'refreshHistory' |
  'refreshNft' |
  'refreshPrice' |
  'refreshStakeUnlockingInfo' |
  'refreshStakingReward' |
  'refreshPoolingStakingReward';

export interface RequestInitCronAndSubscription {
  subscription: {
    activeServices: SubscriptionServiceType[]
  },
  cron: {
    intervalMap: Partial<Record<CronType, number>>,
    activeServices: CronServiceType[]
  }
}

export interface RequestCronAndSubscriptionAction {
  subscriptionServices: SubscriptionServiceType[];
  cronServices: CronServiceType[];
}

export interface ActiveCronAndSubscriptionMap {
  subscription: Record<SubscriptionServiceType, boolean>;
  cron: Record<CronServiceType, boolean>;
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
}

export interface NotificationButton {
  title: string;
}

export interface Notification {
  id: number;
  type: NotificationType;
  title: string;
  message: string;
  notifyViaBrowser?: boolean;
  action?: {
    url?: string; // Add more action in the future
    buttonClick?: (btnIndex: number) => void;
    click?: () => void;
  };
  buttons?: NotificationButton[];
}

export type NotificationParams = Omit<Notification, 'id'>;

export interface CronReloadRequest {
  data: 'nft' | 'staking' | 'balance' | 'crowdloan'
}

export interface AllLogoMap {
  chainLogoMap: Record<string, string>;
  assetLogoMap: Record<string, string>;
}

// Phishing detect

export interface PassPhishing {
  pass: boolean;
}

export interface RequestPassPhishingPage {
  url: string;
}

// Psp token

export interface RequestAddPspToken {
  genesisHash: string;
  tokenInfo: {
    type: string;
    address: string;
    symbol: string;
    name: string;
    decimals?: number;
    logo?: string;
  };
}

/// WalletConnect

// Connect
export interface RequestConnectWalletConnect {
  uri: string;
}

export interface RequestRejectConnectWalletSession {
  id: string;
}

export interface RequestApproveConnectWalletSession {
  id: string;
  accounts: string[];
}

export interface RequestReconnectConnectWalletSession {
  id: string;
}

export interface RequestDisconnectWalletConnectSession {
  topic: string;
}

// Not support

export interface RequestRejectWalletConnectNotSupport {
  id: string;
}

export interface RequestApproveWalletConnectNotSupport {
  id: string;
}

/// Manta

export interface MantaPayConfig {
  address: string;
  zkAddress: string;
  enabled: boolean;
  chain: string;
  isInitialSync: boolean;
}

export interface MantaAuthorizationContext {
  address: string;
  chain: string;
  data: unknown;
}

export interface MantaPaySyncState {
  isSyncing: boolean,
  progress: number,
  needManualSync?: boolean
}

export interface MantaPayEnableParams {
  password: string,
  address: string
}

export enum MantaPayEnableMessage {
  WRONG_PASSWORD = 'WRONG_PASSWORD',
  CHAIN_DISCONNECTED = 'CHAIN_DISCONNECTED',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
  SUCCESS = 'SUCCESS'
}

export interface MantaPayEnableResponse {
  success: boolean;
  message: MantaPayEnableMessage;
}

/// Metadata
export interface RequestFindRawMetadata {
  genesisHash: string;
}

export interface ResponseFindRawMetadata {
  rawMetadata: string;
  specVersion: number;
  types: Record<string, Record<string, string> | string>;
  userExtensions?: ExtDef;
}

export interface ResolveDomainRequest {
  chain: string,
  domain: string
}

export interface ResolveAddressToDomainRequest {
  chain: string,
  address: string
}

export interface RequestYieldFastWithdrawal extends BaseRequestSign {
  address: string;
  yieldPoolInfo: YieldPoolInfo;
  yieldPositionInfo: YieldPositionInfo;
  amount: string;
}

/* Campaign */

export type CampaignAction = 'open_view' | 'open_url' | null;

export interface CampaignButton {
  id: number;
  color: string;
  icon: string | null;
  name: string;
  type: CampaignAction;
  metadata: Record<string, any> | null;
}

export interface ShowCampaignPopupRequest {
  value: boolean;
}

export enum CampaignDataType {
  NOTIFICATION = 'notification',
  BANNER = 'banner'
}

export interface BaseCampaignData {
  slug: string;
  campaignId: number;
  isDone: boolean;
  isArchive: boolean;
  type: CampaignDataType;
  data: Record<string, any>;
  buttons: CampaignButton[];
  startTime: number;
  endTime: number;
  condition: Record<string, any> | null;
}

export interface CampaignBanner extends BaseCampaignData {
  type: CampaignDataType.BANNER;
  data: {
    media: string;
    alt: string;
    action: CampaignAction;
    metadata: Record<string, any> | null;
    environments: string[];
    position: string[];
  };
}

export interface CampaignNotification extends BaseCampaignData {
  type: CampaignDataType.NOTIFICATION;
  data: {
    title: string;
    message: string;
    repeat: number;
    repeatAfter: number;
    action: CampaignAction;
    metadata: Record<string, any> | null;
  };
}

export type CampaignData = CampaignBanner | CampaignNotification;

export interface RequestCampaignBannerComplete {
  slug: string;
}

export interface RequestSubscribeHistory {
  address: string;
  chain: string;
}

export interface ResponseSubscribeHistory {
  id: string;
  items: TransactionHistoryItem[]
}

/* Campaign */

/* Core types */
export type _Address = string;
export type _BalanceMetadata = unknown;

// Use stringify to communicate, pure boolean value will error with case 'false' value
export interface KoniRequestSignatures {
  // Bonding functions
  'pri(staking.submitTuringCancelCompound)': [RequestTuringCancelStakeCompound, SWTransactionResponse];
  'pri(staking.submitTuringCompound)': [RequestTuringStakeCompound, SWTransactionResponse];
  'pri(staking.submitClaimReward)': [RequestStakeClaimReward, SWTransactionResponse];
  'pri(staking.submitCancelWithdrawal)': [RequestStakeCancelWithdrawal, SWTransactionResponse];
  'pri(unbonding.submitTransaction)': [RequestUnbondingSubmit, SWTransactionResponse];
  'pri(bonding.submitBondingTransaction)': [RequestBondingSubmit, SWTransactionResponse];
  'pri(bonding.subscribeChainStakingMetadata)': [null, ChainStakingMetadata[], ChainStakingMetadata[]];
  'pri(bonding.subscribeNominatorMetadata)': [null, NominatorMetadata[], NominatorMetadata[]];
  'pri(bonding.getBondingOptions)': [BondingOptionParams, ValidatorInfo[]];
  'pri(bonding.getNominationPoolOptions)': [string, NominationPoolInfo[]];
  'pri(bonding.nominationPool.submitBonding)': [RequestStakePoolingBonding, SWTransactionResponse];
  'pri(bonding.nominationPool.submitUnbonding)': [RequestStakePoolingUnbonding, SWTransactionResponse];

  // Chains, assets functions
  'pri(chainService.subscribeChainInfoMap)': [null, Record<string, any>, Record<string, any>];
  'pri(chainService.subscribeChainStateMap)': [null, Record<string, any>, Record<string, any>];
  'pri(chainService.subscribeChainStatusMap)': [null, Record<string, any>, Record<string, any>];
  'pri(chainService.subscribeAssetRegistry)': [null, Record<string, any>, Record<string, any>];
  'pri(chainService.subscribeMultiChainAssetMap)': [null, Record<string, _MultiChainAsset>, Record<string, _MultiChainAsset>];
  'pri(chainService.subscribeXcmRefMap)': [null, Record<string, _AssetRef>, Record<string, _AssetRef>];
  'pri(chainService.upsertChain)': [_NetworkUpsertParams, boolean];
  'pri(chainService.enableChains)': [EnableMultiChainParams, boolean];
  'pri(chainService.enableChain)': [EnableChainParams, boolean];
  'pri(chainService.reconnectChain)': [string, boolean];
  'pri(chainService.disableChains)': [string[], boolean];
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
  'pri(assetSetting.getSubscription)': [null, Record<string, AssetSetting>, Record<string, AssetSetting>];
  'pri(assetSetting.update)': [AssetSettingUpdateReq, boolean];

  // NFT functions
  'pri(evmNft.submitTransaction)': [NftTransactionRequest, SWTransactionResponse];
  'pri(evmNft.getTransaction)': [NftTransactionRequest, EvmNftTransaction];
  'pri(substrateNft.submitTransaction)': [NftTransactionRequest, SWTransactionResponse];
  'pri(substrateNft.getTransaction)': [NftTransactionRequest, SubstrateNftTransaction];
  'pri(nft.getNft)': [null, NftJson];
  'pri(nft.getSubscription)': [RequestSubscribeNft, NftJson, NftJson];
  'pri(nftCollection.getNftCollection)': [null, NftCollectionJson];
  'pri(nftCollection.getSubscription)': [null, NftCollection[], NftCollection[]];

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
  'pri(crowdloan.getCrowdloanContributions)': [RequestCrowdloanContributions, CrowdloanContributionsResponse];
  'pri(crowdloan.getSubscription)': [RequestSubscribeCrowdloan, CrowdloanJson, CrowdloanJson];

  // Phishing page
  'pri(phishing.pass)': [RequestPassPhishingPage, boolean];

  // Manta pay
  'pri(mantaPay.enable)': [MantaPayEnableParams, MantaPayEnableResponse];
  'pri(mantaPay.disable)': [string, boolean];
  'pri(mantaPay.getZkBalance)': [null, null];
  'pri(mantaPay.subscribeConfig)': [null, MantaPayConfig[], MantaPayConfig[]];
  'pri(mantaPay.subscribeSyncingState)': [null, MantaPaySyncState, MantaPaySyncState];
  'pri(mantaPay.initSyncMantaPay)': [string, null];

  // Auth
  'pri(authorize.listV2)': [null, ResponseAuthorizeList];
  'pri(authorize.requestsV2)': [RequestAuthorizeSubscribe, AuthorizeRequest[], AuthorizeRequest[]];
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

  /* Account management */

  // Validate
  'pri(seed.validateV2)': [RequestSeedValidateV2, ResponseSeedValidateV2];
  'pri(privateKey.validateV2)': [RequestSeedValidateV2, ResponsePrivateKeyValidateV2];
  'pri(accounts.checkPublicAndSecretKey)': [RequestCheckPublicAndSecretKey, ResponseCheckPublicAndSecretKey];

  // Create account
  'pri(seed.createV2)': [RequestSeedCreateV2, ResponseSeedCreateV2];
  'pri(accounts.create.suriV2)': [RequestAccountCreateSuriV2, ResponseAccountCreateSuriV2];
  'pri(accounts.create.externalV2)': [RequestAccountCreateExternalV2, AccountExternalError[]];
  'pri(accounts.create.hardwareV2)': [RequestAccountCreateHardwareV2, boolean];
  'pri(accounts.create.hardwareMultiple)': [RequestAccountCreateHardwareMultiple, boolean];
  'pri(accounts.create.withSecret)': [RequestAccountCreateWithSecretKey, ResponseAccountCreateWithSecretKey];

  // Inject account
  'pri(accounts.inject.add)': [RequestAddInjectedAccounts, boolean];
  'pri(accounts.inject.remove)': [RequestRemoveInjectedAccounts, boolean];

  // Derive
  'pri(derivation.createV2)': [RequestDeriveCreateV2, boolean]; // Substrate

  // Restore by json
  'pri(json.restoreV2)': [RequestJsonRestoreV2, void];
  'pri(json.batchRestoreV2)': [RequestBatchRestoreV2, void];

  // Export account
  'pri(accounts.batchExportV2)': [RequestAccountBatchExportV2, ResponseAccountBatchExportV2];
  'pri(accounts.exportPrivateKey)': [RequestAccountExportPrivateKey, ResponseAccountExportPrivateKey];

  // Current account
  'pri(accounts.subscribeWithCurrentAddress)': [RequestAccountSubscribe, AccountsWithCurrentAddress, AccountsWithCurrentAddress];
  'pri(accounts.updateCurrentAddress)': [string, boolean]; // old
  'pri(currentAccount.saveAddress)': [RequestCurrentAccountAddress, CurrentAccountInfo];
  'pri(accounts.get.meta)': [RequestAccountMeta, ResponseAccountMeta];

  // Address book
  'pri(accounts.saveRecent)': [RequestSaveRecentAccount, KeyringAddress];
  'pri(accounts.subscribeAddresses)': [null, AddressBookInfo, AddressBookInfo];
  'pri(accounts.editContact)': [RequestEditContactAccount, boolean];
  'pri(accounts.deleteContact)': [RequestDeleteContactAccount, boolean];

  // Domain name
  'pri(accounts.resolveDomainToAddress)': [ResolveDomainRequest, string | undefined];
  'pri(accounts.resolveAddressToDomain)': [ResolveAddressToDomainRequest, string | undefined];

  // For input UI
  'pri(accounts.subscribeAccountsInputAddress)': [RequestAccountSubscribe, string, OptionInputAddress];

  /* Account management */

  // Settings
  'pri(settings.changeBalancesVisibility)': [null, boolean];
  'pri(settings.subscribe)': [null, UiSettings, UiSettings];
  'pri(settings.getLogoMaps)': [null, AllLogoMap];
  'pri(settings.saveAccountAllLogo)': [string, boolean, UiSettings];
  'pri(settings.saveTheme)': [ThemeNames, boolean];
  'pri(settings.saveBrowserConfirmationType)': [BrowserConfirmationType, boolean];
  'pri(settings.saveCamera)': [RequestCameraSettings, boolean];
  'pri(settings.saveAutoLockTime)': [RequestChangeTimeAutoLock, boolean];
  'pri(settings.saveUnlockType)': [RequestUnlockType, boolean];
  'pri(settings.saveEnableChainPatrol)': [RequestChangeEnableChainPatrol, boolean];
  'pri(settings.saveLanguage)': [RequestChangeLanguage, boolean];
  'pri(settings.savePriceCurrency)': [RequestChangePriceCurrency, boolean];
  'pri(settings.saveShowZeroBalance)': [RequestChangeShowZeroBalance, boolean];
  'pri(settings.saveShowBalance)': [RequestChangeShowBalance, boolean];
  'pri(settings.logo.assets.subscribe)': [null, Record<string, string>, Record<string, string>];
  'pri(settings.logo.chains.subscribe)': [null, Record<string, string>, Record<string, string>];

  /* Earning */

  /* Info */

  'pri(yield.subscribePoolInfo)': [null, YieldPoolInfo[], YieldPoolInfo[]];
  'pri(yield.subscribeYieldPosition)': [null, YieldPositionInfo[], YieldPositionInfo[]];
  'pri(yield.subscribeYieldReward)': [null, EarningRewardJson, EarningRewardJson];
  'pri(yield.subscribeRewardHistory)': [null, Record<string, EarningRewardHistoryItem>, Record<string, EarningRewardHistoryItem>];
  'pri(yield.getTargets)': [RequestGetYieldPoolTargets, ResponseGetYieldPoolTargets];
  'pri(yield.minAmountPercent)': [null, Record<string, number>, Record<string, number>];

  // Deprecated
  'pri(yield.getNativeStakingValidators)': [YieldPoolInfo, ValidatorInfo[]];
  'pri(yield.getStakingNominationPools)': [YieldPoolInfo, NominationPoolInfo[]];

  /* Info */

  /* Actions */

  /* Join */

  'pri(yield.join.earlyValidate)': [RequestEarlyValidateYield, ResponseEarlyValidateYield];
  'pri(yield.join.getOptimalPath)': [OptimalYieldPathParams, OptimalYieldPath];
  'pri(yield.join.handleStep)': [HandleYieldStepParams, SWTransactionResponse];
  'pri(yield.join.validateProcess)': [ValidateYieldProcessParams, TransactionError[]];

  /* Join */

  /* Leave */

  'pri(yield.leave.submit)': [RequestYieldLeave, SWTransactionResponse];

  // Deprecated
  'pri(yield.submitRedeem)': [RequestYieldFastWithdrawal, SWTransactionResponse];
  'pri(yield.staking.submitUnstaking)': [RequestUnbondingSubmit, SWTransactionResponse];
  'pri(yield.nominationPool.submitUnstaking)': [RequestStakePoolingUnbonding, SWTransactionResponse];

  /* Leave */

  /* Other */

  'pri(yield.withdraw.submit)': [RequestYieldWithdrawal, SWTransactionResponse];
  'pri(yield.cancelWithdrawal.submit)': [RequestStakeCancelWithdrawal, SWTransactionResponse];
  'pri(yield.claimReward.submit)': [RequestStakeClaimReward, SWTransactionResponse];

  /* Other */

  /* Actions */

  /* Earning */

  // Subscription
  'pri(transaction.history.getSubscription)': [null, TransactionHistoryItem[], TransactionHistoryItem[]];
  'pri(transaction.history.subscribe)': [RequestSubscribeHistory, ResponseSubscribeHistory, TransactionHistoryItem[]];
  'pri(transfer.getMaxTransferable)': [RequestMaxTransferable, AmountData];
  'pri(subscription.cancel)': [string, boolean];
  'pri(freeBalance.get)': [RequestFreeBalance, AmountData];
  'pri(freeBalance.subscribe)': [RequestFreeBalance, AmountDataWithId, AmountDataWithId];

  // Transfer
  'pri(accounts.checkTransfer)': [RequestCheckTransfer, ValidateTransactionResponse];
  'pri(accounts.transfer)': [RequestTransfer, SWTransactionResponse];
  'pri(accounts.getOptimalTransferProcess)': [RequestOptimalTransferProcess, CommonOptimalPath];
  'pri(accounts.approveSpending)': [TokenSpendingApprovalParams, SWTransactionResponse];

  'pri(accounts.checkCrossChainTransfer)': [RequestCheckCrossChainTransfer, ValidateTransactionResponse];
  'pri(accounts.crossChainTransfer)': [RequestCrossChainTransfer, SWTransactionResponse];

  // Confirmation Queues
  'pri(confirmations.subscribe)': [RequestConfirmationsSubscribe, ConfirmationsQueue, ConfirmationsQueue];
  'pri(confirmations.complete)': [RequestConfirmationComplete, boolean];

  'pub(utils.getRandom)': [RandomTestRequest, number];
  'pub(accounts.listV2)': [RequestAccountList, InjectedAccount[]];
  'pub(accounts.subscribeV2)': [RequestAccountSubscribe, string, InjectedAccount[]];
  'pub(accounts.unsubscribe)': [RequestAccountUnsubscribe, boolean];

  // Sign QR
  'pri(account.isLocked)': [RequestAccountIsLocked, ResponseAccountIsLocked];
  'pri(qr.transaction.parse.substrate)': [RequestParseTransactionSubstrate, ResponseParseTransactionSubstrate];
  'pri(qr.transaction.parse.evm)': [RequestQrParseRLP, ResponseQrParseRLP];
  'pri(qr.sign.substrate)': [RequestQrSignSubstrate, ResponseQrSignSubstrate];
  'pri(qr.sign.evm)': [RequestQrSignEvm, ResponseQrSignEvm];

  // External account request
  'pri(account.external.reject)': [RequestRejectExternalRequest, ResponseRejectExternalRequest];
  'pri(account.external.resolve)': [RequestResolveExternalRequest, ResponseResolveExternalRequest];

  // Evm
  'evm(events.subscribe)': [RequestEvmEvents, boolean, EvmEvent];
  'evm(request)': [RequestArguments, unknown];
  'evm(provider.send)': [RequestEvmProviderSend, string | number, ResponseEvmProviderSend];

  // Evm Transaction
  'pri(evm.transaction.parse.input)': [RequestParseEvmContractInput, ResponseParseEvmContractInput];

  // Authorize
  'pri(authorize.subscribe)': [null, AuthUrls, AuthUrls];

  // Keyring state
  'pri(keyring.subscribe)': [null, KeyringState, KeyringState];
  'pri(keyring.change)': [RequestChangeMasterPassword, ResponseChangeMasterPassword];
  'pri(keyring.migrate)': [RequestMigratePassword, ResponseMigratePassword];
  'pri(keyring.unlock)': [RequestUnlockKeyring, ResponseUnlockKeyring];
  'pri(keyring.lock)': [null, void];
  'pri(keyring.export.mnemonic)': [RequestKeyringExportMnemonic, ResponseKeyringExportMnemonic];
  'pri(keyring.reset)': [RequestResetWallet, ResponseResetWallet];

  // Signing
  'pri(signing.approve.passwordV2)': [RequestSigningApprovePasswordV2, boolean];

  // Derive
  'pri(derivation.validateV2)': [RequestDeriveValidateV2, ResponseDeriveValidateV2];
  'pri(derivation.getList)': [RequestGetDeriveAccounts, ResponseGetDeriveAccounts];
  'pri(derivation.create.multiple)': [RequestDeriveCreateMultiple, boolean];
  'pri(derivation.createV3)': [RequestDeriveCreateV3, boolean];

  // Transaction
  // Get Transaction
  'pri(transactions.getOne)': [RequestGetTransaction, SWTransactionResult];
  'pri(transactions.subscribe)': [null, Record<string, SWTransactionResult>, Record<string, SWTransactionResult>];

  // Notification
  'pri(notifications.subscribe)': [null, Notification[], Notification[]];

  // Private
  'pri(cron.reload)': [CronReloadRequest, boolean];

  // Mobile
  'mobile(ping)': [null, string];
  'mobile(cronAndSubscription.init)': [RequestInitCronAndSubscription, ActiveCronAndSubscriptionMap];
  'mobile(cronAndSubscription.activeService.subscribe)': [null, ActiveCronAndSubscriptionMap, ActiveCronAndSubscriptionMap];
  'mobile(cronAndSubscription.start)': [RequestCronAndSubscriptionAction, void];
  'mobile(cronAndSubscription.stop)': [RequestCronAndSubscriptionAction, void];
  'mobile(cronAndSubscription.restart)': [RequestCronAndSubscriptionAction, void];
  'mobile(cron.start)': [CronServiceType[], void];
  'mobile(cron.stop)': [CronServiceType[], void];
  'mobile(cron.restart)': [CronServiceType[], void];
  'mobile(subscription.start)': [SubscriptionServiceType[], void];
  'mobile(subscription.stop)': [SubscriptionServiceType[], void];
  'mobile(subscription.restart)': [SubscriptionServiceType[], void];
  'mobile(storage.backup)': [null, MobileData];
  'mobile(storage.restore)': [Partial<MobileData>, null];

  // Psp token
  'pub(token.add)': [RequestAddPspToken, boolean];

  /// Wallet connect
  'pri(walletConnect.connect)': [RequestConnectWalletConnect, boolean];
  'pri(walletConnect.requests.connect.subscribe)': [null, WalletConnectSessionRequest[], WalletConnectSessionRequest[]];
  'pri(walletConnect.session.approve)': [RequestApproveConnectWalletSession, boolean];
  'pri(walletConnect.session.reject)': [RequestRejectConnectWalletSession, boolean];
  'pri(walletConnect.session.reconnect)': [RequestReconnectConnectWalletSession, boolean];
  'pri(walletConnect.session.subscribe)': [null, SessionTypes.Struct[], SessionTypes.Struct[]];
  'pri(walletConnect.session.disconnect)': [RequestDisconnectWalletConnectSession, boolean];
  'pri(walletConnect.requests.notSupport.subscribe)': [null, WalletConnectNotSupportRequest[], WalletConnectNotSupportRequest[]];
  'pri(walletConnect.notSupport.approve)': [RequestApproveWalletConnectNotSupport, boolean];
  'pri(walletConnect.notSupport.reject)': [RequestRejectWalletConnectNotSupport, boolean];

  /// Metadata
  'pri(metadata.find)': [RequestFindRawMetadata, ResponseFindRawMetadata];
  'pri(metadata.hash)': [RequestMetadataHash, ResponseMetadataHash];
  'pri(metadata.transaction.shorten)': [RequestShortenMetadata, ResponseShortenMetadata];

  /* Campaign */

  'pri(campaign.unlockDot.canMint)': [RequestUnlockDotCheckCanMint, boolean];
  'pri(campaign.unlockDot.subscribe)': [RequestUnlockDotSubscribeMintedData, UnlockDotTransactionNft, UnlockDotTransactionNft];

  /* Campaign */

  /* Campaign */
  'pri(campaign.banner.subscribe)': [null, CampaignBanner[], CampaignBanner[]];
  'pri(campaign.popup.subscribeVisibility)': [null, ShowCampaignPopupRequest, ShowCampaignPopupRequest];
  'pri(campaign.popup.toggle)': [ShowCampaignPopupRequest, null];
  'pri(campaign.popup.getData)': [null, AppPopupData[]];
  'pri(campaign.banner.getData)': [null, AppBannerData[]];
  'pri(campaign.confirmation.getData)': [null, AppConfirmationData[]];
  'pri(campaign.popups.subscribe)': [null, AppPopupData[], AppPopupData[]];
  'pri(campaign.banners.subscribe)': [null, AppBannerData[], AppBannerData[]];
  'pri(campaign.confirmations.subscribe)': [null, AppConfirmationData[], AppConfirmationData[]];
  'pri(campaign.banner.complete)': [RequestCampaignBannerComplete, boolean];
  /* Campaign */

  /* Buy Service */
  'pri(buyService.tokens.subscribe)': [null, Record<string, BuyTokenInfo>, Record<string, BuyTokenInfo>];
  'pri(buyService.services.subscribe)': [null, Record<string, BuyServiceInfo>, Record<string, BuyServiceInfo>];
  /* Buy Service */

  /* Database Service */
  'pri(database.export)': [null, string];
  'pri(database.import)': [string, boolean];
  'pri(database.exportJson)': [null, DexieExportJsonStructure];
  'pri(database.migrateLocalStorage)': [string, boolean];
  'pri(database.setLocalStorage)': [StorageDataInterface, boolean];
  /* Database Service */

  /* Swap */
  'pri(swapService.subscribePairs)': [null, SwapPair[], SwapPair[]];
  'pri(swapService.handleSwapRequest)': [SwapRequest, SwapRequestResult];
  'pri(swapService.handleSwapStep)': [SwapSubmitParams, SWTransactionResponse];
  'pri(swapService.getLatestQuote)': [SwapRequest, SwapQuoteResponse];
  'pri(swapService.validateSwapProcess)': [ValidateSwapProcessParams, TransactionError[]];
  /* Swap */

  /* Ledger */

  'pri(ledger.generic.allow)': [null, string[], string[]];
}

export interface ApplicationMetadataType {
  version: string;
}

export type OSType = 'Mac OS' | 'iOS' | 'Windows' | 'Android' | 'Linux' | 'Unknown';
export const MobileOS: OSType[] = ['iOS', 'Android'];
