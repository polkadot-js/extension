// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

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
