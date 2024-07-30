// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { EvmProviderError } from '@subwallet/extension-base/background/errors/EvmProviderError';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType, EvmProviderErrorType, EvmSendTransactionParams, EvmSignatureRequest } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { calculateGasFeeParams } from '@subwallet/extension-base/services/fee-service/utils';
import { AuthUrlInfo } from '@subwallet/extension-base/services/request-service/types';
import { createPromiseHandler, isSameAddress, stripUrl, wait } from '@subwallet/extension-base/utils';
import { isContractAddress, parseContractInput } from '@subwallet/extension-base/utils/eth/parseTransaction';
import { KeyringPair } from '@subwallet/keyring/types';
import { keyring } from '@subwallet/ui-keyring';
import { getSdkError } from '@walletconnect/utils';
import BigN from 'bignumber.js';
import BN from 'bn.js';
import { t } from 'i18next';
import Web3 from 'web3';
import { TransactionConfig } from 'web3-core';

import { assert, isString } from '@polkadot/util';
import { isEthereumAddress } from '@polkadot/util-crypto';

export type ValidateStepFunction = (koni: KoniState, url: string, payload: PayloadValidated, validationMiddlewareSteps: ValidateStepFunction[], topic?: string) => Promise<PayloadValidated>

export interface PayloadValidated {
  networkKey: string,
  address: string,
  pair?: KeyringPair,
  authInfo?: AuthUrlInfo,
  method?: string,
  payloadAfterValidated: any,
  errors: Error[]
}

export async function generateValidationProcess (koni: KoniState, url: string, payloadValidate: PayloadValidated, validationMiddlewareSteps: ValidateStepFunction[], topic?: string): Promise<PayloadValidated> {
  let resultValidated = payloadValidate;

  for (const step of validationMiddlewareSteps) {
    resultValidated = await step(koni, url, resultValidated, validationMiddlewareSteps, topic);
  }

  return resultValidated;
}

export async function validationAuthMiddleware (koni: KoniState, url: string, payload: PayloadValidated, validationMiddlewareSteps: ValidateStepFunction[]): Promise<PayloadValidated> {
  let keypair: KeyringPair | undefined;
  const { address } = payload;

  if (!address || !isString(address)) {
    throw new Error('Not found address to sign');
  } else {
    keypair = keyring.getPair(address);
    assert(keypair, t('Unable to find account'));

    const authList = await koni.getAuthList();

    const authInfo = authList[stripUrl(url)];

    if (!authInfo || !authInfo.isAllowed || !authInfo.isAllowedMap[keypair.address]) {
      throw new Error('Account {{address}} not in allowed list'.replace('{{address}}', address));
    }

    payload.authInfo = authInfo;
    payload.pair = keypair;
  }

  return payload;
}

export async function validationConnectMiddleware (koni: KoniState, url: string, payload: PayloadValidated, validationMiddlewareSteps: ValidateStepFunction[]): Promise<PayloadValidated> {
  let currentChain: string | undefined;
  let autoActiveChain = false;
  let { authInfo, errors, networkKey } = { ...payload };

  if (authInfo?.currentEvmNetworkKey) {
    currentChain = authInfo?.currentEvmNetworkKey;
  }

  if (authInfo?.isAllowed) {
    autoActiveChain = true;
  }

  const currentEvmNetwork = koni.requestService.getDAppChainInfo({
    autoActive: autoActiveChain,
    accessType: 'evm',
    defaultChain: currentChain,
    url
  });

  networkKey = networkKey || currentEvmNetwork?.slug || '';

  if (networkKey) {
    const chainStatus = koni.getChainStateByKey(networkKey);
    const chainInfo = koni.getChainInfo(networkKey);

    if (!chainStatus.active) {
      try {
        await koni.chainService.enableChain(networkKey);
      } catch (e) {
        errors.push(new EvmProviderError(EvmProviderErrorType.CHAIN_DISCONNECTED, ' Can not active chain: ' + chainInfo.name));
      }
    }

    if (chainStatus.active) {
      const evmApi = koni.getEvmApi(networkKey);
      const web3 = evmApi?.api;

      if (web3?.currentProvider instanceof Web3.providers.WebsocketProvider) {
        if (!web3.currentProvider.connected) {
          errors.unshift(new EvmProviderError(EvmProviderErrorType.CHAIN_DISCONNECTED, 'Unable to process this request. Please re-enable the network'));
        }
      } else if (web3?.currentProvider instanceof Web3.providers.HttpProvider) {
        if (!web3.currentProvider.connected) {
          errors.unshift(new EvmProviderError(EvmProviderErrorType.CHAIN_DISCONNECTED, 'Unable to process this request. Please re-enable the network'));
        }
      }
    }
  } else {
    errors.push(new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, 'This network is currently not supported'));
  }

  return {
    ...payload,
    networkKey,
    errors
  };
}

