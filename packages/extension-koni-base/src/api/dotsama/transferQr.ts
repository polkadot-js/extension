// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { assetFromToken } from '@equilab/api';
import { ApiProps, NetworkJson, QRRequestPromise, QRRequestPromiseStatus, ResponseNftTransferQr, ResponseTransfer, ResponseTransferQr, TokenInfo, TransferErrorCode, TransferStep } from '@subwallet/extension-base/background/KoniTypes';
import QrSigner from '@subwallet/extension-base/signers/substrates/QrSigner';
import { QrState } from '@subwallet/extension-base/signers/types';
import { getCrossChainTransferDest, isNetworksPairSupportedTransferCrossChain } from '@subwallet/extension-koni-base/api/dotsama/transfer';
import { getNftTransferExtrinsic } from '@subwallet/extension-koni-base/api/nft/transfer';

import { ApiPromise } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import { KeyringPair } from '@polkadot/keyring/types';
import { EventRecord } from '@polkadot/types/interfaces';
import { AnyNumber } from '@polkadot/types/types';
import { BN } from '@polkadot/util';

// TODO: consider pass state.getApiMap() as a param

function getUnsupportedResponse (): ResponseTransferQr {
  return {
    step: TransferStep.ERROR,
    errors: [
      {
        code: TransferErrorCode.UNSUPPORTED,
        message: 'The transaction of current network is unsupported'
      }
    ],
    extrinsicStatus: undefined,
    data: {}
  };
}

function updateResponseTxResult (
  networkKey: string,
  tokenInfo: undefined | TokenInfo,
  response: ResponseTransfer,
  records: EventRecord[]): void {
  if (!response.txResult) {
    response.txResult = { change: '0' };
  }

  let isFeeUseMainTokenSymbol = true;

  for (let index = 0; index < records.length; index++) {
    const record = records[index];

    if (['karura', 'acala', 'acala_testnet'].includes(networkKey) && tokenInfo && !tokenInfo.isMainToken) {
      if (record.event.section === 'currencies' &&
        record.event.method.toLowerCase() === 'transferred') {
        if (index === 0) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          response.txResult.fee = record.event.data[3]?.toString() || '0';
          response.txResult.feeSymbol = tokenInfo.symbol;

          isFeeUseMainTokenSymbol = false;
        } else {
          response.txResult.change = record.event.data[3]?.toString() || '0';
          response.txResult.changeSymbol = tokenInfo.symbol;
        }
      }
    } else if (['kintsugi', 'kintsugi_test', 'interlay'].includes(networkKey) && tokenInfo) {
      if (record.event.section === 'tokens' &&
        record.event.method.toLowerCase() === 'transfer') {
        response.txResult.change = record.event.data[3]?.toString() || '0';
        response.txResult.changeSymbol = tokenInfo.symbol;
      }
    } else if (['genshiro_testnet', 'genshiro', 'equilibrium_parachain'].includes(networkKey) && tokenInfo) {
      if (record.event.section === 'eqBalances' &&
        record.event.method.toLowerCase() === 'transfer') {
        response.txResult.change = record.event.data[3]?.toString() || '0';
        response.txResult.changeSymbol = tokenInfo.symbol;
      }
    } else {
      if ((record.event.section === 'balances' &&
        record.event.method.toLowerCase() === 'transfer')) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        response.txResult.change = record.event.data[2]?.toString() || '0';
      }
    }

    if (isFeeUseMainTokenSymbol && record.event.section === 'balances' &&
      record.event.method.toLowerCase() === 'withdraw') {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      response.txResult.fee = record.event.data[1]?.toString() || '0';
    }
  }
}

