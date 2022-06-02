// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { assetFromToken } from '@equilab/api';
import { ApiProps, NetworkJson, ResponseTransfer, SupportTransferResponse, TokenInfo, TransferErrorCode, TransferStep } from '@subwallet/extension-base/background/KoniTypes';
import { getTokenInfo } from '@subwallet/extension-koni-base/api/dotsama/registry';
import { SupportedCrossChainsMap } from '@subwallet/extension-koni-base/api/supportedCrossChains';

import { ApiPromise } from '@polkadot/api';
import { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import { KeyringPair } from '@polkadot/keyring/types';
import { AccountInfoWithProviders, AccountInfoWithRefCount, EventRecord } from '@polkadot/types/interfaces';
import { BN } from '@polkadot/util';

// TODO: consider pass state.getApiMap() as a param

export async function getExistentialDeposit (networkKey: string, token: string, dotSamaApiMap: Record<string, ApiProps>): Promise<string> {
  const apiProps = await dotSamaApiMap[networkKey].isReady;
  const api = apiProps.api;

  const tokenInfo = await getTokenInfo(networkKey, api, token);

  if (tokenInfo && tokenInfo.isMainToken) {
    if (api?.consts?.balances?.existentialDeposit) {
      return api.consts.balances.existentialDeposit.toString();
    } else if (api?.consts?.eqBalances?.existentialDeposit) {
      return api.consts.eqBalances.existentialDeposit.toString();
    }
  }

  return '0';
}

function isRefCount (accountInfo: AccountInfoWithProviders | AccountInfoWithRefCount): accountInfo is AccountInfoWithRefCount {
  return !!(accountInfo as AccountInfoWithRefCount).refcount;
}

export async function checkReferenceCount (networkKey: string, address: string, dotSamaApiMap: Record<string, ApiProps>): Promise<boolean> {
  const apiProps = await dotSamaApiMap[networkKey].isReady;
  const api = apiProps.api;

  if (apiProps.isEthereum) {
    return false;
  }

  // @ts-ignore
  const accountInfo: AccountInfoWithProviders | AccountInfoWithRefCount = await api.query.system.account(address);

  return accountInfo
    ? isRefCount(accountInfo)
      ? !accountInfo.refcount.isZero()
      : !accountInfo.consumers.isZero()
    : false;
}

export async function checkSupportTransfer (networkKey: string, token: string, dotSamaApiMap: Record<string, ApiProps>): Promise<SupportTransferResponse> {
  const apiProps = await dotSamaApiMap[networkKey].isReady;

  if (apiProps.isEthereum) {
    return {
      supportTransfer: true,
      supportTransferAll: true
    };
  }

  const api = apiProps.api;
  const isTxCurrenciesSupported = !!api && !!api.tx && !!api.tx.currencies;
  const isTxBalancesSupported = !!api && !!api.tx && !!api.tx.balances;
  const isTxTokensSupported = !!api && !!api.tx && !!api.tx.tokens;
  const isTxEqBalancesSupported = !!api && !!api.tx && !!api.tx.eqBalances;
  const result: SupportTransferResponse = {
    supportTransfer: false,
    supportTransferAll: false
  };

  if (!(isTxCurrenciesSupported || isTxBalancesSupported || isTxTokensSupported || isTxEqBalancesSupported)) {
    return result;
  }

  const tokenInfo = await getTokenInfo(networkKey, api, token);

  if (['karura', 'acala', 'acala_testnet'].includes(networkKey) && tokenInfo && !tokenInfo.isMainToken && isTxCurrenciesSupported) {
    result.supportTransfer = true;
    result.supportTransferAll = false;
  } else if (['kintsugi', 'kintsugi_test', 'interlay'].includes(networkKey) && tokenInfo && isTxTokensSupported) {
    result.supportTransfer = true;
    result.supportTransferAll = true;
  } else if (['genshiro_testnet', 'genshiro', 'equilibrium_parachain'].includes(networkKey) && tokenInfo && isTxEqBalancesSupported) {
    result.supportTransfer = true;
    result.supportTransferAll = false;
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
  dotSamaApiMap: Record<string, ApiProps>,
  tokenInfo?: TokenInfo
): Promise<[string, string | undefined]> {
  let fee = '0';
  // eslint-disable-next-line
  let feeSymbol = undefined;

  if (fromKeypair === undefined) {
    return [fee, feeSymbol];
  }

  const apiProps = await dotSamaApiMap[networkKey].isReady;
  const api = apiProps.api;
  const isTxCurrenciesSupported = !!api && !!api.tx && !!api.tx.currencies;
  const isTxBalancesSupported = !!api && !!api.tx && !!api.tx.balances;
  const isTxTokensSupported = !!api && !!api.tx && !!api.tx.tokens;
  const isTxEqBalancesSupported = !!api && !!api.tx && !!api.tx.eqBalances;

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
  } else if (['genshiro_testnet', 'genshiro', 'equilibrium_parachain'].includes(networkKey) && tokenInfo && isTxEqBalancesSupported) {
    if (transferAll) {
      // currently genshiro_testnet, genshiro, equilibrium_parachain do not have transfer all method for tokens
    } else if (value) {
      const asset = networkKey === 'equilibrium_parachain' ? assetFromToken(tokenInfo.symbol)[0] : assetFromToken(tokenInfo.symbol);
      const paymentInfo = await api.tx.eqBalances.transfer(asset, to, value)
        .paymentInfo(fromKeypair.address, { nonce: -1 });

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
      if (!response.txResult.fee) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        response.txResult.fee = record.event.data[1]?.toString() || '0';
      }
    }
  }
}

