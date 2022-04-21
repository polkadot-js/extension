// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ResponseTransfer, TokenInfo, TransferErrorCode, TransferStep } from '@polkadot/extension-base/background/KoniTypes';
import { getTokenInfo } from '@polkadot/extension-koni-base/api/dotsama/registry';
// import { getFreeBalance } from '@polkadot/extension-koni-base/api/dotsama/balance';
import { dotSamaAPIMap } from '@polkadot/extension-koni-base/background/handlers';
import { KeyringPair } from '@polkadot/keyring/types';
import { AccountInfoWithProviders, AccountInfoWithRefCount, EventRecord, SignedBlockWithJustifications } from '@polkadot/types/interfaces';
import { BN } from '@polkadot/util';

function isRefCount (accountInfo: AccountInfoWithProviders | AccountInfoWithRefCount): accountInfo is AccountInfoWithRefCount {
  return !!(accountInfo as AccountInfoWithRefCount).refcount;
}

export async function checkReferenceCount (networkKey: string, address: string): Promise<boolean> {
  const apiProps = await dotSamaAPIMap[networkKey].isReady;
  const api = apiProps.api;

  // @ts-ignore
  const accountInfo: AccountInfoWithProviders | AccountInfoWithRefCount = await api.query.system.account(address);

  return accountInfo
    ? isRefCount(accountInfo)
      ? !accountInfo.refcount.isZero()
      : !accountInfo.consumers.isZero()
    : false;
}

export async function checkSupportTransfer (networkKey: string, token: string): Promise<boolean> {
  const apiProps = await dotSamaAPIMap[networkKey].isReady;
  const api = apiProps.api;
  const isTxCurrenciesSupported = !!api && !!api.tx && !!api.tx.currencies;
  const isTxBalancesSupported = !!api && !!api.tx && !!api.tx.balances;
  const isTxTokensSupported = !!api && !!api.tx && !!api.tx.tokens;

  if (!(isTxCurrenciesSupported || isTxBalancesSupported || isTxTokensSupported)) {
    return false;
  }

  const tokenInfo = await getTokenInfo(networkKey, api, token);

  if (['kintsugi', 'kintsugi_test', 'interlay'].includes(networkKey) && tokenInfo && isTxTokensSupported) {
    return true;
  } else if (isTxBalancesSupported && (!tokenInfo || tokenInfo.isMainToken)) {
    return true;
  }

  return false;
}

