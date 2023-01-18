// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { AuthUrlInfo } from '@subwallet/extension-base/background/handlers/State';
import { AddNetworkRequestExternal, ConfirmationDefinitions, ConfirmationsQueue, ConfirmationType, KeyringState, NftItem, StakingRewardItem, TransactionHistoryItemType, UiSettings, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson, AccountsContext, AuthorizeRequest, MetadataRequest, SigningRequest } from '@subwallet/extension-base/background/types';

import { SettingsStruct } from '@polkadot/ui-settings/types';

export type CurrentAccountType = {
  account?: AccountJson | null;
}

export type TransactionHistoryReducerType = {
  historyMap: Record<string, TransactionHistoryItemType[]>
}

export type TransferNftParams = {
  nftItem: NftItem;
  collectionImage?: string;
  collectionId: string;
}

export type TokenConfigParams = {
  data: _ChainAsset
}

export type NetworkConfigParams = {
  mode: 'create' | 'edit' | 'init',
  data?: _ChainInfo;
  externalData?: AddNetworkRequestExternal;
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

export interface BaseReduxState {
  reduxStatus: ReduxStatus
}

export interface AppSettings extends UiSettings, SettingsStruct, BaseReduxState {
  authUrls: Record<string, AuthUrlInfo>,
  mediaAllowed: boolean
}

export interface AccountState extends AccountsContext, KeyringState, BaseReduxState {
  currentAccount: AccountJson | null
}

export interface RequestState extends BaseReduxState {
  authorizeRequest: AuthorizeRequest[],
  metadataRequest: MetadataRequest[],
  signingRequest: SigningRequest[],
  confirmationQueue: ConfirmationsQueue
}

export interface UpdateConfirmationsQueueRequest extends BaseReduxState {
  type: ConfirmationType,
  data: Record<string, ConfirmationDefinitions[ConfirmationType][0]>
}
