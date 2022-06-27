// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { assetFromToken } from '@equilab/api';
import { ApiProps, ExternalRequestPromise, ExternalRequestPromiseStatus, NetworkJson, NftTransactionResponse, ResponseNftTransferLedger, ResponseNftTransferQr, ResponseTransfer, ResponseTransferLedger, ResponseTransferQr, TokenInfo, TransferErrorCode, TransferStep } from '@subwallet/extension-base/background/KoniTypes';
import LedgerSigner from '@subwallet/extension-base/signers/substrates/LedgerSigner';
import QrSigner from '@subwallet/extension-base/signers/substrates/QrSigner';
import { LedgerState, QrState } from '@subwallet/extension-base/signers/types';
import { getCrossChainTransferDest, isNetworksPairSupportedTransferCrossChain } from '@subwallet/extension-koni-base/api/dotsama/transfer';
import { getNftTransferExtrinsic } from '@subwallet/extension-koni-base/api/nft/transfer';

import { ApiPromise } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import { EventRecord, ExtrinsicStatus } from '@polkadot/types/interfaces';
import { AnyNumber } from '@polkadot/types/types';
import { BN } from '@polkadot/util';

// TODO: consider pass state.getApiMap() as a param

// Interface

interface CreateTransferExtrinsicProps {
  api: ApiPromise;
  tokenInfo: TokenInfo | undefined;
  networkKey: string;
  recipientAddress: string;
  value: string;
  transferAll: boolean;
}

interface DoSignAndSendProps {
  api: ApiPromise;
  networkKey: string;
  tokenInfo: TokenInfo | undefined;
  nonce: AnyNumber;
  extrinsic: SubmittableExtrinsic;
  senderAddress: string;
  id: string;
  setState: (promise: ExternalRequestPromise) => void;
  updateState: (promise: Partial<ExternalRequestPromise>) => void;
  callback: (data: ResponseTransfer) => void;
}

interface MakeTransferProps {
  networkKey: string;
  recipientAddress: string;
  senderAddress: string;
  value: string;
  transferAll: boolean;
  apiProps: ApiProps;
  tokenInfo: undefined | TokenInfo;
  id: string;
  setState: (promise: ExternalRequestPromise) => void;
  updateState: (promise: Partial<ExternalRequestPromise>) => void;
  callback: (data: ResponseTransfer) => void;
}

interface MakeCrossTransferProps {
  originalNetworkKey: string;
  destinationNetworkKey: string;
  recipientAddress: string;
  senderAddress: string;
  dotSamaApiMap: Record<string, ApiProps>,
  value: string;
  tokenInfo: TokenInfo;
  networkMap: Record<string, NetworkJson>;
  id: string;
  setState: (promise: ExternalRequestPromise) => void;
  updateState: (promise: Partial<ExternalRequestPromise>) => void;
  callback: (data: ResponseTransfer) => void;
}

interface TransferNFTProps {
  networkKey: string;
  apiProp: ApiProps;
  recipientAddress: string;
  params: Record<string, any>;
  senderAddress: string;
  qrId: string;
  setState: (promise: ExternalRequestPromise) => void;
  updateState: (promise: Partial<ExternalRequestPromise>) => void;
  callback: (data: NftTransactionResponse) => void;
}

interface CreateCrossChainTransferExtrinsicProps extends MakeCrossTransferProps{
  doSignAndSend: (data: DoSignAndSendProps) => Promise<void>
}

// Get Unsupported Transfer Response
const getUnsupportedResponse = (): ResponseTransferQr => {
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
};

const updateResponseTxResult = (
  networkKey: string,
  tokenInfo: undefined | TokenInfo,
  response: ResponseTransfer,
  records: EventRecord[]): void => {
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
};

