// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { SwapError } from '@subwallet/extension-base/background/errors/SwapError';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType } from '@subwallet/extension-base/background/KoniTypes';
import { _getAssetDecimals, _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { ChainflipPreValidationMetadata, HydradxPreValidationMetadata, SwapErrorType } from '@subwallet/extension-base/types/swap';
import { formatNumber } from '@subwallet/extension-base/utils';
import BigN from 'bignumber.js';

import { isEthereumAddress } from '@polkadot/util-crypto';

export function _validateBalanceToSwap (fromToken: _ChainAsset, feeToken: _ChainAsset, feeTokenChainInfo: _ChainInfo, feeAmount: string, fromTokenBalance: string, feeTokenBalance: string, swapAmount: string, isXcmOk: boolean, minSwap?: string): TransactionError | undefined {
  if (new BigN(feeTokenBalance).lte(feeAmount)) {
    return new TransactionError(BasicTxErrorType.NOT_ENOUGH_BALANCE, `You don't have enough ${feeToken.symbol} (${feeTokenChainInfo.name}) to pay transaction fee`);
  }

  if (fromToken.slug === feeToken.slug) {
    if (new BigN(fromTokenBalance).lte(new BigN(feeAmount).plus(swapAmount))) {
      return new TransactionError(BasicTxErrorType.NOT_ENOUGH_BALANCE, `Insufficient balance. Deposit ${fromToken.symbol} and try again.`);
    }
  }

  if (isXcmOk) { // assume that the swap is valid if XCM is in the process and it was successful
    return undefined;
  }

  if (minSwap) {
    if (new BigN(fromTokenBalance).lte(minSwap)) {
      const parsedMinSwapValue = formatNumber(minSwap, _getAssetDecimals(fromToken));

      return new TransactionError(SwapErrorType.SWAP_NOT_ENOUGH_BALANCE, `Insufficient balance. You need more than ${parsedMinSwapValue} ${fromToken.symbol} to start swapping. Deposit ${fromToken.symbol} and try again.`); // todo: min swap or amount?
    }
  }

  if (new BigN(swapAmount).gte(fromTokenBalance)) {
    const parsedMaxBalanceSwap = formatNumber(fromTokenBalance, _getAssetDecimals(fromToken));

    return new TransactionError(SwapErrorType.SWAP_EXCEED_ALLOWANCE,
      `Amount too high. Lower your amount ${new BigN(fromTokenBalance).gt(0) ? `below ${parsedMaxBalanceSwap} ${fromToken.symbol}` : ''} and try again`);
  }

  return undefined;
}

export function _validateSwapRecipient (destChainInfo: _ChainInfo, recipient: string): TransactionError | undefined {
  const isEvmAddress = isEthereumAddress(recipient);
  const isEvmDestChain = _isChainEvmCompatible(destChainInfo);

  if ((isEvmAddress && !isEvmDestChain) || (!isEvmAddress && isEvmDestChain)) {
    return new TransactionError(SwapErrorType.INVALID_RECIPIENT);
  }

  return undefined;
}

export function _getChainflipEarlyValidationError (error: SwapErrorType, metadata: ChainflipPreValidationMetadata): SwapError { // todo: support more providers
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

export function _getEarlyHydradxValidationError (error: SwapErrorType, metadata: HydradxPreValidationMetadata): SwapError {
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
