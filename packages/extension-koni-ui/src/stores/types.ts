// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _AssetRef, _ChainAsset, _ChainInfo, _MultiChainAsset } from '@subwallet/chain-list/types';
import { AuthUrlInfo } from '@subwallet/extension-base/background/handlers/State';
import { AddressBookState, AllLogoMap, AssetSetting, CampaignBanner, ChainStakingMetadata, ConfirmationDefinitions, ConfirmationsQueue, ConfirmationType, CrowdloanItem, KeyringState, LanguageType, MantaPayConfig, NftCollection, NftItem, NominatorMetadata, PriceJson, StakingItem, StakingRewardItem, TransactionHistoryItem, UiSettings, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson, AccountsContext, AuthorizeRequest, MetadataRequest, SigningRequest } from '@subwallet/extension-base/background/types';
import { _ChainApiStatus, _ChainState } from '@subwallet/extension-base/services/chain-service/types';
import { SWTransactionResult } from '@subwallet/extension-base/services/transaction-service/types';
import { WalletConnectNotSupportRequest, WalletConnectSessionRequest } from '@subwallet/extension-base/services/wallet-connect-service/types';
import { BalanceMap, BuyServiceInfo, BuyTokenInfo, EarningRewardHistoryItem, EarningRewardItem, NominationPoolInfo, YieldPoolInfo, YieldPoolTarget, YieldPositionInfo } from '@subwallet/extension-base/types';
import { SwapPair } from '@subwallet/extension-base/types/swap';
import { MissionInfo } from '@subwallet/extension-koni-ui/types';
import { SessionTypes } from '@walletconnect/types';

import { SettingsStruct } from '@polkadot/ui-settings/types';

import { AppBannerData, AppConfirmationData, AppPopupData, PopupHistoryData } from '../types/staticContent';

// todo: move this file to extension-koni-ui/src/types/

export type CurrentAccountType = {
  account?: AccountJson | null;
}

export type TransactionHistoryReducerType = {
  historyList: TransactionHistoryItem[]
}

export type TransferNftParams = {
  nftItem: NftItem;
  collectionImage?: string;
  collectionId: string;
}

export type TokenConfigParams = {
  data: _ChainAsset
}

export type BondingParams = {
  selectedAccount: string | null;
  selectedNetwork: string | null;
  selectedValidator: ValidatorInfo | null;
  maxNominatorPerValidator: number | null;
  isBondedBefore: boolean | null;
  bondedValidators: string[] | null;
}

export type UnbondingParams = {
  selectedAccount: string | null;
  selectedNetwork: string | null;
  bondedAmount: number | null;
}

export type StakeCompoundParams = {
  selectedAccount: string;
  selectedNetwork: string;
}

export type KeyringStateParams = {
  mode: 'create' | 'edit' | 'init',
  data: _ChainInfo;
}

export type StakingRewardJson_ = {
  details: StakingRewardItem[],
  ready: boolean
}

export enum ReduxStatus {
  INIT = 'init',
  CACHED = 'cached',
  READY = 'ready'
}

export interface BaseReduxStore {
  reduxStatus: ReduxStatus
}

// todo: merge with UiSettings later
export interface LocalUiSettings {
  language: LanguageType,
  isShowZeroBalance: boolean,
}

export interface AppSettings extends LocalUiSettings, UiSettings, Omit<SettingsStruct, 'camera' | 'notification'>, BaseReduxStore {
  authUrls: Record<string, AuthUrlInfo>,
  logoMaps: AllLogoMap,
  mediaAllowed: boolean,
}

export interface AccountState extends AccountsContext, KeyringState, AddressBookState, BaseReduxStore {
  currentAccount: AccountJson | null

  isAllAccount: boolean
}

export interface RequestState extends ConfirmationsQueue, BaseReduxStore {
  authorizeRequest: Record<string, AuthorizeRequest>;
  metadataRequest: Record<string, MetadataRequest>;
  signingRequest: Record<string, SigningRequest>;
  hasConfirmations: boolean;
  hasInternalConfirmations: boolean;
  numberOfConfirmations: number;
  transactionRequest: Record<string, SWTransactionResult>;
  connectWCRequest: Record<string, WalletConnectSessionRequest>;
  notSupportWCRequest: Record<string, WalletConnectNotSupportRequest>;
}

export interface UpdateConfirmationsQueueRequest extends BaseReduxStore {
  type: ConfirmationType,
  data: Record<string, ConfirmationDefinitions[ConfirmationType][0]>
}

export interface AssetRegistryStore extends BaseReduxStore {
  assetRegistry: Record<string, _ChainAsset>;
  multiChainAssetMap: Record<string, _MultiChainAsset>;
  assetSettingMap: Record<string, AssetSetting>;
  xcmRefMap: Record<string, _AssetRef>;
}

export interface ChainStore extends BaseReduxStore {
  chainInfoMap: Record<string, _ChainInfo>,
  chainStateMap: Record<string, _ChainState>
  chainStatusMap: Record<string, _ChainApiStatus>
}

export interface BalanceStore extends BaseReduxStore {
  balanceMap: BalanceMap
}

export interface CampaignStore extends BaseReduxStore {
  banners: CampaignBanner[],
  isPopupVisible: boolean
}

export interface AppOnlineContent {
  appPopupData: AppPopupData[];
  appBannerData: AppBannerData[];
  appConfirmationData: AppConfirmationData[];
  popupHistoryMap: Record<string, PopupHistoryData>;
  bannerHistoryMap: Record<string, PopupHistoryData>;
  confirmationHistoryMap: Record<string, PopupHistoryData>;
}

export interface BuyServiceStore extends BaseReduxStore {
  tokens: Record<string, BuyTokenInfo>;
  services: Record<string, BuyServiceInfo>;
}

export type PriceStore = PriceJson

export interface CrowdloanStore extends BaseReduxStore {
  crowdloanMap: Record<string, CrowdloanItem>
}

export interface NftStore extends BaseReduxStore {
  nftItems: NftItem[],
  nftCollections: NftCollection[]
}

export interface StakingStore extends BaseReduxStore {
  stakingMap: StakingItem[],
  stakingRewardMap: StakingRewardItem[],
  chainStakingMetadataList: ChainStakingMetadata[],
  nominatorMetadataList: NominatorMetadata[]
}

export interface BondingStore extends BaseReduxStore {
  nominationPoolInfoMap: Record<string, NominationPoolInfo[]>,
  validatorInfoMap: Record<string, ValidatorInfo[]>
}

export interface ChainValidatorParams {
  chain: string,
  validators: ValidatorInfo[]
}

export interface ChainNominationPoolParams {
  chain: string,
  pools: NominationPoolInfo[]
}

export interface WalletConnectStore extends BaseReduxStore {
  sessions: Record<string, SessionTypes.Struct>;
}

export interface MantaPayStore {
  configs: MantaPayConfig[],
  isSyncing: boolean,
  progress: number,
  needManualSync?: boolean,
  reduxStatus: ReduxStatus
}

export interface EarningStore extends BaseReduxStore {
  poolInfoMap: Record<string, YieldPoolInfo>;
  yieldPositions: YieldPositionInfo[];
  earningRewards: EarningRewardItem[];
  rewardHistories: EarningRewardHistoryItem[];
  minAmountPercentMap: Record<string, number>;
  poolTargetsMap: Record<string, YieldPoolTarget[]>;
}

export interface MissionPoolStore extends BaseReduxStore {
  missions: MissionInfo[];
}

export interface SwapStore extends BaseReduxStore {
  swapPairs: SwapPair[];
}
