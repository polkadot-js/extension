// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Common } from '@ethereumjs/common';
import { FeeMarketEIP1559Transaction, FeeMarketEIP1559TxData, LegacyTransaction, LegacyTxData, TypedTransaction } from '@ethereumjs/tx';
import { EvmProviderError } from '@subwallet/extension-base/background/errors/EvmProviderError';
import { ConfirmationDefinitions, ConfirmationsQueue, ConfirmationsQueueItemOptions, ConfirmationType, EvmProviderErrorType, RequestConfirmationComplete } from '@subwallet/extension-base/background/KoniTypes';
import { ConfirmationRequestBase, Resolver } from '@subwallet/extension-base/background/types';
import RequestService from '@subwallet/extension-base/services/request-service';
import { anyNumberToBN } from '@subwallet/extension-base/utils/eth';
import { isInternalRequest } from '@subwallet/extension-base/utils/request';
import keyring from '@subwallet/ui-keyring';
import BigN from 'bignumber.js';
import BN from 'bn.js';
import { toBuffer } from 'ethereumjs-util';
import { t } from 'i18next';
import { BehaviorSubject } from 'rxjs';
import { TransactionConfig } from 'web3-core';

import { bnToHex, hexAddPrefix, logger as createLogger } from '@polkadot/util';
import { Logger } from '@polkadot/util/types';

export default class EvmRequestHandler {
  readonly #requestService: RequestService;
  readonly #logger: Logger;
  private readonly confirmationsQueueSubject = new BehaviorSubject<ConfirmationsQueue>({
    addNetworkRequest: {},
    addTokenRequest: {},
    evmSignatureRequest: {},
    evmSendTransactionRequest: {},
    evmWatchTransactionRequest: {},
    errorConnectNetwork: {}
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

  public async addConfirmation<CT extends ConfirmationType> (
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
    const isInternal = isInternalRequest(url);

    if (['evmSignatureRequest', 'evmSendTransactionRequest'].includes(type)) {
      const isAlwaysRequired = await this.#requestService.settingService.isAlwaysRequired;

      if (isAlwaysRequired) {
        this.#requestService.keyringService.lock();
      }
    }

    // Check duplicate request
    const duplicated = Object.values(confirmationType).find((c) => (c.url === url) && (c.payloadJson === payloadJson));

    if (duplicated) {
      throw new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, t('Duplicate request'));
    }

    confirmationType[id] = {
      id,
      url,
      isInternal,
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

    if (!isInternal) {
      this.#requestService.popupOpen();
    }

    this.#requestService.updateIconV2();

    return promise;
  }

  public updateConfirmation<CT extends ConfirmationType> (
    id: string,
    type: CT,
    payload: ConfirmationDefinitions[CT][0]['payload'],
    options: ConfirmationsQueueItemOptions = {},
    validator?: (input: ConfirmationDefinitions[CT][1]) => Error | undefined
  ) {
    const confirmations = this.confirmationsQueueSubject.getValue();
    const confirmationType = confirmations[type] as Record<string, ConfirmationDefinitions[CT][0]>;

    // Check duplicate request
    const exists = confirmationType[id];

    if (!exists) {
      throw new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, t('Request does not exist'));
    }

    const payloadJson = JSON.stringify(payload);

    confirmationType[id] = {
      ...exists,
      payload,
      payloadJson,
      ...options
    } as ConfirmationDefinitions[CT][0];

    if (validator) {
      this.confirmationsPromiseMap[id].validator = validator;
    }

    this.confirmationsQueueSubject.next(confirmations);
  }

  private async signMessage (confirmation: ConfirmationDefinitions['evmSignatureRequest'][0]): Promise<string> {
    const { account, payload, type } = confirmation.payload;
    const address = account.address;
    const pair = keyring.getPair(address);

    if (pair.isLocked) {
      keyring.unlockPair(pair.address);
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
        throw new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, t('Unsupported action'));
    }
  }

