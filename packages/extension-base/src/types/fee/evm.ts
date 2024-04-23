// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import BigN from 'bignumber.js';

interface BaseFeeInfo {
  // blockNumber: string;
  busyNetwork: boolean;
}

export interface EvmLegacyFeeInfo extends BaseFeeInfo {
  gasPrice: string;
  maxFeePerGas: undefined;
  maxPriorityFeePerGas: undefined;
  baseGasFee: undefined;
}

export interface EvmEIP1995FeeInfo extends BaseFeeInfo {
  gasPrice: undefined;
  maxFeePerGas: BigN;
  maxPriorityFeePerGas: BigN;
  baseGasFee: BigN;
}

export type EvmFeeInfo = EvmLegacyFeeInfo | EvmEIP1995FeeInfo;

export interface EvmLegacyFeeInfoCache extends BaseFeeInfo {
  gasPrice: string;
  maxFeePerGas: undefined;
  maxPriorityFeePerGas: undefined;
  baseGasFee: undefined;
}

export interface EvmEIP1995FeeInfoCache extends BaseFeeInfo {
  gasPrice: undefined;
  maxFeePerGas: string;
  maxPriorityFeePerGas: string;
  baseGasFee: string;
}

export type EvmFeeInfoCache = EvmLegacyFeeInfoCache | EvmEIP1995FeeInfoCache;

export interface InfuraFeeDetail {
  suggestedMaxPriorityFeePerGas: string;
  suggestedMaxFeePerGas: string;
  minWaitTimeEstimate: number;
  maxWaitTimeEstimate: number;
}

export interface InfuraFeeInfo {
  low: InfuraFeeDetail;
  medium: InfuraFeeDetail;
  high: InfuraFeeDetail;
  networkCongestion: number;
  estimatedBaseFee: string;
  latestPriorityFeeRange: [string, string],
  historicalPriorityFeeRange: [string, string],
  historicalBaseFeeRange: [string, string],
  priorityFeeTrend: 'down' | 'up';
  baseFeeTrend: 'down' | 'up';
}