const doSignAndSend = async (
  api: ApiPromise,
  networkKey: string,
  tokenInfo: TokenInfo | undefined,
  nonce: AnyNumber,
  transfer: SubmittableExtrinsic,
  fromKeypair: KeyringPair,
  qrId: string,
  setState: (promise: QRRequestPromise) => void,
  updateState: (promise: Partial<QRRequestPromise>) => void,
  callback: (data: ResponseTransferQr) => void
): Promise<void> => {
  const response: ResponseTransferQr = {
    step: TransferStep.READY,
    errors: [],
    extrinsicStatus: undefined,
    data: {}
  };
  const fromAddress = fromKeypair.address;

  function updateResponseByEvents (response: ResponseTransfer, records: EventRecord[]) {
    records.forEach((record) => {
      const { event: { method, section, data: [error] } } = record;

      // @ts-ignore
      const isFailed = section === 'system' && method === 'ExtrinsicFailed';
      // @ts-ignore
      const isSuccess = section === 'system' && method === 'ExtrinsicSuccess';

      console.log('Transaction final: ', isFailed, isSuccess);

      if (isFailed) {
        response.step = TransferStep.ERROR;

        // @ts-ignore
        if (error.isModule) {
          // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          const decoded = api.registry.findMetaError(error.asModule);
          const { docs, method, section } = decoded;

          const errorMessage = docs.join(' ');

          console.log(`${section}.${method}: ${errorMessage}`);
          response.data = {
            section,
            method,
            message: errorMessage
          };
          response.errors?.push({
            code: TransferErrorCode.TRANSFER_ERROR,
            message: errorMessage
          });
        } else {
          // Other, CannotLookup, BadOrigin, no extra info
          console.log(error.toString());
          response.errors?.push({
            code: TransferErrorCode.TRANSFER_ERROR,
            message: error.toString()
          });
        }
      } else if (isSuccess) {
        response.step = TransferStep.SUCCESS;
      }
    });

    updateResponseTxResult(networkKey, tokenInfo, response, records);
  }

  const qrCallback = ({ qrState }: {qrState: QrState}) => {
    // eslint-disable-next-line node/no-callback-literal
    callback({
      step: TransferStep.READY,
      errors: [],
      extrinsicStatus: undefined,
      data: {},
      qrState: qrState
    });
  };

  await transfer.signAsync(fromAddress, { nonce, signer: new QrSigner(api.registry, qrCallback, qrId, setState) });

  await transfer.send(({ events, status }) => {
    console.log('Transaction status:', status.type, status.hash.toHex());
    response.extrinsicStatus = status.type;

    if (status.isBroadcast) {
      response.step = TransferStep.START;
      response.isBusy = true;
    }

    if (status.isInBlock) {
      const blockHash = status.asInBlock.toHex();

      response.step = TransferStep.PROCESSING;
      response.data = {
        block: blockHash,
        status: status.type
      };
      callback(response);

      updateResponseByEvents(response, events);
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
      response.extrinsicHash = transfer.hash.toHex();
      callback(response);

      if (response.step === TransferStep.SUCCESS.valueOf()) {
        updateState({ status: QRRequestPromiseStatus.COMPLETED });
      } else if (response.step === TransferStep.ERROR.valueOf()) {
        updateState({ status: QRRequestPromiseStatus.FAILED });
      }
    } else if (status.isFinalized) {
      const blockHash = status.asFinalized.toHex();

      response.isFinalized = true;

      response.data = {
        block: blockHash,
        status: status.type
      };

      callback(response);
    } else {
      callback(response);
    }
  });
};

export async function makeTransferQr (
  networkKey: string,
  to: string,
  fromKeypair: KeyringPair,
  value: string,
  transferAll: boolean,
  dotSamaApiMap: Record<string, ApiProps>,
  tokenInfo: undefined | TokenInfo,
  qrId: string,
  setState: (promise: QRRequestPromise) => void,
  updateState: (promise: Partial<QRRequestPromise>) => void,
  callback: (data: ResponseTransferQr) => void
): Promise<void> {
  const apiProps = await dotSamaApiMap[networkKey].isReady;
  const api = apiProps.api;
  const fromAddress = fromKeypair.address;
  let nonce: AnyNumber;

  if (['genshiro_testnet', 'genshiro', 'equilibrium_parachain'].includes(networkKey)) {
    nonce = -1;
  } else {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    nonce = await api.query.system.account(fromAddress).nonce;
  }

  // @ts-ignore
  let transfer;
  const isTxCurrenciesSupported = !!api && !!api.tx && !!api.tx.currencies;
  const isTxBalancesSupported = !!api && !!api.tx && !!api.tx.balances;
  const isTxTokensSupported = !!api && !!api.tx && !!api.tx.tokens;
  const isTxEqBalancesSupported = !!api && !!api.tx && !!api.tx.eqBalances;

  if (['karura', 'acala', 'acala_testnet'].includes(networkKey) && tokenInfo && !tokenInfo.isMainToken && isTxCurrenciesSupported) {
    if (transferAll) {
      // currently Acala, Karura, Acala testnet do not have transfer all method for sub token
    } else if (value) {
      transfer = api.tx.currencies
        .transfer(to, tokenInfo.specialOption || { Token: tokenInfo.symbol }, value);
    }
  } else if (['kintsugi', 'kintsugi_test', 'interlay'].includes(networkKey) && tokenInfo && isTxTokensSupported) {
    if (transferAll) {
      transfer = api.tx.tokens
        .transferAll(to, tokenInfo.specialOption || { Token: tokenInfo.symbol }, false);
    } else if (value) {
      transfer = api.tx.tokens
        .transferKeepAlive(to, tokenInfo.specialOption || { Token: tokenInfo.symbol }, new BN(value));
    }
  } else if (['genshiro_testnet', 'genshiro', 'equilibrium_parachain'].includes(networkKey) && tokenInfo && isTxEqBalancesSupported) {
    if (transferAll) {
      // currently genshiro_testnet, genshiro, equilibrium_parachain do not have transfer all method for tokens
    } else if (value) {
      const asset = networkKey === 'equilibrium_parachain' ? assetFromToken(tokenInfo.symbol)[0] : assetFromToken(tokenInfo.symbol);

      transfer = api.tx.eqBalances.transferKeepAlive(asset, to, value);
    }
  } else if (isTxBalancesSupported && (!tokenInfo || tokenInfo.isMainToken)) {
    if (transferAll) {
      transfer = api.tx.balances.transferAll(to, false);
    } else if (value) {
      transfer = api.tx.balances.transferKeepAlive(to, new BN(value));
    }
  }

  if (!transfer) {
    callback(getUnsupportedResponse());

    return;
  }

  await doSignAndSend(api, networkKey, tokenInfo, nonce, transfer, fromKeypair, qrId, setState, updateState, callback);
}