  configToTransaction (config: TransactionConfig): TypedTransaction {
    function formatField (input: string | number | undefined | BN): number | string | undefined {
      if (typeof input === 'string' || typeof input === 'number') {
        return hexAddPrefix(new BigN(input).toString(16));
      } else if (typeof input === 'undefined') {
        return undefined;
      }

      return bnToHex(input);
    }

    const common = Common.custom({ chainId: config.chainId, defaultHardfork: 'london', networkId: config.chainId }, { eips: [1559] });

    if (config.maxFeePerGas) {
      const txData: FeeMarketEIP1559TxData = {
        nonce: formatField(config.nonce),
        gasLimit: formatField(config.gas),
        to: config.to,
        value: formatField(config.value),
        data: toBuffer(config.data),
        maxFeePerGas: formatField(config.maxFeePerGas),
        maxPriorityFeePerGas: formatField(config.maxPriorityFeePerGas),
        chainId: config.chainId
      };

      return new FeeMarketEIP1559Transaction(txData, { common });
    } else {
      // Convert any string, number to number with BigN exclude hex string
      const txData: LegacyTxData = {
        nonce: formatField(config.nonce),
        gasLimit: formatField(config.gas),
        gasPrice: formatField(config.gasPrice),
        to: config.to,
        value: formatField(config.value),
        data: toBuffer(config.data)
      };

      return new LegacyTransaction(txData, { common });
    }
  }

  private async signTransaction (confirmation: ConfirmationDefinitions['evmSendTransactionRequest'][0]): Promise<string> {
    const transaction = confirmation.payload;
    const { estimateGas, from, gas, gasPrice, maxFeePerGas, maxPriorityFeePerGas, value } = transaction;
    const pair = keyring.getPair(from as string);
    const params = {
      ...transaction,
      gas: anyNumberToBN(gas).toNumber(),
      value: anyNumberToBN(value).toNumber(),
      gasPrice: anyNumberToBN(gasPrice).toNumber(),
      gasLimit: anyNumberToBN(estimateGas).toNumber(),
      maxFeePerGas: anyNumberToBN(maxFeePerGas).toNumber(),
      maxPriorityFeePerGas: anyNumberToBN(maxPriorityFeePerGas).toNumber()
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

      if (t === 'evmSignatureRequest' || t === 'evmSendTransactionRequest') {
        const isAlwaysRequired = await this.#requestService.settingService.isAlwaysRequired;

        if (isAlwaysRequired) {
          this.#requestService.keyringService.lock();
        }
      }
    }
  }

  public async completeConfirmation (request: RequestConfirmationComplete): Promise<boolean> {
    const confirmations = this.confirmationsQueueSubject.getValue();

    for (const ct in request) {
      const type = ct as ConfirmationType;
      const result = request[type] as ConfirmationDefinitions[typeof type][1];

      const { id } = result;
      const { resolver, validator } = this.confirmationsPromiseMap[id];
      const confirmation = confirmations[type][id];

      if (!resolver || !confirmation) {
        this.#logger.error(t('Unable to proceed. Please try again'), type, id);
        throw new Error(t('Unable to proceed. Please try again'));
      }

      // Fill signature for some special type
      await this.decorateResult(type, confirmation, result);

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
    }

    return true;
  }

  public resetWallet () {
    const confirmations = this.confirmationsQueueSubject.getValue();

    for (const [type, requests] of Object.entries(confirmations)) {
      for (const confirmation of Object.values(requests)) {
        const { id } = confirmation as ConfirmationRequestBase;
        const { resolver } = this.confirmationsPromiseMap[id];

        if (!resolver || !confirmation) {
          console.error('Not found confirmation', type, id);
        } else {
          resolver.reject(new Error('Reset wallet'));
        }

        delete this.confirmationsPromiseMap[id];
        delete confirmations[type as ConfirmationType][id];
      }
    }

    this.confirmationsQueueSubject.next(confirmations);
  }
}
