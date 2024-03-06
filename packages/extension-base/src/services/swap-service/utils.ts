// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { Asset, Assets, Chain, Chains } from '@chainflip/sdk/swap';
import { _ChainAsset } from '@subwallet/chain-list/types';
import { SwapError } from '@subwallet/extension-base/background/errors/SwapError';
import { AmountData } from '@subwallet/extension-base/background/KoniTypes';
import { _getAssetDecimals } from '@subwallet/extension-base/services/chain-service/utils';
import { ChainflipPreValidationMetadata, SwapErrorType, SwapFeeInfo, SwapProviderId, SwapStepDetail, SwapStepType } from '@subwallet/extension-base/types/swap';
import BigN from 'bignumber.js';

export const CHAIN_FLIP_TESTNET_EXPLORER = 'https://blocks-perseverance.chainflip.io';
export const CHAIN_FLIP_MAINNET_EXPLORER = 'https://scan.chainflip.io';

export const CHAIN_FLIP_SUPPORTED_CHAIN_MAPPING: Record<string, Chain> = {
  polkadot: Chains.Polkadot,
  ethereum: Chains.Ethereum,
  ethereum_goerli: Chains.Ethereum,
  chainflip_dot: Chains.Polkadot
};

export const CHAIN_FLIP_SUPPORTED_ASSET_MAPPING: Record<string, Asset> = { // TODO: should be done better
  'polkadot-NATIVE-DOT': Assets.DOT,
  'ethereum-NATIVE-ETH': Assets.ETH,
  'ethereum-ERC20-USDC-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': Assets.USDC,

  'chainflip_dot-NATIVE-pDOT': Assets.DOT,
  'ethereum_goerli-NATIVE-ETH': Assets.ETH,
  'ethereum_goerli-ERC20-USDC-0x07865c6E87B9F70255377e024ace6630C1Eaa37F': Assets.USDC
};

export const SWAP_QUOTE_TIMEOUT_MAP: Record<string, number> = { // in milliseconds
  default: 30000,
  [SwapProviderId.CHAIN_FLIP]: 30000
};

export const DEFAULT_SWAP_FIRST_STEP: SwapStepDetail = {
  id: 0,
  name: 'Fill information',
  type: SwapStepType.DEFAULT
};

export const MOCK_SWAP_FEE: SwapFeeInfo = {
  feeComponent: [],
  defaultFeeToken: '',
  feeOptions: []
};

export function calculateSwapRate (fromAmount: string, toAmount: string, fromAsset: _ChainAsset, toAsset: _ChainAsset) {
  const bnFromAmount = new BigN(fromAmount);
  const bnToAmount = new BigN(toAmount);

  const decimalDiff = _getAssetDecimals(toAsset) - _getAssetDecimals(fromAsset);
  const bnRate = bnFromAmount.div(bnToAmount);

  return 1 / bnRate.times(10 ** decimalDiff).toNumber();
}

export function getSwapEarlyValidationError (error: SwapErrorType, metadata: ChainflipPreValidationMetadata, fromAssetBalance: AmountData): SwapError { // todo: support more providers
  const parsedFromAssetBalance = (new BigN(fromAssetBalance.value)).div(10 ** fromAssetBalance.decimals);

  switch (error) {
    case SwapErrorType.NOT_MEET_MIN_SWAP: {
      const parsedMinSwapValue = (new BigN(metadata.minSwap.value)).div(10 ** metadata.minSwap.decimals);
      const message = `You need to swap at least ${parsedMinSwapValue.toString()} ${metadata.minSwap.symbol}`;

      return new SwapError(error, message);
    }

    case SwapErrorType.EXCEED_MAX_SWAP: {
      if (metadata.maxSwap) {
        const parsedMaxSwapValue = (new BigN(metadata.maxSwap.value)).div(10 ** parseInt(metadata.maxSwap.symbol));

        return new SwapError(error, `You can only swap a maximum of ${parsedMaxSwapValue.toString()} ${metadata.maxSwap.symbol}`);
      } else {
        return new SwapError(error, 'Your requested amount has exceeded the maximum swap limit, please try with a smaller amount');
      }
    }

    case SwapErrorType.ASSET_NOT_SUPPORTED:
      return new SwapError(error, 'This swap pair is not supported');
    case SwapErrorType.SWAP_EXCEED_BALANCE:
      return new SwapError(error, `You cannot swap more than your free balance of ${parsedFromAssetBalance.toString()} ${fromAssetBalance.symbol}`);
    case SwapErrorType.UNKNOWN:
      return new SwapError(error, 'Unknown error. Please contact SubWallet support for help');
    case SwapErrorType.ERROR_FETCHING_QUOTE:
      return new SwapError(error, 'Cannot find a suitable quote for your request. Please try again later or reloading the page');
    default:
      return new SwapError(error);
  }
}
