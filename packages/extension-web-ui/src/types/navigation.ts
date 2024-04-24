// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson } from '@subwallet/extension-base/background/types';
import { EarningEntryView } from '@subwallet/extension-web-ui/types/earning';

export type CreateDoneParam = {
  accounts: AccountJson[];
};

// settings

export type ManageChainsParam = {
  defaultSearch: string,
};

// token

export type TokenDetailParam = {
  symbol: string,
  tokenGroup?: string,
  tokenSlug?: string,
};

// manage website access

export type ManageWebsiteAccessDetailParam = {
  siteName: string,
  origin: string,
  accountAuthType: string,
};

// transfer

export type SendFundParam = {
  slug: string, // multiChainAsset slug or token slug
}

// buy tokens

export type BuyTokensParam = {
  symbol: string,
};

export type CrowdloanContributionsResultParam = {
  address: string,
};

// earning

export type EarningEntryParam = {
  view: EarningEntryView;
  redirectFromPreview?: boolean;
  chainName?: string;
};

export type EarningPoolsParam = {
  poolGroup: string,
  symbol: string,
};

export type EarningPositionDetailParam = {
  earningSlug: string,
};
