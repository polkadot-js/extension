// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Resolver } from '@subwallet/extension-base/background/types';
import RequestService from '@subwallet/extension-base/services/request-service';
import { WalletConnectSessionRequest, RequestWalletConnectSession } from '@subwallet/extension-base/services/wallet-connect-service/types';
import { BehaviorSubject } from 'rxjs';

// WC = WalletConnect
export default class WalletConnectRequestHandler {
  readonly #requestService: RequestService;
  readonly #wallletConnectSessionRequests: Record<string, RequestWalletConnectSession> = {};
  public readonly connectWCSubject: BehaviorSubject<WalletConnectSessionRequest[]> = new BehaviorSubject<WalletConnectSessionRequest[]>([]);

  constructor (requestService: RequestService) {
    this.#requestService = requestService;
  }

  public get allConnectWCRequests (): WalletConnectSessionRequest[] {
    return Object
      .values(this.#wallletConnectSessionRequests)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ reject, resolve, ...data }) => data);
  }

  public get numConnectWCRequests (): number {
    return Object.keys(this.#wallletConnectSessionRequests).length;
  }

  public getConnectWCRequest (id: string): RequestWalletConnectSession {
    return this.#wallletConnectSessionRequests[id];
  }

  private updateIconConnectWC (shouldClose?: boolean): void {
    this.connectWCSubject.next(this.allConnectWCRequests);
    this.#requestService.updateIconV2(shouldClose);
  }

  private connectWCComplete = (id: string): Resolver<void> => {
    const complete = (): void => {
      delete this.#wallletConnectSessionRequests[id];
      this.updateIconConnectWC(true);
    };

    return {
      reject: (): void => {
        complete();
      },
      resolve: (): void => {
        complete();
      }
    };
  };

  public addConnectWCRequest (request: WalletConnectSessionRequest) {
    const id = request.id;

    this.#wallletConnectSessionRequests[id] = {
      ...this.connectWCComplete(id),
      ...request
    };

    this.updateIconConnectWC();
    this.#requestService.popupOpen();
  }

  public resetWallet () {
    for (const request of Object.values(this.#wallletConnectSessionRequests)) {
      request.reject(new Error('Reset wallet'));
    }

    this.connectWCSubject.next([]);
  }
}
