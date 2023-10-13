// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MissionCategory } from '@subwallet/extension-koni-ui/types/missionPool';

export enum MissionCategoryType {
  ALL='all',
  CLAIMABLE='claimable',
  ANNOUNCED='announced',
  INCOMING='incoming',
  ONGOING='ongoing',
  ENDED='ended',
}

export const missionCategoryMap: Record<string, MissionCategory> = {
  [MissionCategoryType.CLAIMABLE]: {
    slug: MissionCategoryType.CLAIMABLE,
    name: 'Claimable'
  },
  [MissionCategoryType.ANNOUNCED]: {
    slug: MissionCategoryType.ANNOUNCED,
    name: 'Announced'
  },
  [MissionCategoryType.INCOMING]: {
    slug: MissionCategoryType.INCOMING,
    name: 'Incoming'
  },
  [MissionCategoryType.ONGOING]: {
    slug: MissionCategoryType.ONGOING,
    name: 'Ongoing'
  },
  [MissionCategoryType.ENDED]: {
    slug: MissionCategoryType.ENDED,
    name: 'Ended'
  }
};

export const missionCategories: MissionCategory[] = [
  missionCategoryMap[MissionCategoryType.CLAIMABLE],
  missionCategoryMap[MissionCategoryType.ANNOUNCED]
];
