// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EvmRpcError } from '@subwallet/extension-base/background/errors/EvmRpcError';
import { ConfirmationDefinitions, ConfirmationsQueue, ConfirmationsQueueItemOptions, ConfirmationType, RequestConfirmationComplete } from '@subwallet/extension-base/background/KoniTypes';
import { Resolver } from '@subwallet/extension-base/background/types';
import RequestService from '@subwallet/extension-base/services/request-service';
import { BehaviorSubject } from 'rxjs';

import { logger as createLogger } from '@polkadot/util';
import { Logger } from '@polkadot/util/types';

export default class EvmRequestHandler {
  readonly #requestService: RequestService;
  readonly #logger: Logger;
  private readonly confirmationsQueueSubject = new BehaviorSubject<ConfirmationsQueue>({
    addNetworkRequest: {},
    addTokenRequest: {},
    switchNetworkRequest: {},
    evmSignatureRequest: {},
    evmSignatureRequestExternal: {},
    evmSendTransactionRequest: {},
    evmSendTransactionRequestExternal: {}
  });

  private readonly confirmationsPromiseMap: Record<string, { resolver: Resolver<any>, validator?: (rs: any) => Error | undefined }> = {};

  constructor (requestService: RequestService) {
    this.#requestService = requestService;
    this.#logger = createLogger('EvmRequestHandler');
  }

  public get numEvmRequests (): number {
    let count = 0;

    Object.values(this.confirmationsQueueSubject.getValue()).forEach((x) => {
      count += Object.keys(x).length;
    });

    return count;
  }

  public getConfirmationsQueueSubject (): BehaviorSubject<ConfirmationsQueue> {
    return this.confirmationsQueueSubject;
  }

  public addConfirmation<CT extends ConfirmationType> (
    id: string,
    url: string,
    type: CT,
    payload: ConfirmationDefinitions[CT][0]['payload'],
    options: ConfirmationsQueueItemOptions = {},
    validator?: (input: ConfirmationDefinitions[CT][1]) => Error | undefined
  ): Promise<ConfirmationDefinitions[CT][1]> {
    const confirmations = this.confirmationsQueueSubject.getValue();
    const confirmationType = confirmations[type] as Record<string, ConfirmationDefinitions[CT][0]>;
    const payloadJson = JSON.stringify(payload);

    // Check duplicate request
    const duplicated = Object.values(confirmationType).find((c) => (c.url === url) && (c.payloadJson === payloadJson));

    if (duplicated) {
      throw new EvmRpcError('INVALID_PARAMS', 'Duplicate request information');
    }

    confirmationType[id] = {
      id,
      url,
      payload,
      payloadJson,
      ...options
    } as ConfirmationDefinitions[CT][0];

    const promise = new Promise<ConfirmationDefinitions[CT][1]>((resolve, reject) => {
      this.confirmationsPromiseMap[id] = {
        validator: validator,
        resolver: {
          resolve: resolve,
          reject: reject
        }
      };
    });

    this.confirmationsQueueSubject.next(confirmations);

    // Not open new popup and use existed
    const popupList = this.#requestService.popup;

    if (this.#requestService.popup.length > 0) {
      // eslint-disable-next-line no-void
      void chrome.windows.update(popupList[0], { focused: true });
    } else {
      this.#requestService.popupOpen();
    }

    this.#requestService.updateIconV2();

    return promise;
  }

  public completeConfirmation (request: RequestConfirmationComplete): boolean {
    const confirmations = this.confirmationsQueueSubject.getValue();

    const _completeConfirmation = <T extends ConfirmationType> (type: T, result: ConfirmationDefinitions[T][1]) => {
      const { id } = result;
      const { resolver, validator } = this.confirmationsPromiseMap[id];

      if (!resolver || !(confirmations[type][id])) {
        this.#logger.error('Not found confirmation', type, id);
        throw new Error('Not found promise for confirmation');
      }

      // Validate response from confirmation popup some info like password, response format....
      const error = validator && validator(result);

      if (error) {
        resolver.reject(error);
      }

      // Delete confirmations from queue
      delete this.confirmationsPromiseMap[id];
      delete confirmations[type][id];
      this.confirmationsQueueSubject.next(confirmations);

      // Update icon, and close queue
      this.#requestService.updateIconV2(this.#requestService.numAllRequests === 0);
      resolver.resolve(result);
    };

    Object.entries(request).forEach(([type, result]) => {
      if (type === 'addNetworkRequest') {
        _completeConfirmation(type, result as ConfirmationDefinitions['addNetworkRequest'][1]);
      } else if (type === 'addTokenRequest') {
        _completeConfirmation(type, result as ConfirmationDefinitions['addTokenRequest'][1]);
      } else if (type === 'switchNetworkRequest') {
        _completeConfirmation(type, result as ConfirmationDefinitions['switchNetworkRequest'][1]);
      } else if (type === 'evmSignatureRequest') {
        _completeConfirmation(type, result as ConfirmationDefinitions['evmSignatureRequest'][1]);
      } else if (type === 'evmSignatureRequestExternal') {
        _completeConfirmation(type, result as ConfirmationDefinitions['evmSignatureRequestExternal'][1]);
      } else if (type === 'evmSendTransactionRequest') {
        _completeConfirmation(type, result as ConfirmationDefinitions['evmSendTransactionRequest'][1]);
      } else if (type === 'evmSendTransactionRequestExternal') {
        _completeConfirmation(type, result as ConfirmationDefinitions['evmSendTransactionRequestExternal'][1]);
      }
    });

    return true;
  }
}
