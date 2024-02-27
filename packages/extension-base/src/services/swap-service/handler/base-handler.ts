// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { OptimalSwapPath, OptimalSwapPathParams, SwapProvider, SwapProviderId, SwapQuote, SwapRequest } from '@subwallet/extension-base/types/swap';

export abstract class SwapBaseHandler {
  protected providerSlug: string;
  protected providerName: string;

  protected constructor (providerSlug: string, providerName: string) {
    this.providerName = providerName;
    this.providerSlug = providerSlug;
  }

  public abstract getSwapQuote(request: SwapRequest): Promise<SwapQuote | undefined>;
  public abstract generateOptimalProcess(params: OptimalSwapPathParams): Promise<OptimalSwapPath>;
  protected abstract validateSwapRequest(request: SwapRequest): Promise<boolean>;

  get name (): string {
    return this.providerName;
  }

  get slug (): string {
    return this.providerSlug;
  }

  get providerInfo (): SwapProvider {
    return {
      id: this.providerSlug as SwapProviderId,
      name: this.providerName
    };
  }
}
