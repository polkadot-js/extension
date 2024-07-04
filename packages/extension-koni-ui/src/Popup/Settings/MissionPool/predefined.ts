// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MissionCategory } from '@subwallet/extension-koni-ui/types';
import { SwIconProps } from '@subwallet/react-ui/es/icon';
import { CheckCircle, Coin, Cube, DiceSix, MegaphoneSimple, SelectionBackground, User } from 'phosphor-react';
import { IconWeight } from 'phosphor-react/src/lib';

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

enum TagType {
  FCFS='fcfs',
  POINTS='points',
  LUCKY_DRAW='lucky_draw',
  MANUAL_SELECTION='manual_selection'
}

type TagInfo = {
  theme: string,
  name: string,
  slug: string,
  icon: SwIconProps['phosphorIcon'],
  iconWeight?: IconWeight
}

export const tagMap: Record<string, TagInfo> = {
  [TagType.FCFS]: {
    theme: 'yellow',
    name: 'FCFS',
    slug: TagType.FCFS,
    icon: User
  },
  [TagType.POINTS]: {
    theme: 'success',
    name: 'Points',
    slug: TagType.POINTS,
    icon: Coin,
    iconWeight: 'fill'
  },
  [TagType.LUCKY_DRAW]: {
    theme: 'gold',
    name: 'Lucky draw',
    slug: TagType.LUCKY_DRAW,
    icon: DiceSix,
    iconWeight: 'fill'
  },
  [TagType.MANUAL_SELECTION]: {
    theme: 'blue',
    name: 'Manual selection',
    slug: TagType.MANUAL_SELECTION,
    icon: SelectionBackground
  },
  [MissionCategoryType.UPCOMING]: {
    theme: 'gray-6',
    name: 'Upcoming',
    slug: MissionCategoryType.UPCOMING,
    icon: MegaphoneSimple,
    iconWeight: 'fill'
  },
  [MissionCategoryType.LIVE]: {
    theme: 'success',
    name: 'Live',
    slug: MissionCategoryType.LIVE,
    icon: CheckCircle,
    iconWeight: 'fill'
  },
  [MissionCategoryType.ARCHIVED]: {
    theme: 'blue',
    name: 'Archived',
    slug: MissionCategoryType.ARCHIVED,
    icon: Cube,
    iconWeight: 'fill'
  }
};
