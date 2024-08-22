// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

export type PopupFrequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'every_time' | null;

export type OnlineContentDataType = 'popup' | 'banner' | 'confirmation';

export interface PopupHistoryData {
  lastShowTime: number;
  showTimes: number;
}

export interface AppBasicInfoData {
  id: number;
  name: string;
  description: string | null;
  start_time: string;
  stop_time: string;
  platforms: string[];
  os: 'android' | 'ios';
  is_changelog_popup?: boolean;
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

export type ComparisonMethod = 'eq' | 'gt' | 'gte' | 'lt' | 'lte';

export type ConditionBalanceType = { comparison: ComparisonMethod; value: number; chain_asset: string };
export type ConditionEarningType = { comparison: ComparisonMethod; value: number; pool_slug: string };
export type ConditionNftType = { chain: string; collection_id: string };
export type ConditionCrowdloanType = { chain: string };
export type ConditionHasMoneyType = { has_money: string[] };

export type ConditionType = 'condition-balance' | 'condition-earning' | 'condition-nft' | 'condition-crowdloan' | 'condition-has-money'

export enum MktCampaignConditionTypeValue {
  BALANCE = 'condition-balance',
  EARNING = 'condition-earning',
  NFT = 'condition-nft',
  CROWDLOAN = 'condition-crowdloan',
  HAS_MONEY = 'condition-has-money'
}

export interface MktCampaignCondition {
  [MktCampaignConditionTypeValue.BALANCE]: ConditionBalanceType[];
  [MktCampaignConditionTypeValue.EARNING]: ConditionEarningType[];
  [MktCampaignConditionTypeValue.NFT]: ConditionNftType[];
  [MktCampaignConditionTypeValue.CROWDLOAN]: ConditionCrowdloanType[];
  [MktCampaignConditionTypeValue.HAS_MONEY]: ConditionHasMoneyType[];
}

export interface PositionParam {
  property: string;
  value: string;
}

export interface AppCommonData {
  id: number;
  position: string;
  position_params: PositionParam[];
  conditions: MktCampaignCondition;
  info?: AppBasicInfoData;
  comparison_operator: 'AND' | 'OR';
  locations: string[];
}

export interface AppPopupData extends AppCommonData {
  priority: number;
  repeat: PopupFrequency;
  content: string;
  media: string;
  buttons: AppContentButton[];
  repeat_every_x_days: number | null;
}

export interface AppBannerData extends AppCommonData {
  priority: number;
  media: string;
  action: AppContentButtonAction;
  instruction: AppContentButtonInstruction | null;
}

export interface AppConfirmationData extends AppCommonData {
  name: string;
  repeat: PopupFrequency;
  confirm_label: string;
  cancel_label: string;
  content: string;
  repeat_every_x_days: number | null;
}
