// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountJson, RequestSign, Resolver, ResponseSigning } from '@subwallet/extension-base/background/types';
import RequestService from '@subwallet/extension-base/services/request-service';
import { SigningRequest, SignRequest } from '@subwallet/extension-base/services/request-service/types';
import { getId } from '@subwallet/extension-base/utils/getId';
import { BehaviorSubject } from 'rxjs';

import { logger as createLogger } from '@polkadot/util/logger';
import { Logger } from '@polkadot/util/types';

export default class SubstrateRequestHandler {
  readonly #logger: Logger;
  readonly #requestService: RequestService;
  readonly #substrateRequests: Record<string, SignRequest> = {};
  public readonly signSubject: BehaviorSubject<SigningRequest[]> = new BehaviorSubject<SigningRequest[]>([]);

  constructor (requestService: RequestService) {
    this.#requestService = requestService;
    this.#logger = createLogger('SubstrateRequestHandler');
  }

  public get allSubstrateRequests (): SigningRequest[] {
    return Object
      .values(this.#substrateRequests)
      .map(({ account, id, request, url }): SigningRequest => ({ account, id, request, url }));
  }

  public getSignRequest (id: string): SignRequest {
    return this.#substrateRequests[id];
  }

  private signComplete = (id: string, resolve: (result: ResponseSigning) => void, reject: (error: Error) => void): Resolver<ResponseSigning> => {
    const complete = (): void => {
      delete this.#substrateRequests[id];
      this.#requestService.updateIconV2(true);
    };

    return {
      reject: (error: Error): void => {
        complete();
        this.#logger.log(error);
        reject(error);
      },
      resolve: (result: ResponseSigning): void => {
        complete();
        resolve(result);
      }
    };
  };

  public sign (url: string, request: RequestSign, account: AccountJson): Promise<ResponseSigning> {
    const id = getId();

    return new Promise((resolve, reject): void => {
      this.#substrateRequests[id] = {
        ...this.signComplete(id, resolve, reject),
        account,
        id,
        request,
        url
      };

      this.#requestService.updateIconV2();
      this.#requestService.popupOpen();
    });
  }
}
