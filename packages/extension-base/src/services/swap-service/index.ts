// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _AssetRef, _AssetRefPath } from '@subwallet/chain-list/types';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { ServiceStatus, StoppableServiceInterface } from '@subwallet/extension-base/services/base/types';
import { ChainService } from '@subwallet/extension-base/services/chain-service';
import { EventService } from '@subwallet/extension-base/services/event-service';
import { SWFee, SWFeeType } from '@subwallet/extension-base/types/fee';
import { SwapPair, SwapQuote, SwapQuoteResponse, SwapRequest } from '@subwallet/extension-base/types/swap';
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

export class SwapService implements StoppableServiceInterface {
  protected readonly state: KoniState;
  private eventService: EventService;
  private chainService: ChainService;
  private swapPairSubject: BehaviorSubject<SwapPair[]> = new BehaviorSubject<SwapPair[]>([]);

  startPromiseHandler: PromiseHandler<void> = createPromiseHandler();
  status: ServiceStatus = ServiceStatus.NOT_INITIALIZED;

  stopPromiseHandler: PromiseHandler<void> = createPromiseHandler();

  constructor (state: KoniState) {
    this.state = state;
    this.eventService = state.eventService;
    this.chainService = state.chainService;
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

  public async handleSwapRequest (request: SwapRequest): Promise<SwapQuoteResponse> {
    // todo: calculate fee
    const feeStruct = SWFee.buildSimpleFee(this.chainService.getAssetBySlug(request.pair.from), request.fromAmount, SWFeeType.SUBSTRATE);
    const mockQuote = {
      pair: request.pair,
      fromAmount: request.fromAmount,
      toAmount: '0.1',
      rate: 0.1,
      provider: {
        slug: 'mock',
        name: 'Mock Provider',
        faq: 'https://mock.com/faq'
      }
    } as SwapQuote;

    return Promise.resolve({
      feeStruct,
      quotes: [mockQuote],
      optimalQuote: mockQuote
    });
  }

  public async getLatestSwapQuote (swapQuote: SwapQuote): Promise<SwapQuote> {
    swapQuote.rate *= 0.005;

    return Promise.resolve(swapQuote);
  }

  async init (): Promise<void> {
    this.status = ServiceStatus.INITIALIZING;
    this.eventService.emit('earning.ready', true);

    this.status = ServiceStatus.INITIALIZED;

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

    // todo: start the service, subscribe data,...

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
}