const _updateResponseByEvents = (api: ApiPromise, networkKey: string, tokenInfo: TokenInfo | undefined, response: ResponseTransfer, records: EventRecord[]) => {
  records.forEach((record) => {
    const { event: { method, section, data: [error] } } = record;

    const isFailed = section === 'system' && method === 'ExtrinsicFailed';
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
};

// Handle result from Extrinsic.send

interface StatusCallbackProps {
  events: EventRecord[];
  status: ExtrinsicStatus;
  extrinsic: SubmittableExtrinsic;
  response: ResponseTransfer;
  updateResponseByEvents: (response: ResponseTransfer, records: EventRecord[]) => void;
  callback: (response: ResponseTransfer) => void;
  updateState: (promise: Partial<ExternalRequestPromise>) => void;
}

const handlerTransferStatusCallback = ({ callback,
  events,
  extrinsic,
  response,
  status,
  updateResponseByEvents,
  updateState }: StatusCallbackProps) => {
  if (status.isInBlock) {
    const blockHash = status.asInBlock.toHex();

    response.step = TransferStep.PROCESSING;
    response.data = {
      block: blockHash,
      status: status.type
    };
    callback(response);

    updateResponseByEvents(response, events);
    response.extrinsicHash = extrinsic.hash.toHex();
    callback(response);

    if (response.step === TransferStep.SUCCESS.valueOf()) {
      updateState({ status: ExternalRequestPromiseStatus.COMPLETED });
    } else if (response.step === TransferStep.ERROR.valueOf()) {
      updateState({ status: ExternalRequestPromiseStatus.FAILED });
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
};

// Handle create transfer extrinsic

const handlerCreateTransferExtrinsic = ({ api,
  networkKey,
  recipientAddress,
  tokenInfo,
  transferAll,
  value }: CreateTransferExtrinsicProps) => {
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
        .transfer(recipientAddress, tokenInfo.specialOption || { Token: tokenInfo.symbol }, value);
    }
  } else if (['kintsugi', 'kintsugi_test', 'interlay'].includes(networkKey) && tokenInfo && isTxTokensSupported) {
    if (transferAll) {
      transfer = api.tx.tokens
        .transferAll(recipientAddress, tokenInfo.specialOption || { Token: tokenInfo.symbol }, false);
    } else if (value) {
      transfer = api.tx.tokens
        .transferKeepAlive(recipientAddress, tokenInfo.specialOption || { Token: tokenInfo.symbol }, new BN(value));
    }
  } else if (['genshiro_testnet', 'genshiro', 'equilibrium_parachain'].includes(networkKey) && tokenInfo && isTxEqBalancesSupported) {
    if (transferAll) {
      // currently genshiro_testnet, genshiro, equilibrium_parachain do not have transfer all method for tokens
    } else if (value) {
      const asset = networkKey === 'equilibrium_parachain' ? assetFromToken(tokenInfo.symbol)[0] : assetFromToken(tokenInfo.symbol);

      transfer = api.tx.eqBalances.transferKeepAlive(asset, recipientAddress, value);
    }
  } else if (isTxBalancesSupported && (!tokenInfo || tokenInfo.isMainToken)) {
    if (transferAll) {
      transfer = api.tx.balances.transferAll(recipientAddress, false);
    } else if (value) {
      transfer = api.tx.balances.transferKeepAlive(recipientAddress, new BN(value));
    }
  }

  return transfer;
};

const makeCrossChainTransferExternal = async ({ callback,
  destinationNetworkKey,
  doSignAndSend,
  dotSamaApiMap,
  id,
  networkMap,
  originalNetworkKey,
  recipientAddress,
  senderAddress,
  setState,
  tokenInfo,
  updateState,
  value }: CreateCrossChainTransferExtrinsicProps) => {
  if (!isNetworksPairSupportedTransferCrossChain(originalNetworkKey, destinationNetworkKey, tokenInfo.symbol, networkMap)) {
    callback(getUnsupportedResponse());

    return;
  }

  let nonce: AnyNumber;

  const apiProps = await dotSamaApiMap[originalNetworkKey].isReady;
  const api = apiProps.api;
  const isTxXTokensSupported = !!api && !!api.tx && !!api.tx.xTokens;

  if (['genshiro_testnet', 'genshiro', 'equilibrium_parachain'].includes(originalNetworkKey)) {
    nonce = -1;
  } else {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    nonce = await api.query.system.account(senderAddress).nonce;
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
    getCrossChainTransferDest(paraId, recipientAddress),
    4000000000
  );

  await doSignAndSend({
    api,
    networkKey: originalNetworkKey,
    tokenInfo,
    nonce,
    extrinsic: transfer,
    senderAddress,
    id,
    setState,
    updateState,
    callback
  });
};

/// / Qr

// Sign and send extrinsic

interface DoSignAndSendQrProps extends DoSignAndSendProps{
  callback: (data: ResponseTransferQr) => void;
}

const doSignAndSendQr = async (
  { api,
    callback,
    extrinsic,
    id,
    networkKey,
    nonce,
    senderAddress,
    setState,
    tokenInfo,
    updateState }: DoSignAndSendQrProps): Promise<void> => {
  const response: ResponseTransferQr = {
    step: TransferStep.READY,
    errors: [],
    extrinsicStatus: undefined,
    data: {}
  };

  const updateResponseByEvents = (response: ResponseTransfer, records: EventRecord[]) => {
    _updateResponseByEvents(api, networkKey, tokenInfo, response, records);
  };

  const qrCallback = ({ qrState }: {qrState: QrState}) => {
    // eslint-disable-next-line node/no-callback-literal
    callback({
      step: TransferStep.SIGNING,
      errors: [],
      extrinsicStatus: undefined,
      data: {},
      qrState: qrState,
      externalState: {
        externalId: qrState.qrId
      }
    });
  };

  await extrinsic.signAsync(senderAddress, { nonce, signer: new QrSigner(api.registry, qrCallback, id, setState) });

  await extrinsic.send(({ events, status }) => {
    console.log('Transaction status:', status.type, status.hash.toHex());
    response.extrinsicStatus = status.type;

    if (status.isBroadcast) {
      response.step = TransferStep.START;
      response.isBusy = true;
    }

    handlerTransferStatusCallback({ updateState, callback, updateResponseByEvents, response, events, status, extrinsic });
  });
};

// Make transfer token

interface MakeTransferQrProps extends MakeTransferProps{
  callback: (data: ResponseTransferQr) => void;
}

export async function makeTransferQr ({ apiProps,
  callback,
  id,
  networkKey,
  recipientAddress,
  senderAddress,
  setState,
  tokenInfo,
  transferAll,
  updateState,
  value }: MakeTransferQrProps): Promise<void> {
  const api = apiProps.api;

  const transfer = handlerCreateTransferExtrinsic({ transferAll, api, networkKey, tokenInfo, value, recipientAddress });

  if (!transfer) {
    callback(getUnsupportedResponse());

    return;
  }

  let nonce: AnyNumber;

  if (['genshiro_testnet', 'genshiro', 'equilibrium_parachain'].includes(networkKey)) {
    nonce = -1;
  } else {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    nonce = await api.query.system.account(senderAddress).nonce;
  }

  await doSignAndSendQr({
    api,
    networkKey,
    tokenInfo,
    nonce,
    extrinsic: transfer,
    senderAddress,
    id,
    setState,
    updateState,
    callback
  });
}

// Make transfer cross chain

interface MakeCrossTransferQrProps extends MakeCrossTransferProps{
  callback: (data: ResponseTransferQr) => void;
}

export async function makeCrossChainTransferQr ({ callback,
  destinationNetworkKey,
  dotSamaApiMap,
  id,
  networkMap,
  originalNetworkKey,
  recipientAddress,
  senderAddress,
  setState,
  tokenInfo,
  updateState,
  value }: MakeCrossTransferQrProps): Promise<void> {
  return makeCrossChainTransferExternal({
    callback,
    destinationNetworkKey,
    tokenInfo,
    id,
    setState,
    updateState,
    dotSamaApiMap,
    networkMap,
    originalNetworkKey,
    value,
    recipientAddress,
    senderAddress,
    doSignAndSend: doSignAndSendQr
  });
}

// Make transfer NFT

interface TransferNFTQrProps extends TransferNFTProps{
  callback: (data: ResponseNftTransferQr) => void;
}

export async function makeNftTransferQr ({ apiProp,
  callback,
  networkKey,
  params,
  qrId,
  recipientAddress,
  senderAddress,
  setState,
  updateState }: TransferNFTQrProps): Promise<void> {
  const txState: ResponseNftTransferQr = { isSendingSelf: false };
  const extrinsic = getNftTransferExtrinsic(networkKey, apiProp, senderAddress, recipientAddress, params);

  if (!extrinsic) {
    // eslint-disable-next-line node/no-callback-literal
    callback({ isSendingSelf: false, txError: true });

    return;
  }

  let nonce: AnyNumber;

  if (['genshiro_testnet', 'genshiro', 'equilibrium_parachain'].includes(networkKey)) {
    nonce = -1;
  } else {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    nonce = await apiProp.api.query.system.account(senderAddress).nonce;
  }

  const qrCallback = ({ qrState }: {qrState: QrState}) => {
    // eslint-disable-next-line node/no-callback-literal
    callback({ isSendingSelf: false, qrState: qrState, externalState: { externalId: qrState.qrId } });
  };

  await extrinsic.signAsync(senderAddress, { nonce, signer: new QrSigner(apiProp.registry, qrCallback, qrId, setState) });

  await extrinsic.send((result) => {
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
            updateState({ status: ExternalRequestPromiseStatus.FAILED });
          } else if (method === 'ExtrinsicSuccess') {
            txState.status = true;
            callback(txState);
            updateState({ status: ExternalRequestPromiseStatus.COMPLETED });
          }
        });
    } else if (result.isError) {
      txState.txError = true;
      callback(txState);
    }
  });
}