export async function estimateFee (
  networkKey: string,
  fromKeypair: KeyringPair | undefined,
  to: string, value: string | undefined,
  transferAll: boolean,
  tokenInfo?: TokenInfo
): Promise<string> {
  if (fromKeypair === undefined) {
    return '0';
  }

  const apiProps = await dotSamaAPIMap[networkKey].isReady;
  const api = apiProps.api;
  const isTxCurrenciesSupported = !!api && !!api.tx && !!api.tx.currencies;
  const isTxBalancesSupported = !!api && !!api.tx && !!api.tx.balances;
  const isTxTokensSupported = !!api && !!api.tx && !!api.tx.tokens;

  if (['karura', 'acala', 'acala_testnet'].includes(networkKey) && tokenInfo && !tokenInfo.isMainToken && isTxCurrenciesSupported) {
    // todo: perform calculating transaction fee for 'karura', 'acala', 'acala_testnet'

    // if (transferAll) {
    //   const freeBalanceString = await getFreeBalance(networkKey, fromKeypair.address, tokenInfo.symbol);
    //
    //   const paymentInfo = await api.tx.currencies
    //     .transfer(to, tokenInfo.specialOption || { Token: tokenInfo.symbol }, freeBalanceString)
    //     .paymentInfo(fromKeypair);
    //
    //   return paymentInfo.partialFee.toString();
    // } else if (value) {
    //   const paymentInfo = await api.tx.currencies
    //     .transfer(to, tokenInfo.specialOption || { Token: tokenInfo.symbol }, value)
    //     .paymentInfo(fromKeypair);
    //
    //   return paymentInfo.partialFee.toString();
    // }
  } else if (['kintsugi', 'kintsugi_test', 'interlay'].includes(networkKey) && tokenInfo && isTxTokensSupported) {
    if (transferAll) {
      const paymentInfo = await api.tx.tokens
        .transferAll(to, tokenInfo.specialOption || { Token: tokenInfo.symbol }, false)
        .paymentInfo(fromKeypair);

      return paymentInfo.partialFee.toString();
    } else if (value) {
      const paymentInfo = await api.tx.tokens
        .transfer(to, tokenInfo.specialOption || { Token: tokenInfo.symbol }, new BN(value))
        .paymentInfo(fromKeypair);

      return paymentInfo.partialFee.toString();
    }
  } else if (isTxBalancesSupported && (!tokenInfo || tokenInfo.isMainToken)) {
    if (transferAll) {
      const paymentInfo = await api.tx.balances.transferAll(to, false).paymentInfo(fromKeypair);

      return paymentInfo.partialFee.toString();
    } else if (value) {
      const paymentInfo = await api.tx.balances.transfer(to, new BN(value)).paymentInfo(fromKeypair);

      return paymentInfo.partialFee.toString();
    }
  }

  return '0';
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

export async function makeTransfer (
  networkKey: string,
  to: string,
  fromKeypair: KeyringPair,
  value: string,
  transferAll: boolean,
  tokenInfo: undefined | TokenInfo,
  callback: (data: ResponseTransfer) => void
): Promise<void> {
  const apiProps = await dotSamaAPIMap[networkKey].isReady;
  const api = apiProps.api;
  const fromAddress = fromKeypair.address;
  // @ts-ignore
  const { nonce } = await api.query.system.account(fromAddress);

  let transfer;
  const isTxCurrenciesSupported = !!api && !!api.tx && !!api.tx.currencies;
  const isTxBalancesSupported = !!api && !!api.tx && !!api.tx.balances;
  const isTxTokensSupported = !!api && !!api.tx && !!api.tx.tokens;

  if (['karura', 'acala', 'acala_testnet'].includes(networkKey) && tokenInfo && !tokenInfo.isMainToken && isTxCurrenciesSupported) {
    if (transferAll) {
      // todo: perform transferring all balance for 'karura', 'acala', 'acala_testnet'

      // const freeBalanceString = await getFreeBalance(networkKey, fromAddress, tokenInfo.symbol);
      //
      // const paymentInfo = await api.tx.currencies
      //   .transfer(to, tokenInfo.specialOption || { Token: tokenInfo.symbol }, freeBalanceString)
      //   .paymentInfo(fromKeypair);
      //
      // const transferringValue = (new BN(freeBalanceString)).sub(paymentInfo.partialFee);
      //
      // transfer = api.tx.currencies
      //   .transfer(to, tokenInfo.specialOption || { Token: tokenInfo.symbol }, transferringValue.toString());
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

  function updateResponseByEvents (response: ResponseTransfer, events: EventRecord[]) {
    events.forEach(({ event: { method, section, data: [error, info] } }) => {
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

          const errorMesssage = docs.join(' ');

          console.log(`${section}.${method}: ${errorMesssage}`);
          response.data = {
            section,
            method,
            message: errorMesssage,
            info
          };
          response.errors?.push({
            code: TransferErrorCode.TRANSFER_ERROR,
            message: errorMesssage
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

      // updateResponseByEvents(response, events);
      callback(response);
    } else if (status.isFinalized) {
      const blockHash = status.asFinalized.toHex();

      response.data = {
        block: blockHash,
        status: status.type
      };

      updateResponseByEvents(response, events);

      const extrinsicIndex = parseInt(events[0]?.phase.asApplyExtrinsic.toString());

      // Get extrinsic hash from network
      api.rpc.chain.getBlock(blockHash)
        .then((blockQuery: SignedBlockWithJustifications) => {
          response.extrinsicHash = blockQuery.block.extrinsics[extrinsicIndex].hash.toHex();
          callback(response);
        })
        .catch((e) => {
          console.error('Transaction errors:', e);
          callback(response);
        });
    } else {
      callback(response);
    }
  });
}
