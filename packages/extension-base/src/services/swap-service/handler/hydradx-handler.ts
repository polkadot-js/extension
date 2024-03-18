// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { PoolService, TradeRouter } from '@galacticcouncil/sdk';
import { SwapError } from '@subwallet/extension-base/background/errors/SwapError';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { SwapBaseHandler, SwapBaseHandlerInitParams, SwapBaseInterface } from '@subwallet/extension-base/services/swap-service/handler/base-handler';
import { OptimalSwapPath, OptimalSwapPathParams, SwapEarlyValidation, SwapQuote, SwapRequest, SwapSubmitParams, SwapSubmitStepData, ValidateSwapProcessParams } from '@subwallet/extension-base/types/swap';

const HYDRADX_CHAIN_SLUG = 'hydradx_main';

export class HydradxHandler implements SwapBaseInterface {
  private swapBaseHandler: SwapBaseHandler;
  private tradeRouter: TradeRouter;
  private isTestnet: boolean;
  public isReady = false;

  constructor (baseHandlerInitParams: SwapBaseHandlerInitParams, isTestnet: boolean) {
    this.swapBaseHandler = new SwapBaseHandler(baseHandlerInitParams);

    this.isTestnet = isTestnet;
  }

  public async init (): Promise<void> {
    const chainState = this.chainService.getChainStateByKey(this.chain);

    if (!chainState.active) {
      await this.chainService.enableChain(this.chain);
    }

    const substrateApi = this.chainService.getSubstrateApi(this.chain);
    const poolService = new PoolService(substrateApi.api);

    this.tradeRouter = new TradeRouter(poolService);
  }

  get chain () {
    return HYDRADX_CHAIN_SLUG;
  }

  get chainService () {
    return this.swapBaseHandler.chainService;
  }

  get balanceService () {
    return this.swapBaseHandler.balanceService;
  }

  get providerInfo () {
    return this.swapBaseHandler.providerInfo;
  }

  get name () {
    return this.swapBaseHandler.name;
  }

  get slug () {
    return this.swapBaseHandler.slug;
  }

  generateOptimalProcess (params: OptimalSwapPathParams): Promise<OptimalSwapPath> {
    return Promise.resolve(undefined);
  }

  getSwapQuote (request: SwapRequest): Promise<SwapQuote | SwapError> {
    return Promise.resolve(undefined);
  }

  handleSubmitStep (params: SwapSubmitParams): Promise<SwapSubmitStepData> {
    return Promise.resolve(undefined);
  }

  handleSwapProcess (params: SwapSubmitParams): Promise<SwapSubmitStepData> {
    return Promise.resolve(undefined);
  }

  validateSwapProcess (params: ValidateSwapProcessParams): Promise<TransactionError[]> {
    return Promise.resolve([]);
  }

  validateSwapRequest (request: SwapRequest): Promise<SwapEarlyValidation> {
    return Promise.resolve(undefined);
  }
}