export async function validationEvmDataTransactionMiddleware (koni: KoniState, url: string, payload: PayloadValidated, validationMiddlewareSteps: ValidateStepFunction[]): Promise<PayloadValidated> {
  const errors: Error[] = payload.errors || [];
  let estimateGas = '';
  const transactionParams = payload.payloadAfterValidated as EvmSendTransactionParams;
  const { address: fromAddress, networkKey, pair } = payload;
  const evmApi = koni.getEvmApi(networkKey || '');
  const web3 = evmApi?.api;

  const autoFormatNumber = (val?: string | number): string | undefined => {
    if (typeof val === 'string' && val.startsWith('0x')) {
      return new BN(val.replace('0x', ''), 16).toString();
    } else if (typeof val === 'number') {
      return val.toString();
    }

    return val;
  };

  if (!web3) {
    errors.push(new TransactionError(BasicTxErrorType.CHAIN_DISCONNECTED));
  }

  const transaction: TransactionConfig = {
    from: transactionParams.from,
    to: transactionParams.to,
    value: autoFormatNumber(transactionParams.value),
    gas: autoFormatNumber(transactionParams.gas),
    gasPrice: autoFormatNumber(transactionParams.gasPrice || transactionParams.gasLimit),
    maxPriorityFeePerGas: autoFormatNumber(transactionParams.maxPriorityFeePerGas),
    maxFeePerGas: autoFormatNumber(transactionParams.maxFeePerGas),
    data: transactionParams.data
  };

  if (transaction.from === transaction.to) {
    errors.push(new TransactionError(BasicTxErrorType.INVALID_PARAMS, t('Receiving address must be different from sending address')));
  }

  if (!transaction.to) {
    errors.push(new TransactionError(BasicTxErrorType.INVALID_PARAMS, t('Can\'t find receiving address')));
  }

  // Address is validated in before step

  if (!fromAddress) {
    errors.push(new TransactionError(BasicTxErrorType.INVALID_PARAMS, t('You have rescinded allowance for koni account in wallet')));
  }

  if (!transaction.gas) {
    const getTransactionGas = async () => {
      try {
        transaction.gas = await web3.eth.estimateGas({ ...transaction });
      } catch (e) {
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
        console.error(e);
        errors.push(new TransactionError(BasicTxErrorType.INVALID_PARAMS, handleErrorMessage(e as Error)));
      }
    };

    // Calculate transaction data
    try {
      await Promise.race([
        getTransactionGas(),
        wait(3000).then(async () => {
          if (!transaction.gas) {
            await koni.chainService.initSingleApi(networkKey || '');
            await getTransactionGas();
          }
        })
      ]);
    } catch (e) {
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      console.error(e);
      errors.push(new TransactionError(BasicTxErrorType.INTERNAL_ERROR, handleErrorMessage(e as Error)));
    }
  }

  if (!transaction.gas) {
    errors.push(new TransactionError(BasicTxErrorType.INTERNAL_ERROR));
  } else {
    if (transactionParams.maxPriorityFeePerGas && transactionParams.maxFeePerGas) {
      const maxFee = new BigN(transactionParams.maxFeePerGas);

      estimateGas = maxFee.multipliedBy(transaction.gas).toFixed(0);
    } else if (transactionParams.gasPrice) {
      estimateGas = new BigN(transactionParams.gasPrice).multipliedBy(transaction.gas).toFixed(0);
    } else {
      try {
        const priority = await calculateGasFeeParams(evmApi, networkKey || '');

        if (priority.baseGasFee) {
          transaction.maxPriorityFeePerGas = priority.maxPriorityFeePerGas.toString();
          transaction.maxFeePerGas = priority.maxFeePerGas.toString();

          const maxFee = priority.maxFeePerGas;

          estimateGas = maxFee.multipliedBy(transaction.gas).toFixed(0);
        } else {
          transaction.gasPrice = priority.gasPrice;
          estimateGas = new BigN(priority.gasPrice).multipliedBy(transaction.gas).toFixed(0);
        }
      } catch (e) {
        console.error(e);
        errors.push(new TransactionError(BasicTxErrorType.INTERNAL_ERROR, handleErrorMessage(e as Error)));
      }
    }

    try {
      // Validate balance
      const balance = new BN(await web3.eth.getBalance(fromAddress) || 0);

      if (!estimateGas) {
        errors.push(new TransactionError(BasicTxErrorType.INTERNAL_ERROR, t('Can\'t calculate estimate gas fee')));
      } else if (balance.lt(new BN(estimateGas).add(new BN(autoFormatNumber(transactionParams.value) || '0')))) {
        errors.push(new TransactionError(BasicTxErrorType.NOT_ENOUGH_BALANCE, t('Insufficient balance')));
      }
    } catch (e) {
      console.error(e);
      errors.push(new TransactionError(BasicTxErrorType.INTERNAL_ERROR, handleErrorMessage(e as Error)));
    }
  }

  const pair_ = pair || keyring.getPair(fromAddress);
  const account: AccountJson = { address: fromAddress, ...pair_?.meta };

  try {
    transaction.nonce = await web3.eth.getTransactionCount(fromAddress);
  } catch (e) {
    console.error(e);
    errors.push(new TransactionError(BasicTxErrorType.INTERNAL_ERROR, handleErrorMessage(e as Error)));
  }

  const hasError = (errors && errors.length > 0) || !networkKey;
  const hashPayload = hasError ? '' : koni.transactionService.generateHashPayload(networkKey, transaction);
  const isToContract = !hasError && await isContractAddress(transaction.to || '', evmApi);
  const evmNetwork = koni.getChainInfo(networkKey || '');
  const parseData = isToContract
    ? transaction.data && !hasError
      ? (await parseContractInput(transaction.data, transaction.to || '', evmNetwork)).result
      : ''
    : transaction.data || '';

  return {
    ...payload,
    errors,
    payloadAfterValidated: {
      ...transaction,
      account,
      estimateGas,
      hashPayload,
      isToContract,
      parseData,
      canSign: !hasError
    }
  };
}

