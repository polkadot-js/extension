// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { EvmProviderError } from '@subwallet/extension-base/background/errors/EvmProviderError';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType, ConfirmationType, EvmProviderErrorType, EvmSendTransactionParams, EvmSignatureRequest, EvmTransactionData } from '@subwallet/extension-base/background/KoniTypes';
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
import { TransactionConfig } from 'web3-core';

import { isString } from '@polkadot/util';
import { isEthereumAddress } from '@polkadot/util-crypto';

export type ValidateStepFunction = (koni: KoniState, url: string, payload: PayloadValidated, topic?: string) => Promise<PayloadValidated>

export interface PayloadValidated {
  networkKey: string,
  address: string,
  pair?: KeyringPair,
  authInfo?: AuthUrlInfo,
  method?: string,
  payloadAfterValidated: any,
  errorPosition?: 'dApp' | 'ui',
  confirmationType?: ConfirmationType,
  errors: Error[]
}

export async function generateValidationProcess (koni: KoniState, url: string, payloadValidate: PayloadValidated, validationMiddlewareSteps: ValidateStepFunction[], topic?: string): Promise<PayloadValidated> {
  let resultValidated = payloadValidate;

  for (const step of validationMiddlewareSteps) {
    resultValidated = await step(koni, url, resultValidated, topic);

    if (resultValidated.errorPosition === 'dApp') {
      throw resultValidated.errors[0];
    } else if (resultValidated.errorPosition === 'ui') {
      break;
    }
  }

  return resultValidated;
}

export async function validationAuthMiddleware (koni: KoniState, url: string, payload: PayloadValidated): Promise<PayloadValidated> {
  const { address, errors } = payload;

  if (!address || !isString(address)) {
    payload.errorPosition = 'dApp';
    errors.push(new Error('Not found address to sign'));
  } else {
    payload.pair = keyring.getPair(address);

    if (!payload.pair) {
      payload.errorPosition = 'dApp';
      errors.push(new Error('Unable to find account'));
    } else {
      const authList = await koni.getAuthList();

      const authInfo = authList[stripUrl(url)];

      if (!authInfo || !authInfo.isAllowed || !authInfo.isAllowedMap[payload.pair.address]) {
        payload.errorPosition = 'dApp';
        errors.push(new Error('Account {{address}} not in allowed list'.replace('{{address}}', address)));
      }

      payload.authInfo = authInfo;
    }
  }

  return payload;
}

export async function validationConnectMiddleware (koni: KoniState, url: string, payload: PayloadValidated): Promise<PayloadValidated> {
  let currentChain: string | undefined;
  let autoActiveChain = false;
  let { address, authInfo, errors, networkKey } = { ...payload };

  const handleError = (message: string) => {
    payload.errorPosition = 'ui';
    payload.confirmationType = 'errorConnectNetwork';
    errors.push(new EvmProviderError(EvmProviderErrorType.CHAIN_DISCONNECTED, message));
  };

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
        handleError(' Can not active chain: ' + chainInfo.name);
      }
    }

    const evmApi = koni.getEvmApi(networkKey);
    const web3 = evmApi?.api;
    let currentProviderConnected = false;

    const checkProviderConnected = async () => {
      try {
        currentProviderConnected = !!await web3.eth.getBalance(address);
      } catch (e) {
        handleError(convertErrorMessage(e as Error));
      }
    };

    // Calculate transaction data
    try {
      await Promise.race([
        checkProviderConnected(),
        wait(3000).then(async () => {
          if (!currentProviderConnected) {
            await koni.chainService.initSingleApi(networkKey);
            await checkProviderConnected();
          }
        })
      ]);
    } catch (e) {
      handleError(convertErrorMessage(e as Error));
    }
  } else {
    handleError('This network is currently not supported');
  }

  return {
    ...payload,
    networkKey,
    errors
  };
}

