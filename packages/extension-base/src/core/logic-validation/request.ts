// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { TypedDataV1Field, typedSignatureHash } from '@metamask/eth-sig-util';
import { EvmProviderError } from '@subwallet/extension-base/background/errors/EvmProviderError';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType, ConfirmationType, ErrorValidation, EvmProviderErrorType, EvmSendTransactionParams, EvmSignatureRequest, EvmTransactionData } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import KoniState from '@subwallet/extension-base/koni/background/handlers/State';
import { calculateGasFeeParams } from '@subwallet/extension-base/services/fee-service/utils';
import { AuthUrlInfo } from '@subwallet/extension-base/services/request-service/types';
import { BN_ZERO, createPromiseHandler, isSameAddress, stripUrl, wait } from '@subwallet/extension-base/utils';
import { isContractAddress, parseContractInput } from '@subwallet/extension-base/utils/eth/parseTransaction';
import { KeyringPair } from '@subwallet/keyring/types';
import { keyring } from '@subwallet/ui-keyring';
import { getSdkError } from '@walletconnect/utils';
import BigN from 'bignumber.js';
import BN from 'bn.js';
import { t } from 'i18next';
import Joi from 'joi';
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

export type SignTypedDataMessageV3V4 = {
  types: Record<string, unknown>;
  domain: Record<string, unknown>;
  primaryType: string;
  message: unknown;
};

export type DataMessageParam = Record<string, unknown>[] | string | SignTypedDataMessageV3V4

export interface TypedMessageParams {
  from: string;
  data: DataMessageParam;
}

export interface PersonalMessageParams {
  data: string;
  from: string;
}

export const joiValidate = Joi.object({
  types: Joi.object()
    .pattern(
      Joi.string(), // Key của object types
      Joi.array().items(
        Joi.object({
          name: Joi.string().required(),
          type: Joi.string().required()
        })
      )
    )
    .required(),
  primaryType: Joi.string().required(),
  domain: Joi.object().required(),
  message: Joi.object().required()
});

function validateAddress (address: string, propertyName: string) {
  if (!address || typeof address !== 'string' || !isEthereumAddress(address)) {
    throw new Error(
      `Invalid "${propertyName}" address: ${address} must be a valid string.`
    );
  }
}

export function validateSignMessageData (messageData: PersonalMessageParams) {
  const { data, from } = messageData;

  validateAddress(from, 'from');

  if (!data || typeof data !== 'string') {
    throw new Error(`Invalid message "data": ${data} must be a valid string.`);
  }

  return data;
}

export function validateTypedSignMessageDataV1 (messageData: TypedMessageParams) {
  validateAddress(messageData.from, 'from');

  if (!messageData.data || !Array.isArray(messageData.data)) {
    throw new Error(
      // TODO: Either fix this lint violation or explain why it's necessary to ignore.
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      `Invalid message "data": ${messageData.data} must be a valid array.`
    );
  }

  try {
    // typedSignatureHash will throw if the data is invalid.
    // TODO: Replace `any` with type
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    typedSignatureHash(messageData.data as TypedDataV1Field[]);

    return messageData.data;
  } catch (e) {
    throw new Error('Invalid message "data": Expected EIP712 typed data.');
  }
}

