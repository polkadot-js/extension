// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { SwapError } from '@subwallet/extension-base/background/errors/SwapError';
import { AmountData, ChainType, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { TransactionData } from '@subwallet/extension-base/types';
import { BaseStepDetail, CommonOptimalPath, CommonStepFeeInfo } from '@subwallet/extension-base/types/service-base';
import BigN from 'bignumber.js';

// core
export type SwapRate = number;

export interface SwapPair {
  slug: string;
  from: string;
  to: string;
  metadata?: Record<string, any>;
}

export interface SwapQuote {
  pair: SwapPair;
  fromAmount: string;
  toAmount: string;
  rate: SwapRate; // rate = fromToken / toToken
  provider: SwapProvider;
  aliveUntil: number; // timestamp
  route: SwapRoute;

  minSwap?: string; // min amount to start swapping
  maxSwap?: string; // set by the provider
  estimatedArrivalTime?: number; // in seconds
  isLowLiquidity?: boolean; // definition would be different for different providers
  metadata?: any;

  feeInfo: CommonStepFeeInfo;
}

export interface SwapRoute {
  path: string[]; // list of tokenSlug
  // todo: there might be more info
}

export enum SwapErrorType {
  ERROR_FETCHING_QUOTE = 'ERROR_FETCHING_QUOTE',
  NOT_MEET_MIN_SWAP = 'NOT_MEET_MIN_SWAP',
  UNKNOWN = 'UNKNOWN',
  ASSET_NOT_SUPPORTED = 'ASSET_NOT_SUPPORTED',
  QUOTE_TIMEOUT = 'QUOTE_TIMEOUT',
  INVALID_RECIPIENT = 'INVALID_RECIPIENT',
  SWAP_EXCEED_ALLOWANCE = 'SWAP_EXCEED_ALLOWANCE',
  SWAP_NOT_ENOUGH_BALANCE = 'SWAP_NOT_ENOUGH_BALANCE',
  NOT_ENOUGH_LIQUIDITY = 'NOT_ENOUGH_LIQUIDITY',
  AMOUNT_CANNOT_BE_ZERO = 'AMOUNT_CANNOT_BE_ZERO',
}

export enum SwapStepType {
  SWAP = 'SWAP'
}

export enum SwapProviderId {
  CHAIN_FLIP_TESTNET = 'CHAIN_FLIP_TESTNET',
  CHAIN_FLIP_MAINNET = 'CHAIN_FLIP_MAINNET',
  HYDRADX_MAINNET = 'HYDRADX_MAINNET',
  HYDRADX_TESTNET = 'HYDRADX_TESTNET',
}

export const _SUPPORTED_SWAP_PROVIDERS: SwapProviderId[] = [
  SwapProviderId.CHAIN_FLIP_TESTNET,
  SwapProviderId.CHAIN_FLIP_MAINNET,
  SwapProviderId.HYDRADX_MAINNET,
  SwapProviderId.HYDRADX_TESTNET
];

export interface SwapProvider {
  id: SwapProviderId;
  name: string;

  faq?: string;
}

// process handling
export enum SwapFeeType {
  PLATFORM_FEE = 'PLATFORM_FEE',
  NETWORK_FEE = 'NETWORK_FEE',
  WALLET_FEE = 'WALLET_FEE'
}

export type SwapTxData = ChainflipSwapTxData | HydradxSwapTxData; // todo: will be more

export interface SwapBaseTxData {
  provider: SwapProvider;
  quote: SwapQuote;
  address: string;
  slippage: number;
  recipient?: string;
  process: CommonOptimalPath;
}

export interface ChainflipSwapTxData extends SwapBaseTxData {
  depositChannelId: string;
  depositAddress: string;
  estimatedDepositChannelExpiryTime?: number;
}

export interface HydradxSwapTxData extends SwapBaseTxData {
  txHex: string;
}

// parameters & responses
export type GenSwapStepFunc = (params: OptimalSwapPathParams) => Promise<[BaseStepDetail, CommonStepFeeInfo] | undefined>;

export interface ChainflipPreValidationMetadata {
  minSwap: AmountData;
  maxSwap?: AmountData;
  chain: _ChainInfo;
}

export interface HydradxPreValidationMetadata {
  maxSwap: AmountData;
  chain: _ChainInfo;
}

export interface QuoteAskResponse {
  quote?: SwapQuote;
  error?: SwapError;
}

export interface SwapRequest {
  address: string;
  pair: SwapPair;
  fromAmount: string;
  slippage: number; // Example: 0.01 for 1%
  recipient?: string;
  feeToken?: string;
}

export interface SwapRequestResult {
  process: CommonOptimalPath;
  quote: SwapQuoteResponse;
}

export interface SwapQuoteResponse {
  optimalQuote?: SwapQuote; // if no optimalQuote then there's an error
  quotes: SwapQuote[];
  aliveUntil: number; // timestamp
  error?: SwapError; // only if there's no available quote
}

export interface SwapSubmitParams {
  process: CommonOptimalPath;
  currentStep: number;
  quote: SwapQuote;
  address: string;
  slippage: number; // Example: 0.01 for 1%
  recipient?: string;
}

export interface SwapSubmitStepData {
  txChain: string;
  txData: any;
  extrinsic: TransactionData;
  transferNativeAmount: string;
  extrinsicType: ExtrinsicType;
  chainType: ChainType
}

export interface OptimalSwapPathParams {
  request: SwapRequest;
  selectedQuote?: SwapQuote;
}

export interface SwapEarlyValidation {
  error?: SwapErrorType;
  metadata?: ChainflipPreValidationMetadata | HydradxPreValidationMetadata;
}

export interface ValidateSwapProcessParams {
  address: string;
  process: CommonOptimalPath;
  selectedQuote: SwapQuote;
  recipient?: string;
}

export interface SlippageType {
  slippage: BigN,
  isCustomType: boolean
}
