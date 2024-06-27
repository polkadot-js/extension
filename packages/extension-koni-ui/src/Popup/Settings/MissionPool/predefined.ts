// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MissionCategory } from '@subwallet/extension-koni-ui/types';

export enum MissionCategoryType {
  ALL='all',
  UPCOMING='upcoming',
  LIVE='live',
  ARCHIVED='archived',
}

export enum MissionTab {
  ALL='all',
  DEFI='defi',
  MEME='meme',
  GAMING='gaming',
}

export const missionCategoryMap: Record<string, MissionCategory> = {
  [MissionCategoryType.UPCOMING]: {
    slug: MissionCategoryType.UPCOMING,
    name: 'Upcoming'
  },
  [MissionCategoryType.LIVE]: {
    slug: MissionCategoryType.LIVE,
    name: 'Live'
  },
  [MissionCategoryType.ARCHIVED]: {
    slug: MissionCategoryType.ARCHIVED,
    name: 'Archived'
  }
};

export const missionCategories: MissionCategory[] = [
  missionCategoryMap[MissionCategoryType.UPCOMING],
  missionCategoryMap[MissionCategoryType.LIVE],
  missionCategoryMap[MissionCategoryType.ARCHIVED]
];
