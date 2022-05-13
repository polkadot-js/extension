// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ResponseTransfer, SupportTransferResponse, TokenInfo, TransferErrorCode, TransferStep } from '@subwallet/extension-base/background/KoniTypes';
import { ethereumChains } from '@subwallet/extension-koni-base/api/dotsama/api-helper';
import { getTokenInfo } from '@subwallet/extension-koni-base/api/dotsama/registry';
import { state } from '@subwallet/extension-koni-base/background/handlers';

import { KeyringPair } from '@polkadot/keyring/types';
import { AccountInfoWithProviders, AccountInfoWithRefCount, EventRecord } from '@polkadot/types/interfaces';
import { BN } from '@polkadot/util';

// TODO: consider pass state.getApiMap() as a param

export async function getExistentialDeposit (networkKey: string, token: string): Promise<string> {
  const dotSamaApiMap = state.getApiMap().dotSama;
  const apiProps = await dotSamaApiMap[networkKey].isReady;
  const api = apiProps.api;

  const tokenInfo = await getTokenInfo(networkKey, api, token);

  if (tokenInfo && tokenInfo.isMainToken) {
    if (api?.consts?.balances?.existentialDeposit) {
      return api.consts.balances.existentialDeposit.toString();
    }
  }

  return '0';
}

function isRefCount (accountInfo: AccountInfoWithProviders | AccountInfoWithRefCount): accountInfo is AccountInfoWithRefCount {
  return !!(accountInfo as AccountInfoWithRefCount).refcount;
}

export async function checkReferenceCount (networkKey: string, address: string): Promise<boolean> {
  // todo: need update if ethereumChains is dynamic
  if (ethereumChains.includes(networkKey)) {
    return false;
  }

  const dotSamaApiMap = state.getApiMap().dotSama;
  const apiProps = await dotSamaApiMap[networkKey].isReady;
  const api = apiProps.api;

  // @ts-ignore
  const accountInfo: AccountInfoWithProviders | AccountInfoWithRefCount = await api.query.system.account(address);

  return accountInfo
    ? isRefCount(accountInfo)
      ? !accountInfo.refcount.isZero()
      : !accountInfo.consumers.isZero()
    : false;
}

export async function checkSupportTransfer (networkKey: string, token: string): Promise<SupportTransferResponse> {
  // todo: need update if ethereumChains is dynamic
  if (ethereumChains.includes(networkKey)) {
    return {
      supportTransfer: true,
      supportTransferAll: true
    };
  }

  const dotSamaApiMap = state.getApiMap().dotSama;
  const apiProps = await dotSamaApiMap[networkKey].isReady;
  const api = apiProps.api;
  const isTxCurrenciesSupported = !!api && !!api.tx && !!api.tx.currencies;
  const isTxBalancesSupported = !!api && !!api.tx && !!api.tx.balances;
  const isTxTokensSupported = !!api && !!api.tx && !!api.tx.tokens;
  const result: SupportTransferResponse = {
    supportTransfer: false,
    supportTransferAll: false
  };

  if (!(isTxCurrenciesSupported || isTxBalancesSupported || isTxTokensSupported)) {
    return result;
  }

  const tokenInfo = await getTokenInfo(networkKey, api, token);

  if (['karura', 'acala', 'acala_testnet'].includes(networkKey) && tokenInfo && !tokenInfo.isMainToken && isTxCurrenciesSupported) {
    result.supportTransfer = true;
    result.supportTransferAll = false;
  } else if (['kintsugi', 'kintsugi_test', 'interlay'].includes(networkKey) && tokenInfo && isTxTokensSupported) {
    result.supportTransfer = true;
    result.supportTransferAll = true;
  } else if (isTxBalancesSupported && (!tokenInfo || tokenInfo.isMainToken)) {
    result.supportTransfer = true;
    result.supportTransferAll = true;
  }

  return result;
}

