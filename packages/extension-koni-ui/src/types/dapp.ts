// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TagProps } from '@subwallet/react-ui';

export enum DAppCategoryType {
  ALL='all',
  DEFI='defi',
  NFT='nft',
  EVM='evm',
  COMMUNITY='community',
  UTILITIES='utilities',
  CROWDLOANS='crowdloans',
  STAKING='staking',
  TEST='test',
  DATA='data',
}

export type DAppCategory = {
  name: string;
  slug: string;
  id: DAppCategoryType;
  theme?: TagProps['color'];
};

export type DAppInfo = {
  title: string;
  id: string;
  subtitle: string;
  description: string;
  url: string;
  icon: string;
  categories: string[];
  is_substrate?: boolean;
  is_evm?: boolean;
  chains?: string[];
  preview_image?: string;
  is_featured?: boolean;
}
