// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Resolver } from '@subwallet/extension-base/background/types';
import RequestService from '@subwallet/extension-base/services/request-service';
import { RequestWalletConnectNotSupport, WalletConnectNotSupportRequest } from '@subwallet/extension-base/services/wallet-connect-service/types';
import { BehaviorSubject } from 'rxjs';

// WC = WalletConnect
export default class NotSupportWCRequestHandler {
  readonly #requestService: RequestService;
  readonly #notSupportWCRequests: Record<string, RequestWalletConnectNotSupport> = {};
  public readonly notSupportWCSubject: BehaviorSubject<WalletConnectNotSupportRequest[]> = new BehaviorSubject<WalletConnectNotSupportRequest[]>([]);

  constructor (requestService: RequestService) {
    this.#requestService = requestService;
  }

  public get allNotSupportWCRequests (): WalletConnectNotSupportRequest[] {
    return Object
      .values(this.#notSupportWCRequests)
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .map(({ reject, resolve, ...data }) => data);
  }

  public get numNotSupportWCRequests (): number {
    return Object.keys(this.#notSupportWCRequests).length;
  }

  public getNotSupportWCRequest (id: string): RequestWalletConnectNotSupport {
    return this.#notSupportWCRequests[id];
  }

  private updateIconNotSupportWC (shouldClose?: boolean): void {
    this.notSupportWCSubject.next(this.allNotSupportWCRequests);
    this.#requestService.updateIconV2(shouldClose);
  }

  private notSupportWCComplete = (id: string): Resolver<void> => {
    const complete = (shouldClose: boolean): void => {
      delete this.#notSupportWCRequests[id];
      this.updateIconNotSupportWC(shouldClose);
    };

    return {
      reject: (): void => {
        complete(true);
      },
      resolve: (): void => {
        complete(true);
      }
    };
  };

  public addNotSupportWCRequest (request: WalletConnectNotSupportRequest) {
    const id = request.id;

    this.#notSupportWCRequests[id] = {
      ...this.notSupportWCComplete(id),
      ...request
    };

    this.updateIconNotSupportWC();
    this.#requestService.popupOpen();
  }

  public resetWallet () {
    for (const request of Object.values(this.#notSupportWCRequests)) {
      request.reject(new Error('Reset wallet'));
    }

    this.notSupportWCSubject.next([]);
  }
}