export async function estimateFee (
  networkKey: string,
  fromKeypair: KeyringPair | undefined,
  to: string, value: string | undefined,
  transferAll: boolean,
  tokenInfo?: TokenInfo
): Promise<[string, string | undefined]> {
  let fee = '0';
  // eslint-disable-next-line
  let feeSymbol = undefined;

  if (fromKeypair === undefined) {
    return [fee, feeSymbol];
  }

  const dotSamaApiMap = state.getApiMap().dotSama;
  const apiProps = await dotSamaApiMap[networkKey].isReady;
  const api = apiProps.api;
  const isTxCurrenciesSupported = !!api && !!api.tx && !!api.tx.currencies;
  const isTxBalancesSupported = !!api && !!api.tx && !!api.tx.balances;
  const isTxTokensSupported = !!api && !!api.tx && !!api.tx.tokens;

  if (['karura', 'acala', 'acala_testnet'].includes(networkKey) && tokenInfo && !tokenInfo.isMainToken && isTxCurrenciesSupported) {
    // Note: currently 'karura', 'acala', 'acala_testnet' do not support transfer all
    // if (transferAll) {
    //   const freeBalanceString = await getFreeBalance(networkKey, fromKeypair.address, tokenInfo.symbol);
    //
    //   const paymentInfo = await api.tx.currencies
    //     .transfer(to, tokenInfo.specialOption || { Token: tokenInfo.symbol }, freeBalanceString)
    //     .paymentInfo(fromKeypair);
    //
    //   return paymentInfo.partialFee.toString();
    if (value) {
      const paymentInfo = await api.tx.currencies
        .transfer(to, tokenInfo.specialOption || { Token: tokenInfo.symbol }, value)
        .paymentInfo(fromKeypair);

      fee = paymentInfo.partialFee.toString();
    }
  } else if (['kintsugi', 'kintsugi_test', 'interlay'].includes(networkKey) && tokenInfo && isTxTokensSupported) {
    if (transferAll) {
      const paymentInfo = await api.tx.tokens
        .transferAll(to, tokenInfo.specialOption || { Token: tokenInfo.symbol }, false)
        .paymentInfo(fromKeypair);

      fee = paymentInfo.partialFee.toString();
    } else if (value) {
      const paymentInfo = await api.tx.tokens
        .transfer(to, tokenInfo.specialOption || { Token: tokenInfo.symbol }, new BN(value))
        .paymentInfo(fromKeypair);

      fee = paymentInfo.partialFee.toString();
    }
  } else if (isTxBalancesSupported && (!tokenInfo || tokenInfo.isMainToken)) {
    if (transferAll) {
      const paymentInfo = await api.tx.balances.transferAll(to, false).paymentInfo(fromKeypair);

      fee = paymentInfo.partialFee.toString();
    } else if (value) {
      const paymentInfo = await api.tx.balances.transfer(to, new BN(value)).paymentInfo(fromKeypair);

      fee = paymentInfo.partialFee.toString();
    }
  }

  return [fee, feeSymbol];
}

function getUnsupportedResponse (): ResponseTransfer {
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

export async function makeTransfer (
  networkKey: string,
  to: string,
  fromKeypair: KeyringPair,
  value: string,
  transferAll: boolean,
  tokenInfo: undefined | TokenInfo,
  callback: (data: ResponseTransfer) => void
): Promise<void> {
  const dotSamaApiMap = state.getApiMap().dotSama;
  const apiProps = await dotSamaApiMap[networkKey].isReady;
  const api = apiProps.api;
  const fromAddress = fromKeypair.address;
  // @ts-ignore
  const { nonce } = await api.query.system.account(fromAddress);

  // @ts-ignore
  let transfer;
  const isTxCurrenciesSupported = !!api && !!api.tx && !!api.tx.currencies;
  const isTxBalancesSupported = !!api && !!api.tx && !!api.tx.balances;
  const isTxTokensSupported = !!api && !!api.tx && !!api.tx.tokens;

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
        .transfer(to, tokenInfo.specialOption || { Token: tokenInfo.symbol }, new BN(value));
    }
  } else if (isTxBalancesSupported && (!tokenInfo || tokenInfo.isMainToken)) {
    if (transferAll) {
      transfer = api.tx.balances.transferAll(to, false);
    } else if (value) {
      transfer = api.tx.balances.transfer(to, new BN(value));
    }
  }

  if (!transfer) {
    callback(getUnsupportedResponse());

    return;
  }

  const response: ResponseTransfer = {
    step: TransferStep.READY,
    errors: [],
    extrinsicStatus: undefined,
    data: {}
  };

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

  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  await transfer.signAndSend(fromKeypair, { nonce }, ({ events = [], status }) => {
    console.log('Transaction status:', status.type, status.hash.toHex());
    response.extrinsicStatus = status.type;

    if (status.isBroadcast) {
      response.step = TransferStep.START;
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

      // const extrinsicIndex = parseInt(events[0]?.phase.asApplyExtrinsic.toString());
      //
      // // Get extrinsic hash from network
      // api.rpc.chain.getBlock(blockHash)
      //   .then((blockQuery: SignedBlockWithJustifications) => {
      //     response.extrinsicHash = blockQuery.block.extrinsics[extrinsicIndex].hash.toHex();
      //     callback(response);
      //   })
      //   .catch((e) => {
      //     console.error('Transaction errors:', e);
      //     callback(response);
      //   });
    } else if (status.isFinalized) {
      const blockHash = status.asFinalized.toHex();

      response.isFinalized = true;

      response.data = {
        block: blockHash,
        status: status.type
      };

      // todo: may do something here

      callback(response);
    } else {
      callback(response);
    }
  });
}
