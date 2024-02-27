// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { Asset, Chain, SwapSDK } from '@chainflip/sdk/swap';
import { _ChainAsset } from '@subwallet/chain-list/types';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { SwapBaseHandler } from '@subwallet/extension-base/services/swap-service/handler/base-handler';
import { chainFlipConvertChainId } from '@subwallet/extension-base/services/swap-service/utils';
import { OptimalSwapPath, OptimalSwapPathParams, SwapQuote, SwapRequest } from '@subwallet/extension-base/types/swap';

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
    let isChainSupported = false;
    const isAssetSupported = false;

    const fromAsset = this.chainService.getAssetBySlug(request.pair.from);
    const toAsset = this.chainService.getAssetBySlug(request.pair.to);

    const srcChain = fromAsset.originChain;
    const destChain = toAsset.originChain;

    const srcChainId = srcChain[0].toUpperCase() + srcChain.slice(1);
    const destChainId = destChain[0].toUpperCase() + destChain.slice(1);

    const chain = await this.swapSdk.getChains(srcChainId as Chain);
    const supportedChainId = chain.map((c) => c.chain);

    if (supportedChainId.includes(destChainId as Chain)) {
      isChainSupported = true;
    }

    return isChainSupported && isAssetSupported;
  }

  public async getSwapQuote (request: SwapRequest): Promise<SwapQuote | undefined> {
    const fromAsset = this.chainService.getAssetBySlug(request.pair.from);
    const toAsset = this.chainService.getAssetBySlug(request.pair.to);

    if (!fromAsset || !toAsset) {
      return undefined;
    }

    try {
      const quoteResponse = await this.swapSdk.getQuote({
        srcChain: chainFlipConvertChainId(fromAsset.originChain),
        amount: request.fromAmount,
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
