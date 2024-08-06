// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PhosphorIcon } from '@subwallet/extension-koni-ui/types/index';

export type PopupFrequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'every_time' | null;

export type OnlineContentDataType = 'popup' | 'banner' | 'confirmation';

export interface AppInstructionInfo {
  id: string;
  title: string;
  description: string;
  icon_color?: string;
  icon: PhosphorIcon;
}

export interface MktCampaignHistoryData {
  lastShowTime: number;
  showTimes: number;
}

export interface AppContentButtonInstruction {
  id: number;
  confirm_label: string;
  cancel_label: string;
  instruction_id: number;
  group: string;
  slug: string;
}

export interface AppContentButtonAction {
  id: number;
  url: string;
  screen: string;
  params: string | null;
  is_cancel: boolean;
}

export interface AppContentButton {
  id: number;
  label: string;
  color: 'primary' | 'secondary' | 'warning' | 'danger' | 'ghost';
  instruction: AppContentButtonInstruction | null;
  action: AppContentButtonAction | null;
}
