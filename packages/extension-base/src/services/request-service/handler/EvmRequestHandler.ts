// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EvmRpcError } from '@subwallet/extension-base/background/errors/EvmRpcError';
import { ConfirmationDefinitions, ConfirmationsQueue, ConfirmationsQueueItemOptions, ConfirmationType, RequestConfirmationComplete } from '@subwallet/extension-base/background/KoniTypes';
import { Resolver } from '@subwallet/extension-base/background/types';
import RequestService from '@subwallet/extension-base/services/request-service';
import { anyNumberToBN } from '@subwallet/extension-base/utils/eth';
import keyring from '@subwallet/ui-keyring';
import {Transaction, TxData} from 'ethereumjs-tx';
import { BehaviorSubject } from 'rxjs';
import { TransactionConfig } from 'web3-core';

import {logger as createLogger} from '@polkadot/util';
import { Logger } from '@polkadot/util/types';
import {toBuffer} from "ethereumjs-util";
import Common from "@ethereumjs/common";
import BN from "bn.js";

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

  private async signMessage (confirmation: ConfirmationDefinitions['evmSignatureRequest'][0]): Promise<string> {
    const { address, payload, type } = confirmation.payload;
    const pair = keyring.getPair(address);
    if (pair.isLocked) {
      keyring.unlockPair(pair.address)
    }

    switch (type) {
      case 'eth_sign':
      case 'personal_sign':
      case 'eth_signTypedData':
      case 'eth_signTypedData_v1':
      case 'eth_signTypedData_v3':
      case 'eth_signTypedData_v4':
        return await pair.evmSigner.signMessage(payload, type);
      default:
        throw new EvmRpcError('INVALID_PARAMS', 'Not found sign method');
    }
  }

  configToTransaction(config: TransactionConfig): Transaction {
    function formatField (input: string | number | undefined | BN): BN | number | string | undefined {
      if (typeof input === "string") {
        if (input.startsWith('0x')) {
          return input;
        } else {
          return new BN(input);
        }
      }

      return input;
    }

    // Convert any string, number to number with BigN exclude hex string
    const txData = {
      from: config.from,
      nonce: formatField(config.nonce),
      gasPrice: formatField(config.gasPrice),
      gasLimit: formatField(config.gas),
      to: config.to,
      value: formatField(config.value),
      data: toBuffer(config.data)
    };

    const common = Common.custom( {chainId: config.chainId})
    // @ts-ignore
    return new Transaction(txData, {common});
  }

  private async signTransaction (confirmation: ConfirmationDefinitions['evmSendTransactionRequest'][0]): Promise<string> {
    const transaction = confirmation.payload;
    const { estimateGas, from, gasPrice } = transaction;
    const pair = keyring.getPair(from as string);
    const params = {
      ...transaction,
      gasPrice: anyNumberToBN(gasPrice).toNumber(),
      gasLimit: anyNumberToBN(estimateGas).toNumber()
      // nonce: await web3.eth.getTransactionCount(from) // Todo: fill this value from transaction service
    } as TransactionConfig;
    const tx = this.configToTransaction(params);

    await Promise.resolve();
    if (pair.isLocked) {
      keyring.unlockPair(pair.address);
    }
    return pair.evmSigner.signTransaction(tx);
  }

  private async decorateResult<T extends ConfirmationType> (t: T, request: ConfirmationDefinitions[T][0], result: ConfirmationDefinitions[T][1]) {
    if (result.payload === '') {
      if (t === 'evmSignatureRequest') {
        result.payload = await this.signMessage(request as ConfirmationDefinitions['evmSignatureRequest'][0]);
      } else if (t === 'evmSendTransactionRequest') {
        result.payload = await this.signTransaction(request as ConfirmationDefinitions['evmSendTransactionRequest'][0]);
      }
    }
  }

  public async completeConfirmation (request: RequestConfirmationComplete): Promise<boolean> {
    const confirmations = this.confirmationsQueueSubject.getValue();

    for (const ct in request) {
      const t = ct as ConfirmationType;
      const result = request[t] as ConfirmationDefinitions[typeof t][1];

      const { id } = result;
      const { resolver, validator } = this.confirmationsPromiseMap[id];
      const confirmation = confirmations[t][id];

      if (!resolver || !confirmation) {
        this.#logger.error('Not found confirmation', t, id);
        throw new Error('Not found promise for confirmation');
      }

      // Fill signature for some special type
      await this.decorateResult(t, confirmation, result);

      // Validate response from confirmation popup some info like password, response format....
      const error = validator && validator(result);

      if (error) {
        resolver.reject(error);
      }

      // Delete confirmations from queue
      delete this.confirmationsPromiseMap[id];
      delete confirmations[t][id];
      this.confirmationsQueueSubject.next(confirmations);

      // Update icon, and close queue
      this.#requestService.updateIconV2(this.#requestService.numAllRequests === 0);
      resolver.resolve(result);
    }

    return true;
  }
}