/// / Ledger

interface DoSignAndSendLedgerProps extends DoSignAndSendProps{
  callback: (data: ResponseTransferLedger) => void;
}

// Sign and send extrinsic

const doSignAndSendLedger = async ({ api,
  callback,
  extrinsic,
  id,
  networkKey,
  nonce,
  senderAddress,
  setState,
  tokenInfo,
  updateState }: DoSignAndSendLedgerProps): Promise<void> => {
  const response: ResponseTransferLedger = {
    step: TransferStep.READY,
    errors: [],
    extrinsicStatus: undefined,
    data: {}
  };

  const updateResponseByEvents = (response: ResponseTransfer, records: EventRecord[]) => {
    _updateResponseByEvents(api, networkKey, tokenInfo, response, records);
  };

  const ledgerCallback = ({ ledgerState }: {ledgerState: LedgerState}) => {
    // eslint-disable-next-line node/no-callback-literal
    callback({
      step: TransferStep.SIGNING,
      errors: [],
      extrinsicStatus: undefined,
      data: {},
      ledgerState: ledgerState,
      externalState: { externalId: ledgerState.ledgerId }
    });
  };

  await extrinsic.signAsync(senderAddress, { nonce, signer: new LedgerSigner(api.registry, ledgerCallback, id, setState) });

  await extrinsic.send(({ events, status }) => {
    console.log('Transaction status:', status.type, status.hash.toHex());
    response.extrinsicStatus = status.type;

    if (status.isBroadcast) {
      response.step = TransferStep.START;
    }

    handlerTransferStatusCallback({ updateState, callback, updateResponseByEvents, response, events, status, extrinsic });
  });
};

