// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// Account

import { AccountJson } from '@subwallet/extension-base/background/types';

export type CreateDoneParam = {
  accounts: AccountJson[];
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
