// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { SWFee } from '@subwallet/extension-base/types/fee';

export type SwapRate = number;

export interface SwapQuote {
  pair: SwapPair;
  fromAmount: string;
  toAmount: string;
  rate: SwapRate; // rate = fromToken / toToken
  provider: SwapProvider;

  minSwap: string;
}

export interface SwapPair {
  slug: string;
  from: string;
  to: string;
}

export interface SwapProvider {
  slug: string;
  name: string;
  faq: string;
}

export interface SwapRequest {
  pair: SwapPair;
  fromAmount: string;
  slippage: number; // Example: 0.01 for 1%
  recipient?: string;
}

export interface SwapQuoteResponse {
  optimalQuote: SwapQuote;
  quotes: SwapQuote[];
  feeStruct: SWFee;
}

export interface SwapSubmitTransaction {
  quote: SwapQuote;
  address: string;
  slippage: number; // Example: 0.01 for 1%
  recipient?: string;
}
