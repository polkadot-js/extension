// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _AssetRef, _AssetRefPath } from '@subwallet/chain-list/types';
import { SwapError } from '@subwallet/extension-base/background/errors/SwapError';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType } from '@subwallet/extension-base/background/KoniTypes';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { BaseServiceWithProcess } from '@subwallet/extension-base/services/base/service-with-process';
import { ServiceStatus, StoppableServiceInterface } from '@subwallet/extension-base/services/base/types';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { EventService } from '@subwallet/extension-base/services/event-service';
import { SwapBaseHandler } from '@subwallet/extension-base/services/swap-service/handler/base-handler';
import { ChainflipSwapHandler } from '@subwallet/extension-base/services/swap-service/handler/chainflip-handler';
import { _SUPPORTED_SWAP_PROVIDERS, OptimalSwapPath, OptimalSwapPathParams, QuoteAskResponse, SwapPair, SwapQuote, SwapRequest, SwapRequestResult } from '@subwallet/extension-base/types/swap';
import { createPromiseHandler, PromiseHandler } from '@subwallet/extension-base/utils';
import { BehaviorSubject } from 'rxjs';

const MOCK_ASSET_REF: Record<string, _AssetRef> = {
  'polkadot-NATIVE-DOT___ethereum-NATIVE-ETH': {
    path: _AssetRefPath.XCM,
    srcChain: 'polkadot',
    srcAsset: 'polkadot-NATIVE-DOT',
    destChain: 'ethereum',
    destAsset: 'ethereum-NATIVE-ETH'
  }
};

export class SwapService extends BaseServiceWithProcess implements StoppableServiceInterface {
  protected readonly state: KoniState;
  private eventService: EventService;
  private chainService: ChainService;
  private swapPairSubject: BehaviorSubject<SwapPair[]> = new BehaviorSubject<SwapPair[]>([]);
  private handlers: Record<string, SwapBaseHandler> = {};

  startPromiseHandler: PromiseHandler<void> = createPromiseHandler();
  stopPromiseHandler: PromiseHandler<void> = createPromiseHandler();
  status: ServiceStatus = ServiceStatus.NOT_INITIALIZED;

  constructor (state: KoniState) {
    super();
    this.state = state;
    this.eventService = state.eventService;
    this.chainService = state.chainService;
  }

  private async askProvidersForQuote (request: SwapRequest): Promise<QuoteAskResponse[]> {
    const availableQuotes: QuoteAskResponse[] = [];

    await Promise.all(Object.values(this.handlers).map(async (handler) => {
      const quote = await handler.getSwapQuote(request);

      if (!(quote instanceof SwapError)) {
        availableQuotes.push({
          quote
        });
      } else {
        availableQuotes.push({
          error: quote
        });
      }
    }));

    return availableQuotes; // todo: need to propagate error for further handling
  }

  public async generateOptimalProcess (params: OptimalSwapPathParams): Promise<OptimalSwapPath> {
    const providerId = params.selectedQuote.provider.id;
    const handler = this.handlers[providerId];

    if (handler) {
      return handler.generateOptimalProcess(params);
    } else {
      throw new TransactionError(BasicTxErrorType.INTERNAL_ERROR);
    }
  }

  public async handleSwapRequest (request: SwapRequest): Promise<SwapRequestResult> {
    /*
    * 1. Ask swap quotes from providers
    * 2. Select the best quote
    * 3. Generate optimal process for that quote
    * */
    const quoteAskResponses = await this.askProvidersForQuote(request);
    const availableQuotes = quoteAskResponses.filter((quote) => !quote.error).map((quote) => quote.quote as SwapQuote); // todo
    const selectedQuote = quoteAskResponses[0]?.quote as SwapQuote; // todo: more logic to select the best quote
    const quoteError = quoteAskResponses[0]?.error as SwapError; // todo

    const optimalProcess = await this.generateOptimalProcess({
      request,
      selectedQuote
    });

    return {
      process: optimalProcess,
      quote: {
        optimalQuote: selectedQuote,
        quotes: availableQuotes,
        error: quoteError
      }
    } as SwapRequestResult;
  }

  public async getLatestSwapQuote (swapQuote: SwapQuote): Promise<SwapQuote> {
    swapQuote.rate *= 0.005;

    return Promise.resolve(swapQuote);
  }

  private initHandlers () {
    _SUPPORTED_SWAP_PROVIDERS.forEach((providerId) => {
      switch (providerId) {
        case 'CHAIN_FLIP':
          this.handlers[providerId] = new ChainflipSwapHandler(providerId, 'Chainflip', this.chainService);

          break;
        default:
          throw new Error('Unsupported provider');
      }
    });
  }

  async init (): Promise<void> {
    this.status = ServiceStatus.INITIALIZING;
    this.eventService.emit('earning.ready', true);

    this.status = ServiceStatus.INITIALIZED;

    this.initHandlers();

    await this.start();
  }

  async start (): Promise<void> {
    if (this.status === ServiceStatus.STOPPING) {
      await this.waitForStopped();
    }

    if (this.status === ServiceStatus.STARTED || this.status === ServiceStatus.STARTING) {
      return this.waitForStarted();
    }

    this.status = ServiceStatus.STARTING;

    // todo: start the service jobs, subscribe data,...

    this.swapPairSubject.next(this.getSwapPairs()); // todo: might need to change it online

    // Update promise handler
    this.startPromiseHandler.resolve();
    this.stopPromiseHandler = createPromiseHandler();

    this.status = ServiceStatus.STARTED;
  }

  async stop (): Promise<void> {
    if (this.status === ServiceStatus.STARTING) {
      await this.waitForStarted();
    }

    if (this.status === ServiceStatus.STOPPED || this.status === ServiceStatus.STOPPING) {
      return this.waitForStopped();
    }

    // todo: unsub, persist data,...

    this.stopPromiseHandler.resolve();
    this.startPromiseHandler = createPromiseHandler();

    this.status = ServiceStatus.STOPPED;
  }

  waitForStarted (): Promise<void> {
    return this.startPromiseHandler.promise;
  }

  waitForStopped (): Promise<void> {
    return this.stopPromiseHandler.promise;
  }

  public getSwapPairs (): SwapPair[] {
    return Object.entries(MOCK_ASSET_REF).map(([slug, assetRef]) => {
      return {
        slug,
        from: assetRef.srcAsset,
        to: assetRef.destAsset
      } as SwapPair;
    });
  }

  public subscribeSwapPairs () {
    return this.swapPairSubject;
  }
}