export function validateTypedSignMessageDataV3V4 (
  messageData: TypedMessageParams
) {
  validateAddress(messageData.from, 'from');

  if (
    !messageData.data ||
    Array.isArray(messageData.data) ||
    (typeof messageData.data !== 'object' &&
      typeof messageData.data !== 'string')
  ) {
    throw new Error(
      'Invalid message "data": Must be a valid string or object.'
    );
  }

  let data;

  if (typeof messageData.data === 'object') {
    data = messageData.data;
  } else {
    try {
      data = JSON.parse(messageData.data) as SignTypedDataMessageV3V4;
    } catch (e) {
      throw new Error('Invalid message "data" must be passed as a valid JSON string.');
    }
  }

  const validation = joiValidate.validate(data);

  if (validation.error) {
    throw new Error(
      'Invalid message "data" must conform to EIP-712 schema. See https://git.io/fNtcx.'
    );
  }

  // if (!currentChainId) {
  //   throw new Error('Current chainId cannot be null or undefined.');
  // }

  // let { chainId } = data.domain;
  //
  // if (chainId) {
  //   if (typeof chainId === 'string') {
  //     chainId = parseInt(chainId, chainId.startsWith('0x') ? 16 : 10);
  //   }
  //
  //   const activeChainId = parseInt(currentChainId, 16);
  //
  //   if (Number.isNaN(activeChainId)) {
  //     throw new Error(
  //       // TODO: Either fix this lint violation or explain why it's necessary to ignore.
  //       // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  //       `Cannot sign messages for chainId "${chainId}", because MetaMask is switching networks.`
  //     );
  //   }
  //
  //   if (chainId !== activeChainId) {
  //     throw new Error(
  //       // TODO: Either fix this lint violation or explain why it's necessary to ignore.
  //       // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
  //       `Provided chainId "${chainId}" must match the active chainId "${activeChainId}"`
  //     );
  //   }
  // }
  return data;
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
    const [message] = convertErrorMessage('Not found address to sign');

    errors.push(new Error(message));
  } else {
    try {
      payload.pair = keyring.getPair(address);

      if (!payload.pair) {
        payload.errorPosition = 'dApp';
        const [message] = convertErrorMessage('Unable to find account');

        errors.push(new Error(message));
      } else {
        const authList = await koni.getAuthList();

        const authInfo = authList[stripUrl(url)];

        if (!authInfo || !authInfo.isAllowed || !authInfo.isAllowedMap[payload.pair.address]) {
          payload.errorPosition = 'dApp';
          const [message] = convertErrorMessage('Account not in allowed list', '');

          errors.push(new Error(message));
        }

        payload.authInfo = authInfo;
      }
    } catch (e) {
      const [message] = convertErrorMessage((e as Error).message);

      payload.errorPosition = 'dApp';
      errors.push(new Error(message));
    }
  }

  return payload;
}