async function doSignAndSend (
  api: ApiPromise,
  networkKey: string,
  tokenInfo: TokenInfo | undefined,
  transfer: SubmittableExtrinsic,
  fromKeypair: KeyringPair,
  _updateResponseTxResult: (
    networkKey: string,
    tokenInfo: undefined | TokenInfo,
    response: ResponseTransfer,
    records: EventRecord[]) => void,
  callback: (data: ResponseTransfer) => void) {
  const fromAddress = fromKeypair.address;
  let nonce;

  if (['genshiro_testnet', 'genshiro', 'equilibrium_parachain'].includes(networkKey)) {
    nonce = -1;
  } else {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    nonce = await api.query.system.account(fromAddress).nonce;
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

    _updateResponseTxResult(networkKey, tokenInfo, response, records);
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

export async function makeTransfer (
  networkKey: string,
  to: string,
  fromKeypair: KeyringPair,
  value: string,
  transferAll: boolean,
  dotSamaApiMap: Record<string, ApiProps>,
  tokenInfo: undefined | TokenInfo,
  callback: (data: ResponseTransfer) => void
): Promise<void> {
  const apiProps = await dotSamaApiMap[networkKey].isReady;
  const api = apiProps.api;

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
        .transfer(to, tokenInfo.specialOption || { Token: tokenInfo.symbol }, new BN(value));
    }
  } else if (['genshiro_testnet', 'genshiro', 'equilibrium_parachain'].includes(networkKey) && tokenInfo && isTxEqBalancesSupported) {
    if (transferAll) {
      // currently genshiro_testnet, genshiro, equilibrium_parachain do not have transfer all method for tokens
    } else if (value) {
      const asset = networkKey === 'equilibrium_parachain' ? assetFromToken(tokenInfo.symbol)[0] : assetFromToken(tokenInfo.symbol);

      transfer = api.tx.eqBalances.transfer(asset, to, value);
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

  await doSignAndSend(api, networkKey, tokenInfo, transfer, fromKeypair, updateResponseTxResult, callback);
}

export function isNetworksPairSupportedTransferCrossChain (
  originalNetworkKey: string,
  destinationNetworkKey: string,
  token: string,
  networkMap: Record<string, NetworkJson>
): boolean {
  // todo: Check ParaChain vs RelayChain, RelayChain vs ParaChain
  if (!SupportedCrossChainsMap[originalNetworkKey] ||
  !SupportedCrossChainsMap[originalNetworkKey].relationMap[destinationNetworkKey] ||
  !SupportedCrossChainsMap[originalNetworkKey].relationMap[destinationNetworkKey].supportedToken.includes(token)) {
    return false;
  }

  if (!(networkMap[destinationNetworkKey] && networkMap[destinationNetworkKey].paraId)) {
    return false;
  }

  // todo: There may have further conditions

  return true;
}

function getCrossChainTransferDest (paraId: number, toAddress: string) {
  // todo: Case ParaChain vs RelayChain
  // todo: Case RelayChain vs ParaChain

  // Case ParaChain vs ParaChain
  return ({
    V1: {
      parents: 1,
      interior: {
        X2: [
          {
            Parachain: paraId
          },
          {
            AccountKey20: {
              network: 'Any',
              key: toAddress
            }
          }
        ]
      }
    }
  });
}

export async function estimateCrossChainFee (
  originalNetworkKey: string,
  destinationNetworkKey: string,
  to: string,
  fromKeypair: KeyringPair,
  value: string,
  dotSamaApiMap: Record<string, ApiProps>,
  tokenInfo: TokenInfo,
  networkMap: Record<string, NetworkJson>
): Promise<[string, string | undefined]> {
  if (!isNetworksPairSupportedTransferCrossChain(originalNetworkKey, destinationNetworkKey, tokenInfo.symbol, networkMap)) {
    return ['0', tokenInfo.symbol];
  }

  const apiProps = await dotSamaApiMap[originalNetworkKey].isReady;
  const api = apiProps.api;
  const isTxXTokensSupported = !!api && !!api.tx && !!api.tx.xTokens;
  let fee = '0';
  // eslint-disable-next-line prefer-const
  let feeSymbol = tokenInfo.symbol;

  if (isTxXTokensSupported) {
    // todo: Case ParaChain vs RelayChain
    // todo: Case RelayChain vs ParaChain

    const paraId = networkMap[destinationNetworkKey].paraId as number;

    // Case ParaChain vs ParaChain
    const paymentInfo = await api.tx.xTokens.transfer(
      {
        Token: tokenInfo.symbol
      },
      +value,
      getCrossChainTransferDest(paraId, to),
      4000000000
    ).paymentInfo(fromKeypair);

    fee = paymentInfo.partialFee.toString();
  }

  return [fee, feeSymbol];
}

export async function makeCrossChainTransfer (
  originalNetworkKey: string,
  destinationNetworkKey: string,
  to: string,
  fromKeypair: KeyringPair,
  value: string,
  dotSamaApiMap: Record<string, ApiProps>,
  tokenInfo: TokenInfo,
  networkMap: Record<string, NetworkJson>,
  callback: (data: ResponseTransfer) => void
): Promise<void> {
  if (!isNetworksPairSupportedTransferCrossChain(originalNetworkKey, destinationNetworkKey, tokenInfo.symbol, networkMap)) {
    callback(getUnsupportedResponse());

    return;
  }

  const apiProps = await dotSamaApiMap[originalNetworkKey].isReady;
  const api = apiProps.api;
  const isTxXTokensSupported = !!api && !!api.tx && !!api.tx.xTokens;

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

  await doSignAndSend(api, originalNetworkKey, tokenInfo, transfer, fromKeypair, updateResponseTxResult, callback);
}
