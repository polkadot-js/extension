// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AddNetworkRequestExternal, NftItem, StakingRewardItem, TransactionHistoryItemType, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { _ChainAsset, _ChainInfo } from '@subwallet/extension-koni-base/services/chain-list/types';

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

export type StakingRewardJson_ = {
  details: StakingRewardItem[],
  ready: boolean
}