export async function validationConnectMiddleware (koni: KoniState, url: string, payload: PayloadValidated): Promise<PayloadValidated> {
  let currentChain: string | undefined;
  let autoActiveChain = false;
  let { address, authInfo, errors, networkKey } = { ...payload };

  const handleError = (message_: string) => {
    payload.errorPosition = 'ui';
    payload.confirmationType = 'errorConnectNetwork';
    const [message, name] = convertErrorMessage(message_);
    const error = new EvmProviderError(EvmProviderErrorType.CHAIN_DISCONNECTED, message, undefined, name);

    console.error(error);
    errors.push(error);
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
        handleError('Can not active chain: ' + chainInfo.name);
      }
    }

    const evmApi = koni.getEvmApi(networkKey);
    const web3 = evmApi?.api;
    let currentProviderConnected = false;

    const checkProviderConnected = async () => {
      try {
        currentProviderConnected = !!await web3.eth.getBalance(address);
      } catch (e) {
        handleError((e as Error).message);
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
      handleError((e as Error).message);
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

  const handleError = (message_: string) => {
    payload.errorPosition = 'ui';
    payload.confirmationType = 'evmWatchTransactionRequest';
    const [message, name] = convertErrorMessage(message_);
    const error = new TransactionError(BasicTxErrorType.INVALID_PARAMS, message, undefined, name);

    console.error(error);
    errors.push(error);
  };

  if (!web3) {
    handleError('connection error');
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

  // Address is validated in before step
  if (!fromAddress || !isEthereumAddress(fromAddress)) {
    handleError('the sender address must be the ethereum address type');
  }

  if (transaction.to && !isEthereumAddress(transaction.to)) {
    handleError('invalid recipient address');
  }

  if (fromAddress === transaction.to) {
    handleError('receiving address must be different from sending address');
  }

  if (!transaction.to) {
    if (transaction.data) {
      if (transaction.value) {
        try {
          const valueBn = new BigN(transaction.value.toString());

          if (!valueBn.eq(BN_ZERO)) {
            handleError('Recipient address not found');
          }
        } catch (e) {
          handleError('invalid number');
        }
      }
    } else {
      handleError('Recipient address not found');
    }
  }

  if (!transaction.gas) {
    const getTransactionGas = async () => {
      try {
        transaction.gas = await web3.eth.estimateGas({ ...transaction });
      } catch (e) {
        handleError((e as Error).message);
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
      handleError((e as Error).message);
    }
  }

  if (!transaction.gas) {
    handleError(new TransactionError(BasicTxErrorType.INTERNAL_ERROR).message);
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
        handleError((e as Error).message);
      }
    }

    try {
      // Validate balance
      const balance = new BN(await web3.eth.getBalance(fromAddress) || 0);

      if (!estimateGas) {
        handleError('Can\'t calculate estimate gas fee');
      } else if (balance.lt(new BN(estimateGas).add(new BN(autoFormatNumber(transactionParams.value) || '0')))) {
        handleError('Insufficient balance');
      }
    } catch (e) {
      handleError((e as Error).message);
    }
  }

  const pair_ = pair || keyring.getPair(fromAddress);
  const account: AccountJson = { address: fromAddress, ...pair_?.meta };

  try {
    transaction.nonce = await web3.eth.getTransactionCount(fromAddress);
  } catch (e) {
    handleError((e as Error).message);
  }

  const hasError = (errors && errors.length > 0) || !networkKey;
  const evmNetwork = koni.getChainInfo(networkKey || '');
  let isToContract = false;
  let hashPayload = '';
  let parseData: EvmTransactionData = '';

  try {
    hashPayload = hasError ? '' : koni.transactionService.generateHashPayload(networkKey, transaction);
    isToContract = await isContractAddress(transaction.to || '', evmApi);
    parseData = isToContract
      ? transaction.data && !hasError
        ? (await parseContractInput(transaction.data, transaction.to || '', evmNetwork)).result
        : ''
      : transaction.data || '';
  } catch (e) {
    handleError((e as Error).message);
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
  let payload = payload_.payloadAfterValidated as DataMessageParam;
  const { promise, resolve } = createPromiseHandler<PayloadValidated>();
  let hashPayload = '';
  let canSign = false;

  const handleError = (message_: string) => {
    payload_.errorPosition = 'ui';
    payload_.confirmationType = 'evmSignatureRequest';
    const [message, name] = convertErrorMessage(message_);
    const error = new EvmProviderError(EvmProviderErrorType.INVALID_PARAMS, message, undefined, name);

    console.error(error);
    errors.push(error);
  };

  if (address === '' || !payload) {
    handleError('Not found address or payload to sign');
  }

  const pair = pair_ || keyring.getPair(address);

  const account: AccountJson = { address: pair.address, ...pair.meta };

  if (method) {
    if (['eth_sign', 'personal_sign', 'eth_signTypedData', 'eth_signTypedData_v1', 'eth_signTypedData_v3', 'eth_signTypedData_v4'].indexOf(method) < 0) {
      handleError('Unsupported action');
    }

    try {
      switch (method) {
        case 'personal_sign':
          canSign = true;
          payload = validateSignMessageData({ data: payload as string, from: address });
          hashPayload = payload;
          break;
        case 'eth_sign':
          if (!account.isExternal) {
            canSign = true;
          }

          break;
        case 'eth_signTypedData':
        case 'eth_signTypedData_v1':
          if (!account.isExternal) {
            canSign = true;
          }

          payload = validateTypedSignMessageDataV1({ data: payload as Record<string, unknown>[], from: address });

          break;

        case 'eth_signTypedData_v3':
        case 'eth_signTypedData_v4':
          if (!account.isExternal) {
            canSign = true;
          }

          payload = validateTypedSignMessageDataV3V4({ data: payload as SignTypedDataMessageV3V4, from: address });

          break;
        default:
          throw new Error('Unsupported action');
      }
    } catch (e) {
      console.error(e);
      handleError((e as Error).message);
    }
  } else {
    handleError('Unsupported method');
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
      const [message] = convertErrorMessage('Unable to find account');

      errors.push(new Error(message));
    } else {
      try {
        payload.pair = keyring.getPair(address);

        if (!payload.pair) {
          payload.errorPosition = 'dApp';
          const [message] = convertErrorMessage('Unable to find account');

          errors.push(new Error(message));
        }

        const isExitsAccount = sessionAccounts.find((account) => isSameAddress(account, address));

        if (!isExitsAccount) {
          payload.errorPosition = 'dApp';
          const [message] = convertErrorMessage('Account not in allowed list');

          errors.push(new Error(message));
        }
      } catch (e) {
        const [message] = convertErrorMessage((e as Error).message);

        payload.errorPosition = 'dApp';
        errors.push(new Error(message));
      }
    }
  }

  resolve({ ...payload, errors });

  return promise;
}

export function convertErrorMessage (message_: string, name?: string): string[] {
  const message = message_.toLowerCase();

  // Network error
  if (
    message.includes('connection error') ||
    message.includes('connection not open') ||
    message.includes('connection timeout') ||
    message.includes('can not active chain') ||
    message.includes('invalid json rpc')
  ) {
    return [t('Re-enable the network or change RPC on the extension and try again'), t('Unstable network connection')];
  }

  if (message.includes('network is currently not supported')) {
    return [t('This network is not yet supported on SubWallet. (Import the network)[https://docs.subwallet.app/main/extension-user-guide/customize-your-networks#import-networks] on SubWallet and try again'), t('Network not supported')];
  }

  // Authentication
  if (message.includes('not found address to sign') ||
    message.includes('unable to find account') || message.includes('unable to retrieve keypair')) {
    return ['Address not found on SubWallet. Re-check the address information in the extension then try again'];
  }

  if (message.includes('account not in allowed list')) {
    return ['Account disconnected from the dApp. Open the extension to re-connect the account and try again'];
  }

  // Transaction

  if (message.includes('recipient address not found')) {
    return [t('Enter recipient address and try again'), t('Recipient address not found')];
  }

  if (message.includes('is not a number') || message.includes('invalid number value') || message.includes('invalid bignumberish')) {
    return [t('Amount must be an integer. Enter an integer and try again'), t('Invalid amount')];
  }

  if (message.includes('calculate estimate gas fee') || message.includes('invalidcode')) {
    return [t('Unable to calculate estimated gas for this transaction. Try again or contact support at agent@subwallet.app'), t('Gas calculation error')];
  }

  if (message.includes('invalid recipient address')) {
    return [t('Make sure the recipient address is valid and in the same type as the sender address, then try again'), t('Invalid recipient address')];
  }

  if (message.includes('must be different from sending address')) {
    return [t('The recipient address must be different from the sender address'), t('Invalid recipient address')];
  }

  if (message.includes('the sender address must be the ethereum address type')) {
    return [t('The sender address must be the ethereum address type'), t('Invalid address type')];
  }

  if (message.includes('insufficient balance') || message.includes('insufficient funds')) {
    return [t('Insufficient balance on the sender address. Top up your balance and try again'), t('Unable to sign transaction')];
  }

  // Sign Message
  if (message.includes('not found address or payload to sign')) {
    return [t('An error occurred when signing this request. Try again or contact support at agent@subwallet.app'), t('Unable to sign')];
  }

  if (message.includes('unsupported method') || message.includes('unsupported action')) {
    return [t('This sign method is not supported by SubWallet. Try again or contact support at agent@subwallet.app'), t('Method not supported')];
  }

  if (message.includes('eip712 typed data') || message.includes('invalid message')) {
    return [t('An error occurred when attempting to sign this request. Contact support at email: agent@subwallet.app'), t('Unable to sign')];
  }

  return [message, name || 'Error'];
}

export function convertErrorFormat (errors: Error[]): ErrorValidation[] {
  if (errors.length > 0) {
    return [{ name: errors[0].name, message: errors[0].message }];
  }

  return [];
}
