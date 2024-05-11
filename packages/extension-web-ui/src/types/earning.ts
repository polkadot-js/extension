// Copyright 2019-2022 @polkadot/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { CurrencyJson } from '@subwallet/extension-base/background/KoniTypes';
import { PalletNominationPoolsBondedPoolInner, YieldPositionInfo } from '@subwallet/extension-base/types';
import { NominationPoolInfo, ValidatorInfo } from '@subwallet/extension-base/types/yield/info/chain/target';
import { InfoItemBase } from '@subwallet/extension-web-ui/components/MetaInfo/parts';
import { BalanceValueInfo } from '@subwallet/extension-web-ui/types/balance';
import { PhosphorIcon } from '@subwallet/extension-web-ui/types/index';
import { SwIconProps } from '@subwallet/react-ui';
import BigN from 'bignumber.js';

export type NominationPoolState = Pick<PalletNominationPoolsBondedPoolInner, 'state'>;
export interface EarningStatusUiProps {
  schema: InfoItemBase['valueColorSchema'];
  icon: PhosphorIcon;
  name: string;
}

export enum EarningEntryView {
  OPTIONS= 'options',
  POSITIONS= 'positions',
}

export enum NetworkType {
  MAIN_NETWORK = 'MAIN_NETWORK',
  TEST_NETWORK = 'TEST_NETWORK',
}

export type ExtraYieldPositionInfo = YieldPositionInfo & {
  asset: _ChainAsset;
  price: number;
  currency?: CurrencyJson;
  // exchangeRate: number;
}

export interface YieldGroupInfo {
  maxApy?: number;
  group: string;
  symbol: string;
  token: string;
  balance: BalanceValueInfo;
  isTestnet: boolean;
  name?: string;
  chain: string;
  poolListLength: number;
  poolSlugs: string[];
  description: string;
  totalValueStaked: BigN;
  minJoin?: string;
  isRelatedToRelayChain: boolean;
}

export interface EarningTagType {
  label: string;
  icon: PhosphorIcon;
  color: string;
  weight: SwIconProps['weight'];
}

export interface NominationPoolDataType extends NominationPoolInfo {
  symbol: string;
  decimals: number;
  idStr: string;
  isRecommend?: boolean;
  disabled?: boolean;
  isSessionHeader?: boolean;
}

export interface ValidatorDataType extends ValidatorInfo {
  symbol: string;
  decimals: number;
}

export type PoolTargetData = NominationPoolDataType | ValidatorDataType;
