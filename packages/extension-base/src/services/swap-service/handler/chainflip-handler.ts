// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { Asset, SwapSDK } from '@chainflip/sdk/swap';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { SwapBaseHandler } from '@subwallet/extension-base/services/swap-service/handler/base-handler';
import { CHAIN_FLIP_SUPPORTED_ASSET_MAPPING, CHAIN_FLIP_SUPPORTED_CHAIN_MAPPING, chainFlipConvertChainId } from '@subwallet/extension-base/services/swap-service/utils';
import { OptimalSwapPath, OptimalSwapPathParams, SwapQuote, SwapRequest } from '@subwallet/extension-base/types/swap';
import BigN from 'bignumber.js';

export class ChainflipSwapHandler extends SwapBaseHandler {
  private swapSdk: SwapSDK;
  private chainService: ChainService;

  constructor (providerSlug: string, providerName: string, chainService: ChainService) {
    super(providerSlug, providerName);

    this.swapSdk = new SwapSDK({
      network: 'mainnet'
    });
    this.chainService = chainService;
  }

  protected async validateSwapRequest (request: SwapRequest): Promise<boolean> {
    try {
      let isRouteToDestChainSupported = true;
      let isAssetSupported = true;
      let isAmountValid = true;

      // todo: risk of matching wrong chain, asset can lead to loss of funds

      const fromAsset = this.chainService.getAssetBySlug(request.pair.from);
      const toAsset = this.chainService.getAssetBySlug(request.pair.to);
      const srcChain = fromAsset.originChain;
      const destChain = toAsset.originChain;

      const bnAmount = new BigN(request.fromAmount);

      const srcChainId = CHAIN_FLIP_SUPPORTED_CHAIN_MAPPING[srcChain];
      const destChainId = CHAIN_FLIP_SUPPORTED_CHAIN_MAPPING[destChain];

      const fromAssetId = CHAIN_FLIP_SUPPORTED_ASSET_MAPPING[fromAsset.slug];
      const toAssetId = CHAIN_FLIP_SUPPORTED_ASSET_MAPPING[toAsset.slug];

      if (!srcChainId || !destChainId || !fromAssetId || !toAssetId) {
        return false;
      }

      const [supportedDestChains, srcAssets, destAssets] = await Promise.all([
        this.swapSdk.getChains(srcChainId),
        this.swapSdk.getAssets(srcChainId),
        this.swapSdk.getAssets(destChainId)
      ]);

      const supportedDestChainId = supportedDestChains.find((c) => c.chain === destChainId);
      const srcAssetData = srcAssets.find((a) => a.asset === fromAssetId);
      const destAssetData = destAssets.find((a) => a.asset === toAssetId);

      isRouteToDestChainSupported = !!supportedDestChainId;
      isAssetSupported = !!srcAssetData && !!destAssetData;

      if (!srcAssetData) {
        return false;
      }

      const bnMinSwap = new BigN(srcAssetData.minimumSwapAmount);

      if (bnAmount.lt(bnMinSwap)) {
        isAmountValid = false;
      }

      if (srcAssetData.maximumSwapAmount) {
        const bnMaxSwap = new BigN(srcAssetData.maximumSwapAmount);

        if (bnAmount.gt(bnMaxSwap)) {
          isAmountValid = false;
        }
      }

      return isRouteToDestChainSupported && isAssetSupported && isAmountValid;
    } catch (e) {
      console.log('Error validating swap request', e);

      return false;
    }
  }

  public async getSwapQuote (request: SwapRequest): Promise<SwapQuote | undefined> {
    const fromAsset = this.chainService.getAssetBySlug(request.pair.from);
    const toAsset = this.chainService.getAssetBySlug(request.pair.to);

    if (!fromAsset || !toAsset) {
      return undefined;
    }

    const validated = await this.validateSwapRequest(request);

    console.log('validated', validated);

    try {
      const quoteResponse = await this.swapSdk.getQuote({
        srcChain: chainFlipConvertChainId(fromAsset.originChain),
        amount: request.fromAmount, // TODO: if amount < minSwap || amount > maxSwap, setup mock amount as min and max swap amount
        destChain: chainFlipConvertChainId(toAsset.originChain),
        srcAsset: fromAsset.symbol as Asset,
        destAsset: toAsset.symbol as Asset
      });

      return {
        pair: request.pair,
        fromAmount: request.fromAmount,
        toAmount: quoteResponse.quote.egressAmount.toString(),
        rate: 0.1,
        provider: this.providerInfo
      } as SwapQuote;
    } catch (e) {
      console.error('Error getting quote from Chainflip', e);

      return undefined;
    }
  }

  generateOptimalProcess (params: OptimalSwapPathParams): Promise<OptimalSwapPath> {
    return Promise.resolve({
      totalFee: [],
      steps: []
    });
  }
}
