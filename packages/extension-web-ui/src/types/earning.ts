// Copyright 2019-2022 @polkadot/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { AbstractYieldPositionInfo } from '@subwallet/extension-base/types';
import { NominationPoolInfo, ValidatorInfo } from '@subwallet/extension-base/types/yield/info/chain/target';
import { BalanceValueInfo } from '@subwallet/extension-web-ui/types/balance';
import { PhosphorIcon } from '@subwallet/extension-web-ui/types/index';
import { SwIconProps } from '@subwallet/react-ui';
import BigN from 'bignumber.js';

export enum EarningEntryView {
  OPTIONS= 'options',
  POSITIONS= 'positions',
}

export interface ExtraYieldPositionInfo extends AbstractYieldPositionInfo {
  asset: _ChainAsset;
  price: number;
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
  description: string;
  totalValueStaked: BigN;
  minJoin?: string;
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
}

export interface ValidatorDataType extends ValidatorInfo {
  symbol: string;
  decimals: number;
}

export type PoolTargetData = NominationPoolDataType | ValidatorDataType;
