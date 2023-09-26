// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DAppCategory, DAppCategoryType } from '@subwallet/extension-koni-ui/types/dapp';

export const dAppCategoryMap: Record<string, DAppCategory> = {
  [DAppCategoryType.DEFI]: {
    name: 'Defi',
    id: DAppCategoryType.DEFI,
    theme: 'cyan'
  },
  [DAppCategoryType.NFT]: {
    name: 'Nft',
    id: DAppCategoryType.NFT,
    theme: 'primary'
  },
  [DAppCategoryType.EVM]: {
    name: 'EVM',
    id: DAppCategoryType.EVM,
    theme: 'magenta'
  },
  [DAppCategoryType.COMMUNITY]: {
    name: 'Community',
    id: DAppCategoryType.COMMUNITY,
    theme: 'volcano'
  },
  [DAppCategoryType.UTILITIES]: {
    name: 'Utilities',
    id: DAppCategoryType.UTILITIES,
    theme: 'orange'
  },
  [DAppCategoryType.CROWDLOANS]: {
    name: 'Crowdloans',
    id: DAppCategoryType.CROWDLOANS,
    theme: 'blue'
  },
  [DAppCategoryType.STAKING]: {
    name: 'Staking',
    id: DAppCategoryType.STAKING,
    theme: 'geekblue'
  },
  [DAppCategoryType.TEST]: {
    name: 'Test',
    id: DAppCategoryType.TEST,
    theme: 'red'
  },
  [DAppCategoryType.DATA]: {
    name: 'Data',
    id: DAppCategoryType.DATA,
    theme: 'green'
  }
};

export const dAppCategories: DAppCategory[] = [
  dAppCategoryMap[DAppCategoryType.DEFI],
  dAppCategoryMap[DAppCategoryType.NFT],
  dAppCategoryMap[DAppCategoryType.EVM],
  dAppCategoryMap[DAppCategoryType.COMMUNITY],
  dAppCategoryMap[DAppCategoryType.UTILITIES],
  dAppCategoryMap[DAppCategoryType.CROWDLOANS],
  dAppCategoryMap[DAppCategoryType.STAKING],
  dAppCategoryMap[DAppCategoryType.TEST],
  dAppCategoryMap[DAppCategoryType.DATA]
];
