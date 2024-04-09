// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { Asset, Assets, Chain, Chains } from '@chainflip/sdk/swap';
import { COMMON_ASSETS, COMMON_CHAIN_SLUGS } from '@subwallet/chain-list';
import { _ChainAsset } from '@subwallet/chain-list/types';
import { SwapError } from '@subwallet/extension-base/background/errors/SwapError';
import { _getAssetDecimals } from '@subwallet/extension-base/services/chain-service/utils';
import { ChainflipPreValidationMetadata, HydradxPreValidationMetadata, SwapErrorType, SwapFeeInfo, SwapPair, SwapProviderId, SwapStepDetail, SwapStepType } from '@subwallet/extension-base/types/swap';
import { formatNumber } from '@subwallet/extension-base/utils';
import BigN from 'bignumber.js';

export const CHAIN_FLIP_TESTNET_EXPLORER = 'https://blocks-perseverance.chainflip.io';
export const CHAIN_FLIP_MAINNET_EXPLORER = 'https://scan.chainflip.io';

export const CHAIN_FLIP_SUPPORTED_MAINNET_MAPPING: Record<string, Chain> = {
  [COMMON_CHAIN_SLUGS.POLKADOT]: Chains.Polkadot,
  [COMMON_CHAIN_SLUGS.ETHEREUM]: Chains.Ethereum
};

export const CHAIN_FLIP_SUPPORTED_TESTNET_MAPPING: Record<string, Chain> = {
  [COMMON_CHAIN_SLUGS.ETHEREUM_SEPOLIA]: Chains.Ethereum,
  [COMMON_CHAIN_SLUGS.CHAINFLIP_POLKADOT]: Chains.Polkadot
};

export const CHAIN_FLIP_SUPPORTED_MAINNET_ASSET_MAPPING: Record<string, Asset> = {
  [COMMON_ASSETS.DOT]: Assets.DOT,
  [COMMON_ASSETS.ETH]: Assets.ETH,
  [COMMON_ASSETS.USDC_ETHEREUM]: Assets.USDC
};

export const CHAIN_FLIP_SUPPORTED_TESTNET_ASSET_MAPPING: Record<string, Asset> = {
  [COMMON_ASSETS.PDOT]: Assets.DOT,
  [COMMON_ASSETS.ETH_SEPOLIA]: Assets.ETH,
  [COMMON_ASSETS.USDC_SEPOLIA]: Assets.USDC
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

export function getSwapAlternativeAsset (swapPair: SwapPair): string | undefined {
  return swapPair?.metadata?.alternativeAsset as string;
}

export function getSwapAltToken (chainAsset: _ChainAsset): string | undefined {
  return chainAsset.metadata?.alternativeSwapAsset as string;
}

export function calculateSwapRate (fromAmount: string, toAmount: string, fromAsset: _ChainAsset, toAsset: _ChainAsset) {
  const bnFromAmount = new BigN(fromAmount);
  const bnToAmount = new BigN(toAmount);

  const decimalDiff = _getAssetDecimals(toAsset) - _getAssetDecimals(fromAsset);
  const bnRate = bnFromAmount.div(bnToAmount);

  return 1 / bnRate.times(10 ** decimalDiff).toNumber();
}

export function getChainflipEarlyValidationError (error: SwapErrorType, metadata: ChainflipPreValidationMetadata): SwapError { // todo: support more providers
  switch (error) {
    case SwapErrorType.NOT_MEET_MIN_SWAP: {
      const parsedMinSwapValue = formatNumber(metadata.minSwap.value, metadata.minSwap.decimals);
      const message = `Amount too low. Increase your amount above ${parsedMinSwapValue} ${metadata.minSwap.symbol} and try again`;

      return new SwapError(error, message);
    }

    case SwapErrorType.SWAP_EXCEED_ALLOWANCE: {
      if (metadata.maxSwap) {
        const parsedMaxSwapValue = formatNumber(metadata.maxSwap.value, metadata.maxSwap.decimals);

        return new SwapError(error, `Amount too high. Lower your amount below ${parsedMaxSwapValue} ${metadata.maxSwap.symbol} and try again`);
      } else {
        return new SwapError(error, 'Amount too high. Lower your amount and try again');
      }
    }

    case SwapErrorType.ASSET_NOT_SUPPORTED:
      return new SwapError(error, 'This swap pair is not supported');
    case SwapErrorType.UNKNOWN:
      return new SwapError(error, `Undefined error. Check your Internet and ${metadata.chain.slug} connection or contact support`);
    case SwapErrorType.ERROR_FETCHING_QUOTE:
      return new SwapError(error, 'No swap quote found. Adjust your amount or try again later.');
    default:
      return new SwapError(error);
  }
}

export function getEarlyHydradxValidationError (error: SwapErrorType, metadata: HydradxPreValidationMetadata): SwapError {
  switch (error) {
    case SwapErrorType.AMOUNT_CANNOT_BE_ZERO: {
      return new SwapError(error, 'Amount too low. Increase your amount above 0 and try again');
    }

    case SwapErrorType.ASSET_NOT_SUPPORTED:
      return new SwapError(error, 'This swap pair is not supported');
    case SwapErrorType.UNKNOWN:
      return new SwapError(error, `Undefined error. Check your Internet and ${metadata.chain.slug} connection or contact support`);
    case SwapErrorType.ERROR_FETCHING_QUOTE:
      return new SwapError(error, 'No swap quote found. Adjust your amount or try again later.');
    default:
      return new SwapError(error);
  }
}