export async function validationEvmDataTransactionMiddleware (koni: KoniState, url: string, payload: PayloadValidated): Promise<PayloadValidated> {
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

  const handleError = (e: TransactionError) => {
    payload.errorPosition = 'ui';
    payload.confirmationType = 'evmWatchTransactionRequest';
    errors.push(e);
  };

  if (!web3) {
    handleError(new TransactionError(BasicTxErrorType.CHAIN_DISCONNECTED));
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
    handleError(new TransactionError(BasicTxErrorType.INVALID_PARAMS, t('Receiving address must be different from sending address')));
  }

  if (transaction.to && !isEthereumAddress(transaction.to)) {
    handleError(new TransactionError(BasicTxErrorType.INVALID_PARAMS, t('The receiving address is not a valid Ethereum address')));
  }

  // Address is validated in before step

  if (!fromAddress) {
    handleError(new TransactionError(BasicTxErrorType.INVALID_PARAMS, t('You have rescinded allowance for koni account in wallet')));
  }

  if (!transaction.gas) {
    const getTransactionGas = async () => {
      try {
        transaction.gas = await web3.eth.estimateGas({ ...transaction });
      } catch (e) {
        console.error(e);
        handleError(new TransactionError(BasicTxErrorType.INTERNAL_ERROR, (e as Error).message));
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
      console.error(e);
      handleError(new TransactionError(BasicTxErrorType.INTERNAL_ERROR, (e as Error).message));
    }
  }

  if (!transaction.gas) {
    handleError(new TransactionError(BasicTxErrorType.INTERNAL_ERROR));
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
        handleError(new TransactionError(BasicTxErrorType.INTERNAL_ERROR, (e as Error).message));
      }
    }

    try {
      // Validate balance
      const balance = new BN(await web3.eth.getBalance(fromAddress) || 0);

      if (!estimateGas) {
        handleError(new TransactionError(BasicTxErrorType.INTERNAL_ERROR, t('Can\'t calculate estimate gas fee')));
      } else if (balance.lt(new BN(estimateGas).add(new BN(autoFormatNumber(transactionParams.value) || '0')))) {
        handleError(new TransactionError(BasicTxErrorType.NOT_ENOUGH_BALANCE, t('Insufficient balance')));
      }
    } catch (e) {
      console.error(e);
      handleError(new TransactionError(BasicTxErrorType.INTERNAL_ERROR, (e as Error).message));
    }
  }

  const pair_ = pair || keyring.getPair(fromAddress);
  const account: AccountJson = { address: fromAddress, ...pair_?.meta };

  try {
    transaction.nonce = await web3.eth.getTransactionCount(fromAddress);
  } catch (e) {
    console.error(e);
    handleError(new TransactionError(BasicTxErrorType.INTERNAL_ERROR, (e as Error).message));
  }

  const hasError = (errors && errors.length > 0) || !networkKey;
  const hashPayload = hasError ? '' : koni.transactionService.generateHashPayload(networkKey, transaction);
  const evmNetwork = koni.getChainInfo(networkKey || '');
  let isToContract = false;
  let parseData: EvmTransactionData = '';

  try {
    isToContract = await isContractAddress(transaction.to || '', evmApi);
    parseData = isToContract
      ? transaction.data && !hasError
        ? (await parseContractInput(transaction.data, transaction.to || '', evmNetwork)).result
        : ''
      : transaction.data || '';
  } catch (e) {
    console.error(e);
    handleError(new TransactionError(BasicTxErrorType.INTERNAL_ERROR, (e as Error).message));
  }

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

export async function validationEvmSignMessageMiddleware (koni: KoniState, url: string, payload_: PayloadValidated): Promise<PayloadValidated> {
  const { address, errors, method, pair: pair_ } = payload_;
  let payload = payload_.payloadAfterValidated as string;
  const { promise, resolve } = createPromiseHandler<PayloadValidated>();
  let hashPayload = '';
  let canSign = false;

  const handleError = (e: EvmProviderError) => {
    payload_.errorPosition = 'ui';
    payload_.confirmationType = 'evmSignatureRequest';
    errors.push(e);
  };

  if (address === '' || !payload) {
    handleError(new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, 'Not found address or payload to sign'));
  }

  const pair = pair_ || keyring.getPair(address);

  const account: AccountJson = { address: pair.address, ...pair.meta };

  if (method) {
    if (['eth_sign', 'personal_sign', 'eth_signTypedData', 'eth_signTypedData_v1', 'eth_signTypedData_v3', 'eth_signTypedData_v4'].indexOf(method) < 0) {
      handleError(new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, 'Unsupported action'));
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
        handleError(new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, 'Unsupported action'));
    }
  } else {
    handleError(new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, 'Unsupported method'));
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

export function validationAuthWCMiddleware (koni: KoniState, url: string, payload: PayloadValidated, topic?: string): Promise<PayloadValidated> {
  const { promise, resolve } = createPromiseHandler<PayloadValidated>();
  const { address, errors } = payload;

  if (!topic) {
    payload.errorPosition = 'dApp';
    errors.push(new Error(getSdkError('UNAUTHORIZED_EXTEND_REQUEST').message));
  } else {
    const requestSession = koni.walletConnectService.getSession(topic);

    let sessionAccounts: string[] = [];

    if (isEthereumAddress(address)) {
      sessionAccounts = requestSession.namespaces.eip155.accounts?.map((account) => account.split(':')[2]) || sessionAccounts;
    } else {
      sessionAccounts = requestSession.namespaces.polkadot.accounts?.map((account) => account.split(':')[2]) || sessionAccounts;
    }

    if (!address || !isString(address)) {
      payload.errorPosition = 'dApp';
      errors.push(new Error(getSdkError('UNSUPPORTED_ACCOUNTS').message + ' ' + address));
    } else {
      payload.pair = keyring.getPair(address);

      if (!payload.pair) {
        payload.errorPosition = 'dApp';
        errors.push(new Error('Unable to find account'));
      }

      const isExitsAccount = sessionAccounts.find((account) => isSameAddress(account, address));

      if (!isExitsAccount) {
        payload.errorPosition = 'dApp';
        errors.push(new Error(getSdkError('UNSUPPORTED_ACCOUNTS').message + ' ' + address));
      }
    }
  }

  resolve({ ...payload, errors });

  return promise;
}

export function convertErrorMessage (err: Error): string {
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