export async function makeCrossChainTransferQr (
  originalNetworkKey: string,
  destinationNetworkKey: string,
  to: string,
  fromKeypair: KeyringPair,
  value: string,
  dotSamaApiMap: Record<string, ApiProps>,
  tokenInfo: TokenInfo,
  networkMap: Record<string, NetworkJson>,
  qrId: string,
  setState: (promise: QRRequestPromise) => void,
  updateState: (promise: Partial<QRRequestPromise>) => void,
  callback: (data: ResponseTransferQr) => void
): Promise<void> {
  if (!isNetworksPairSupportedTransferCrossChain(originalNetworkKey, destinationNetworkKey, tokenInfo.symbol, networkMap)) {
    callback(getUnsupportedResponse());

    return;
  }

  let nonce: AnyNumber;

  const fromAddress = fromKeypair.address;

  const apiProps = await dotSamaApiMap[originalNetworkKey].isReady;
  const api = apiProps.api;
  const isTxXTokensSupported = !!api && !!api.tx && !!api.tx.xTokens;

  if (['genshiro_testnet', 'genshiro', 'equilibrium_parachain'].includes(originalNetworkKey)) {
    nonce = -1;
  } else {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    nonce = await api.query.system.account(fromAddress).nonce;
  }

  if (!isTxXTokensSupported) {
    callback(getUnsupportedResponse());

    return;
  }

  // todo: Case ParaChain vs RelayChain
  // todo: Case RelayChain vs ParaChain

  const paraId = networkMap[destinationNetworkKey].paraId as number;

  const transfer = api.tx.xTokens.transfer(
    {
      Token: tokenInfo.symbol
    },
    +value,
    getCrossChainTransferDest(paraId, to),
    4000000000
  );

  await doSignAndSend(api, originalNetworkKey, tokenInfo, nonce, transfer, fromKeypair, qrId, setState, updateState, callback);
}

interface TransferNFTQrProps {
  networkKey: string;
  apiProp: ApiProps;
  recipientAddress: string;
  params: Record<string, any>;
  fromKeypair: KeyringPair;
  qrId: string;
  setState: (promise: QRRequestPromise) => void;
  updateState: (promise: Partial<QRRequestPromise>) => void;
  callback: (data: ResponseNftTransferQr) => void;
}

export async function makeNftTransferQr ({ apiProp,
  callback,
  fromKeypair,
  networkKey,
  params,
  qrId,
  recipientAddress,
  setState,
  updateState }: TransferNFTQrProps): Promise<void> {
  const txState: ResponseNftTransferQr = { isSendingSelf: false };
  const senderAddress = fromKeypair.address;

  const extrinsic = getNftTransferExtrinsic(networkKey, apiProp, senderAddress, recipientAddress, params);

  if (!extrinsic) {
    // eslint-disable-next-line node/no-callback-literal
    callback({ isSendingSelf: false, txError: true });

    return;
  }

  const qrCallback = ({ qrState }: {qrState: QrState}) => {
    // eslint-disable-next-line node/no-callback-literal
    callback({ isSendingSelf: false, qrState: qrState });
  };

  await extrinsic.signAsync(senderAddress, { signer: new QrSigner(apiProp.registry, qrCallback, qrId, setState) });

  const unsubscribe = await extrinsic.send((result) => {
    if (!result || !result.status) {
      return;
    }

    if (result.status.isBroadcast) {
      txState.isBusy = true;
    }

    if (result.status.isInBlock || result.status.isFinalized) {
      result.events
        .filter(({ event: { section } }) => section === 'system')
        .forEach(({ event: { method } }): void => {
          txState.transactionHash = extrinsic.hash.toHex();
          callback(txState);

          if (method === 'ExtrinsicFailed') {
            txState.status = false;
            callback(txState);
            updateState({ status: QRRequestPromiseStatus.FAILED });
          } else if (method === 'ExtrinsicSuccess') {
            txState.status = true;
            callback(txState);
            updateState({ status: QRRequestPromiseStatus.COMPLETED });
          }
        });
    } else if (result.isError) {
      txState.txError = true;
      callback(txState);
    }

    if (result.isCompleted) {
      unsubscribe();
    }
  });
}
