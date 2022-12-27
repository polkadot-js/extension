// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { assetFromToken } from '@equilab/api';
import { ApiProps, BasicTxResponse, CustomTokenType, ExternalRequestPromise, ExternalRequestPromiseStatus, SupportTransferResponse, TokenInfo, TransferErrorCode } from '@subwallet/extension-base/background/KoniTypes';
import { SignerType } from '@subwallet/extension-base/signers/types';
import { getTokenInfo } from '@subwallet/extension-koni-base/api/dotsama/registry';
import { signAndSendExtrinsic } from '@subwallet/extension-koni-base/api/dotsama/shared/signAndSendExtrinsic';
import { getPSP22ContractPromise } from '@subwallet/extension-koni-base/api/tokens/wasm';

import { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import { KeyringPair } from '@polkadot/keyring/types';
import { AccountInfoWithProviders, AccountInfoWithRefCount, EventRecord } from '@polkadot/types/interfaces';
import { BN } from '@polkadot/util';

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

  if (['subspace_gemini_3a', 'kulupu', 'joystream'].includes(networkKey)) {
    return {
      supportTransfer: false,
      supportTransferAll: false
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

  if (tokenInfo && tokenInfo.type && !apiProps.isEthereum && api.query.contracts) { // for PSP tokens
    return {
      supportTransfer: true,
      supportTransferAll: true
    };
  }

  if (['karura', 'acala', 'acala_testnet'].includes(networkKey) && tokenInfo && !tokenInfo.isMainToken && isTxCurrenciesSupported) {
    result.supportTransfer = true;
    result.supportTransferAll = false;
  } else if (['kintsugi', 'kintsugi_test', 'interlay'].includes(networkKey) && tokenInfo && isTxTokensSupported) {
    result.supportTransfer = true;
    result.supportTransferAll = true;
  } else if (['genshiro_testnet', 'genshiro', 'equilibrium_parachain'].includes(networkKey) && tokenInfo && isTxEqBalancesSupported) {
    result.supportTransfer = true;
    result.supportTransferAll = false;
  } else if (tokenInfo && ((networkKey === 'crab' && tokenInfo.symbol === 'CKTON') || (networkKey === 'pangolin' && tokenInfo.symbol === 'PKTON'))) {
    result.supportTransfer = true;
    result.supportTransferAll = true;
  } else if (isTxBalancesSupported && (!tokenInfo || tokenInfo.isMainToken)) {
    result.supportTransfer = true;
    result.supportTransferAll = true;
  } else if (['pioneer', 'bitcountry'].includes(networkKey) && tokenInfo && tokenInfo.symbol === 'BIT') {
    result.supportTransfer = true;
    result.supportTransferAll = true;
  } else if (['statemint', 'statemine'].includes(networkKey) && tokenInfo) {
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

  if (tokenInfo && tokenInfo.contractAddress && tokenInfo.type && !apiProps.isEthereum && api.query.contracts) { // for PSP tokens
    const contractPromise = getPSP22ContractPromise(api, tokenInfo.contractAddress);
    const paymentInfo = await contractPromise.tx['psp22::transfer']({ gasLimit: '10000' }, to, value, {}) // gasLimit is arbitrary since it's only estimating fee
      .paymentInfo(fromKeypair);

    fee = paymentInfo.partialFee.toString();
  } else if (['karura', 'acala', 'acala_testnet'].includes(networkKey) && tokenInfo && !tokenInfo.isMainToken && isTxCurrenciesSupported) {
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
  } else if (['pioneer', 'bitcountry'].includes(networkKey) && tokenInfo && tokenInfo.symbol === 'BIT') {
    const paymentInfo = await api.tx.currencies.transfer(to, tokenInfo.specialOption, value).paymentInfo(fromKeypair);

    fee = paymentInfo.partialFee.toString();
  } else if (['statemint', 'statemine'].includes(networkKey) && tokenInfo && !tokenInfo.isMainToken) {
    const paymentInfo = await api.tx.assets.transfer(tokenInfo.assetIndex, to, value).paymentInfo(fromKeypair);

    fee = paymentInfo.partialFee.toString();
  } else if (isTxBalancesSupported && (!tokenInfo || tokenInfo.isMainToken || (tokenInfo && ((networkKey === 'crab' && tokenInfo.symbol === 'CKTON') || (networkKey === 'pangolin' && tokenInfo.symbol === 'PKTON'))))) {
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

export function getUnsupportedResponse (): BasicTxResponse {
  return {
    status: false,
    errors: [
      {
        code: TransferErrorCode.UNSUPPORTED,
        message: 'The transaction of current network is unsupported'
      }
    ]
  };
}

export function updateTransferResponseTxResult (
  networkKey: string,
  tokenInfo: undefined | TokenInfo,
  response: BasicTxResponse,
  records: EventRecord[],
  transferAmount?: string): void {
  if (!response.txResult) {
    if (tokenInfo && tokenInfo.type === CustomTokenType.psp22) {
      response.txResult = { change: transferAmount || '0' };
    } else {
      response.txResult = { change: '0' };
    }
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
    } else if (['pioneer', 'bitcountry'].includes(networkKey) && tokenInfo && !tokenInfo.isMainToken) {
      if (record.event.section === 'tokens' &&
        record.event.method.toLowerCase() === 'transfer') {
        response.txResult.change = record.event.data[3]?.toString() || '0';
        response.txResult.changeSymbol = tokenInfo.symbol;
      }
    } else if (['statemint', 'statemine'].includes(networkKey) && tokenInfo && !tokenInfo.isMainToken) {
      if (record.event.section === 'assets' &&
        record.event.method.toLowerCase() === 'transferred') {
        response.txResult.change = record.event.data[3]?.toString() || '0';
        response.txResult.changeSymbol = tokenInfo.symbol;
      }
    } else {
      if (record.event.section === 'balances' &&
        record.event.method.toLowerCase() === 'transfer') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        response.txResult.change = record.event.data[2]?.toString() || '0';
      } else if (record.event.section === 'xTokens' &&
        record.event.method.toLowerCase() === 'transferred') {
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

export interface TransferDoSignAndSendProps {
  apiProps: ApiProps;
  networkKey: string;
  tokenInfo: TokenInfo | undefined;
  extrinsic: SubmittableExtrinsic;
  _updateResponseTxResult: (
    networkKey: string,
    tokenInfo: undefined | TokenInfo,
    response: BasicTxResponse,
    records: EventRecord[],
    transferAmount?: string) => void
  callback: (data: BasicTxResponse) => void;
  transferAmount?: string;
  signFunction: () => Promise<void>;
  updateState?: (promise: Partial<ExternalRequestPromise>) => void;
}

export async function doSignAndSend ({ _updateResponseTxResult,
  apiProps,
  callback,
  extrinsic,
  networkKey,
  signFunction,
  tokenInfo,
  transferAmount,
  updateState }: TransferDoSignAndSendProps) {
  const api = apiProps.api;
  const response: BasicTxResponse = {
    errors: []
  };

  function updateResponseByEvents (response: BasicTxResponse, records: EventRecord[]) {
    records.forEach((record) => {
      const { event: { method, section, data: [error] } } = record;

      // @ts-ignore
      const isFailed = section === 'system' && method === 'ExtrinsicFailed';
      // @ts-ignore
      const isSuccess = section === 'system' && method === 'ExtrinsicSuccess';

      console.log('Transaction final: ', isFailed, isSuccess);

      if (isFailed) {
        response.status = false;
        response.txError = true;

        // @ts-ignore
        if (error.isModule) {
          // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          const decoded = api.registry.findMetaError(error.asModule);
          const { docs, method, section } = decoded;

          const errorMessage = docs.join(' ');

          console.log(`${section}.${method}: ${errorMessage}`);
          // response.data = {
          //   section,
          //   method,
          //   message: errorMessage
          // };
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
        response.status = true;
      }
    });

    _updateResponseTxResult(networkKey, tokenInfo, response, records, transferAmount);
  }

  await signFunction();

  await extrinsic.send(({ events = [], status }) => {
    console.log('Transaction status:', status.type, status.hash.toHex());

    if (status.isInBlock) {
      callback(response);

      updateResponseByEvents(response, events);
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
      response.extrinsicHash = extrinsic.hash.toHex();
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

      if (response.status !== undefined) {
        updateState && updateState({ status: response.status ? ExternalRequestPromiseStatus.COMPLETED : ExternalRequestPromiseStatus.FAILED });
      }
    } else if (status.isFinalized) {
      response.isFinalized = true;
      callback(response);
    } else {
      callback(response);
    }
  });
}

interface CreateTransferExtrinsicProps {
  apiProp: ApiProps;
  networkKey: string,
  to: string,
  from: string,
  value: string,
  transferAll: boolean,
  tokenInfo: undefined | TokenInfo,
}

export const createTransferExtrinsic = async ({ apiProp, from, networkKey, to, tokenInfo, transferAll, value }: CreateTransferExtrinsicProps): Promise<[SubmittableExtrinsic | null, string?]> => {
  const api = apiProp.api;

  // @ts-ignore
  let transfer: SubmittableExtrinsic<'promise'> | null = null;
  const isTxCurrenciesSupported = !!api && !!api.tx && !!api.tx.currencies;
  const isTxBalancesSupported = !!api && !!api.tx && !!api.tx.balances;
  const isTxTokensSupported = !!api && !!api.tx && !!api.tx.tokens;
  const isTxEqBalancesSupported = !!api && !!api.tx && !!api.tx.eqBalances;
  let transferAmount; // for PSP-22 tokens, might be deprecated in the future

  if (tokenInfo && tokenInfo.contractAddress && tokenInfo.type && !apiProp.isEthereum && api.query.contracts) {
    const contractPromise = getPSP22ContractPromise(api, tokenInfo.contractAddress);
    const transferQuery = await contractPromise.query['psp22::transfer'](from, { gasLimit: -1 }, to, value, {});
    const gasLimit = transferQuery.gasRequired.toString();

    transfer = contractPromise.tx['psp22::transfer']({ gasLimit }, to, value, {});
    transferAmount = value;
  } else if (['karura', 'acala', 'acala_testnet'].includes(networkKey) && tokenInfo && !tokenInfo.isMainToken && isTxCurrenciesSupported) {
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
  } else if (tokenInfo && ((networkKey === 'crab' && tokenInfo.symbol === 'CKTON') || (networkKey === 'pangolin' && tokenInfo.symbol === 'PKTON'))) {
    if (transferAll) {
      transfer = api.tx.kton.transferAll(to, false);
    } else if (value) {
      transfer = api.tx.kton.transfer(to, new BN(value));
    }
  } else if (['pioneer', 'bitcountry'].includes(networkKey) && tokenInfo && tokenInfo.symbol === 'BIT') {
    transfer = api.tx.currencies.transfer(to, tokenInfo.specialOption, value);
  } else if (['statemint', 'statemine'].includes(networkKey) && tokenInfo && !tokenInfo.isMainToken) {
    transfer = api.tx.assets.transfer(tokenInfo.assetIndex, to, value);
  } else if (isTxBalancesSupported && (!tokenInfo || tokenInfo.isMainToken)) {
    if (transferAll) {
      transfer = api.tx.balances.transferAll(to, false);
    } else if (value) {
      transfer = api.tx.balances.transfer(to, new BN(value));
    }
  }

  return [transfer, transferAmount];
};

export interface MakeTransferProps {
  networkKey: string;
  to: string;
  from: string;
  value: string;
  transferAll: boolean;
  dotSamaApiMap: Record<string, ApiProps>;
  tokenInfo: undefined | TokenInfo;
  callback: (data: BasicTxResponse) => void;
}

export async function makeTransfer ({ callback,
  dotSamaApiMap,
  from,
  networkKey,
  to,
  tokenInfo,
  transferAll,
  value }: MakeTransferProps): Promise<void> {
  const txState: BasicTxResponse = {};
  const apiProps = await dotSamaApiMap[networkKey].isReady;

  const [extrinsic, transferAmount] = await createTransferExtrinsic({
    transferAll: transferAll,
    value: value,
    from: from,
    networkKey: networkKey,
    tokenInfo: tokenInfo,
    to: to,
    apiProp: apiProps
  });

  if (!extrinsic) {
    callback(getUnsupportedResponse());

    return;
  }

  const updateResponseTxResult = (response: BasicTxResponse, records: EventRecord[]) => {
    updateTransferResponseTxResult(networkKey, tokenInfo, response, records, transferAmount);
  };

  await signAndSendExtrinsic({
    type: SignerType.PASSWORD,
    apiProps: apiProps,
    callback: callback,
    extrinsic: extrinsic,
    txState: txState,
    address: from,
    updateResponseTxResult: updateResponseTxResult,
    errorMessage: 'error transfer'
  });
}
