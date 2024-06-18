// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getTokenMinAmount } from '@subwallet/extension-base/services/chain-service/utils';
import { buildSwapExtrinsic, checkLiquidityForPath, checkMinAmountForPath, estimateTokensForPath, getReserveForPath } from '@subwallet/extension-base/services/swap-service/handler/asset-hub/utils';
import { AssetHubPreValidationMetadata, SwapEarlyValidation, SwapErrorType, SwapPair, SwapRequest } from '@subwallet/extension-base/types/swap';
import BigN from 'bignumber.js';

import { SubmittableExtrinsic } from '@polkadot/api/types';

export class AssetHubRouter {
  private readonly chain: string;
  public readonly chainService: ChainService;

  constructor (chain: string, chainService: ChainService) {
    this.chain = chain;
    this.chainService = chainService;
  }

  get substrateApi (): _SubstrateApi {
    return this.chainService.getSubstrateApi(this.chain);
  }

  get nativeToken (): _ChainAsset {
    return this.chainService.getNativeTokenInfo(this.chain);
  }

  buildPath (pair: SwapPair): Array<_ChainAsset> {
    // const nativeToken = this.nativeToken;
    // const nativeTokenSlug = nativeToken.slug;

    const assetFrom = this.chainService.getAssetBySlug(pair.from);
    const assetTo = this.chainService.getAssetBySlug(pair.to);

    return [assetFrom, assetTo];
    // if (pair.from === nativeTokenSlug || pair.to === nativeTokenSlug) {
    //   return [assetFrom, assetTo];
    // } else {
    //   return [assetFrom, nativeToken, assetTo];
    // }
  }

  async earlyValidateSwapValidation (request: SwapRequest): Promise<SwapEarlyValidation> {
    const substrateApi = await this.substrateApi.isReady;
    const paths = this.buildPath(request.pair);

    const api = await substrateApi.api.isReady;
    const amount = request.fromAmount;
    const reserves = await getReserveForPath(api, paths);
    const amounts = await estimateTokensForPath(api, [amount], paths);

    // Check liquidity
    const liquidityError = checkLiquidityForPath(amounts, reserves);

    if (liquidityError) {
      return {
        error: liquidityError
      };
    }

    // Check amount token in pool after swap
    const minAmounts = paths.map((asset) => _getTokenMinAmount(asset));
    const minAmountAfterSwapError = checkMinAmountForPath(reserves, amounts, minAmounts);

    if (minAmountAfterSwapError) {
      return {
        error: minAmountAfterSwapError
      };
    }

    const bnAmount = new BigN(request.fromAmount);

    if (bnAmount.lte(0)) {
      return {
        error: SwapErrorType.AMOUNT_CANNOT_BE_ZERO
      };
    }

    return {
      metadata: {
        chain: this.chainService.getChainInfoByKey(this.chain)
      } as AssetHubPreValidationMetadata
    };
  }

  async estimateAmountOut (pair: SwapPair, amountIn: string): Promise<string> {
    const substrateApi = await this.substrateApi.isReady;
    const paths = this.buildPath(pair);

    const api = await substrateApi.api.isReady;
    const amounts = await estimateTokensForPath(api, [amountIn], paths);

    return amounts[amounts.length - 1];
  }

  async buildSwapExtrinsic (path: Array<_ChainAsset>, recipient: string, amountIn: string, amountOutMin: string): Promise<SubmittableExtrinsic<'promise'>> {
    const substrateApi = await this.substrateApi.isReady;

    const api = await substrateApi.api.isReady;

    return buildSwapExtrinsic(api, path, recipient, amountIn, amountOutMin);
  }
}
