// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { FeeOption } from '@subwallet/extension-base/types/fee';
import { BaseStepDetail } from '@subwallet/extension-base/types/service-base';

export type SwapRate = number;

export interface SwapQuote {
  pair: SwapPair;
  fromAmount: string;
  toAmount: string;
  rate: SwapRate; // rate = fromToken / toToken
  provider: SwapProvider;
  aliveUntil: number; // timestamp

  minSwap?: string; // min amount to start swapping
}

export interface SwapPair {
  slug: string;
  from: string;
  to: string;
}

export interface SwapProvider {
  id: SwapProviderId;
  name: string;

  faq?: string;
}

export interface SwapRequest {
  address: string;
  pair: SwapPair;
  fromAmount: string;
  slippage: number; // Example: 0.01 for 1%
  recipient?: string;
}

export interface SwapRequestResult {
  process: OptimalSwapPath;
  quote?: SwapQuoteResponse;
}

export interface SwapQuoteResponse {
  optimalQuote: SwapQuote;
  quotes: SwapQuote[];
}

export interface SwapSubmitTransaction {
  quote: SwapQuote;
  address: string;
  slippage: number; // Example: 0.01 for 1%
  recipient?: string;
}

export interface OptimalSwapPathParams {
  request: SwapRequest;
  selectedQuote: SwapQuote;
}

export enum SwapStepType {
  DEFAULT = 'DEFAULT',
  TOKEN_APPROVAL = 'TOKEN_APPROVAL',
  SWAP = 'SWAP'
}

export interface SwapStepDetail extends BaseStepDetail {
  id: number;
}

export interface OptimalSwapPath { // path means the steps to complete the swap, not the quote itself
  totalFee: FeeOption[],
  steps: SwapStepDetail[];
  connectionError?: string
}

export enum SwapProviderId {
  CHAIN_FLIP = 'CHAIN_FLIP',
  MOCK = 'mock'
}

export const _SUPPORTED_SWAP_PROVIDERS = ['CHAIN_FLIP'];