export async function validationEvmSignMessageMiddleware (koni: KoniState, url: string, payload_: PayloadValidated, validationMiddlewareSteps: ValidateStepFunction[]): Promise<PayloadValidated> {
  const { address, errors, method, pair: pair_ } = payload_;
  let payload = payload_.payloadAfterValidated as string;
  const { promise, resolve } = createPromiseHandler<PayloadValidated>();
  let hashPayload = '';
  let canSign = false;

  if (address === '' || !payload) {
    errors.push(new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, 'Not found address or payload to sign'));
  }

  const pair = pair_ || keyring.getPair(address);

  const account: AccountJson = { address: pair.address, ...pair.meta };

  if (method) {
    if (['eth_sign', 'personal_sign', 'eth_signTypedData', 'eth_signTypedData_v1', 'eth_signTypedData_v3', 'eth_signTypedData_v4'].indexOf(method) < 0) {
      errors.push(new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, 'Unsupported action'));
    }

    if (['eth_signTypedData_v3', 'eth_signTypedData_v4'].indexOf(method) > -1) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-assignment
      payload = JSON.parse(payload);
    }

    switch (method) {
      case 'personal_sign':
        canSign = true;
        hashPayload = payload;
        break;
      case 'eth_sign':
      case 'eth_signTypedData':
      case 'eth_signTypedData_v1':
      case 'eth_signTypedData_v3':
      case 'eth_signTypedData_v4':
        if (!account.isExternal) {
          canSign = true;
        }

        break;
      default:
        errors.push(new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, 'Unsupported action'));
    }
  } else {
    errors.push(new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, 'Unsupported method'));
  }

  const payloadAfterValidated: EvmSignatureRequest = {
    account: account,
    type: method || '',
    payload: payload as unknown,
    hashPayload: hashPayload,
    canSign: canSign,
    id: ''
  };

  resolve(
    {
      ...payload_,
      errors,
      payloadAfterValidated
    }
  );

  return promise;
}

export function validationAuthWCMiddleware (koni: KoniState, url: string, payload: PayloadValidated, validationMiddlewareSteps: ValidateStepFunction[], topic?: string): Promise<PayloadValidated> {
  if (!topic) {
    throw new Error(getSdkError('UNAUTHORIZED_EXTEND_REQUEST').message);
  }

  const { promise, reject, resolve } = createPromiseHandler<PayloadValidated>();
  const { address } = payload;
  const requestSession = koni.walletConnectService.getSession(topic);
  let sessionAccounts: string[] = [];

  if (isEthereumAddress(address)) {
    sessionAccounts = requestSession.namespaces.eip155.accounts?.map((account) => account.split(':')[2]) || sessionAccounts;
  } else {
    sessionAccounts = requestSession.namespaces.polkadot.accounts?.map((account) => account.split(':')[2]) || sessionAccounts;
  }

  let keypair: KeyringPair | undefined;

  if (!address || !isString(address)) {
    reject(new Error(getSdkError('UNSUPPORTED_ACCOUNTS').message + ' ' + address));
  } else {
    keypair = keyring.getPair(address);
    assert(keypair, t('Unable to find account'));

    const isExitsAccount = sessionAccounts.find((account) => isSameAddress(account, address));

    if (!isExitsAccount) {
      reject(new Error(getSdkError('UNSUPPORTED_ACCOUNTS').message + ' ' + address));
    }

    resolve(payload);
  }

  return promise;
}

export function handleErrorMessage (err: Error) {
  const message = err.message.toLowerCase();

  if (
    message.includes('connection error') ||
    message.includes('connection not open') ||
    message.includes('connection timeout')
  ) {
    return 'Unable to process this request. Please re-enable the network';
  }

  return err.message;
}
