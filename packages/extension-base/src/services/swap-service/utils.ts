// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { Asset, Assets, Chain, Chains } from '@chainflip/sdk/swap';
import { _ChainAsset } from '@subwallet/chain-list/types';
import { SwapError } from '@subwallet/extension-base/background/errors/SwapError';
import { AmountData } from '@subwallet/extension-base/background/KoniTypes';
import { _getAssetDecimals } from '@subwallet/extension-base/services/chain-service/utils';
import { ChainflipPreValidationMetadata, SwapErrorType, SwapFeeInfo, SwapProviderId, SwapStepDetail, SwapStepType } from '@subwallet/extension-base/types/swap';
import { formatNumber } from '@subwallet/extension-base/utils';
import BigN from 'bignumber.js';

export const CHAIN_FLIP_TESTNET_EXPLORER = 'https://blocks-perseverance.chainflip.io';
export const CHAIN_FLIP_MAINNET_EXPLORER = 'https://scan.chainflip.io';

export const CHAIN_FLIP_SUPPORTED_MAINNET_MAPPING: Record<string, Chain> = {
  polkadot: Chains.Polkadot,
  ethereum: Chains.Ethereum,

  ethereum_goerli: Chains.Ethereum,
  chainflip_dot: Chains.Polkadot
};

export const CHAIN_FLIP_SUPPORTED_TESTNET_MAPPING: Record<string, Chain> = {
  ethereum_goerli: Chains.Ethereum,
  chainflip_dot: Chains.Polkadot
};

export const CHAIN_FLIP_SUPPORTED_MAINNET_ASSET_MAPPING: Record<string, Asset> = { // TODO: should be done better
  'polkadot-NATIVE-DOT': Assets.DOT,
  'ethereum-NATIVE-ETH': Assets.ETH,
  'ethereum-ERC20-USDC-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48': Assets.USDC
};

export const CHAIN_FLIP_SUPPORTED_TESTNET_ASSET_MAPPING: Record<string, Asset> = { // TODO: should be done better
  'chainflip_dot-NATIVE-pDOT': Assets.DOT,
  'ethereum_goerli-NATIVE-ETH': Assets.ETH,
  'ethereum_goerli-ERC20-USDC-0x07865c6E87B9F70255377e024ace6630C1Eaa37F': Assets.USDC
};

export const SWAP_QUOTE_TIMEOUT_MAP: Record<string, number> = { // in milliseconds
  default: 30000,
  [SwapProviderId.CHAIN_FLIP_TESTNET]: 30000,
  [SwapProviderId.CHAIN_FLIP_MAINNET]: 30000
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

export function getSwapEarlyValidationError (error: SwapErrorType, metadata: ChainflipPreValidationMetadata, swapAllowed: AmountData): SwapError { // todo: support more providers
  switch (error) {
    case SwapErrorType.NOT_MEET_MIN_SWAP: {
      const parsedMinSwapValue = formatNumber(metadata.minSwap.value, metadata.minSwap.decimals);
      const message = `Amount too low. Increase your amount above ${parsedMinSwapValue} ${metadata.minSwap.symbol} and try again`;

      return new SwapError(error, message);
    }

    case SwapErrorType.EXCEED_MAX_SWAP: {
      if (metadata.maxSwap) {
        const parsedMaxSwapValue = formatNumber(metadata.maxSwap.value, metadata.maxSwap.decimals);

        return new SwapError(error, `Amount too high. Lower your amount below ${parsedMaxSwapValue} ${metadata.maxSwap.symbol} and try again`);
      } else {
        return new SwapError(error, 'Amount too high. Lower your amount and try again');
      }
    }

    case SwapErrorType.ASSET_NOT_SUPPORTED:
      return new SwapError(error, 'This swap pair is not supported');

    case SwapErrorType.SWAP_EXCEED_BALANCE: {
      const parsedSwapAllowed = formatNumber(swapAllowed.value, swapAllowed.decimals);

      return new SwapError(error, `You can’t swap all your balance. Lower your amount below ${parsedSwapAllowed} ${swapAllowed.symbol} and try again`);
    }

    case SwapErrorType.UNKNOWN:
      return new SwapError(error, `Undefined error. Check your Internet and ${metadata.chain.slug} connection or contact support`);
    case SwapErrorType.ERROR_FETCHING_QUOTE:
      return new SwapError(error, 'No swap quote found. Adjust your amount or try again later.');
    default:
      return new SwapError(error);
  }
}