// Make transfer token

interface MakeTransferLedgerProps extends MakeTransferProps{
  callback: (data: ResponseTransferLedger) => void;
}

export async function makeTransferLedger ({ apiProps,
  callback,
  id,
  networkKey,
  recipientAddress,
  senderAddress,
  setState,
  tokenInfo,
  transferAll,
  updateState,
  value }: MakeTransferLedgerProps): Promise<void> {
  const api = apiProps.api;

  const transfer = handlerCreateTransferExtrinsic({ transferAll, api, value, tokenInfo, networkKey, recipientAddress });

  if (!transfer) {
    callback(getUnsupportedResponse());

    return;
  }

  let nonce: AnyNumber;

  if (['genshiro_testnet', 'genshiro', 'equilibrium_parachain'].includes(networkKey)) {
    nonce = -1;
  } else {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    nonce = await api.query.system.account(senderAddress).nonce;
  }

  await doSignAndSendLedger({
    api,
    networkKey,
    tokenInfo,
    nonce,
    extrinsic: transfer,
    senderAddress,
    id,
    setState,
    updateState,
    callback
  });
}

// Make transfer cross chain

interface MakeCrossTransferLedgerProps extends MakeCrossTransferProps{
  callback: (data: ResponseTransferLedger) => void;
}

export async function makeCrossChainTransferLedger ({ callback,
  destinationNetworkKey,
  dotSamaApiMap,
  id,
  networkMap,
  originalNetworkKey,
  recipientAddress,
  senderAddress,
  setState,
  tokenInfo,
  updateState,
  value }: MakeCrossTransferLedgerProps): Promise<void> {
  return makeCrossChainTransferExternal({
    id,
    recipientAddress,
    value,
    originalNetworkKey,
    tokenInfo,
    networkMap,
    dotSamaApiMap,
    updateState,
    callback,
    setState,
    doSignAndSend: doSignAndSendLedger,
    destinationNetworkKey,
    senderAddress
  });
}

// Make transfer NFT

interface TransferNFTLedgerProps extends TransferNFTProps{
  callback: (data: ResponseNftTransferLedger) => void;
}

export async function makeNftTransferLedger ({ apiProp,
  callback,
  networkKey,
  params,
  qrId,
  recipientAddress,
  senderAddress,
  setState,
  updateState }: TransferNFTLedgerProps): Promise<void> {
  const txState: ResponseNftTransferLedger = { isSendingSelf: false };
  const extrinsic = getNftTransferExtrinsic(networkKey, apiProp, senderAddress, recipientAddress, params);

  if (!extrinsic) {
    // eslint-disable-next-line node/no-callback-literal
    callback({ isSendingSelf: false, txError: true });

    return;
  }

  let nonce: AnyNumber;

  if (['genshiro_testnet', 'genshiro', 'equilibrium_parachain'].includes(networkKey)) {
    nonce = -1;
  } else {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    nonce = await apiProp.api.query.system.account(senderAddress).nonce;
  }

  const ledgerCallback = ({ ledgerState }: {ledgerState: LedgerState}) => {
    // eslint-disable-next-line node/no-callback-literal
    callback({ isSendingSelf: false, ledgerState: ledgerState, externalState: { externalId: ledgerState.ledgerId } });
  };

  await extrinsic.signAsync(senderAddress, { nonce, signer: new LedgerSigner(apiProp.registry, ledgerCallback, qrId, setState) });

  await extrinsic.send((result) => {
    if (!result || !result.status) {
      return;
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
            updateState({ status: ExternalRequestPromiseStatus.FAILED });
          } else if (method === 'ExtrinsicSuccess') {
            txState.status = true;
            callback(txState);
            updateState({ status: ExternalRequestPromiseStatus.COMPLETED });
          }
        });
    } else if (result.isError) {
      txState.txError = true;
      callback(txState);
    }
  });
}
