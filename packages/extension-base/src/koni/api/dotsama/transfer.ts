// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { BasicTxErrorType, SupportTransferResponse, TransactionResponse } from '@subwallet/extension-base/background/KoniTypes';
import { getPSP22ContractPromise } from '@subwallet/extension-base/koni/api/tokens/wasm';
import { _BALANCE_TOKEN_GROUP, _TRANSFER_CHAIN_GROUP, _TRANSFER_NOT_SUPPORTED_CHAINS } from '@subwallet/extension-base/services/chain-service/constants';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getContractAddressOfToken, _getTokenOnChainAssetId, _getTokenOnChainInfo, _isChainEvmCompatible, _isNativeToken, _isTokenWasmSmartContract } from '@subwallet/extension-base/services/chain-service/utils';
import { KeyringPair } from '@subwallet/keyring/types';

import { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import { AccountInfoWithProviders, AccountInfoWithRefCount } from '@polkadot/types/interfaces';
import { BN } from '@polkadot/util';

function isRefCount (accountInfo: AccountInfoWithProviders | AccountInfoWithRefCount): accountInfo is AccountInfoWithRefCount {
  return !!(accountInfo as AccountInfoWithRefCount).refcount;
}

export async function checkReferenceCount (networkKey: string, address: string, substrateApiMap: Record<string, _SubstrateApi>, chainInfo: _ChainInfo): Promise<boolean> {
  const apiProps = await substrateApiMap[networkKey].isReady;
  const api = apiProps.api;

  if (_isChainEvmCompatible(chainInfo)) {
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

export async function checkSupportTransfer (networkKey: string, tokenInfo: _ChainAsset, substrateApiMap: Record<string, _SubstrateApi>, chainInfo: _ChainInfo): Promise<SupportTransferResponse> {
  const substrateApi = await substrateApiMap[networkKey].isReady;

  if (!tokenInfo) {
    return {
      supportTransfer: false,
      supportTransferAll: false
    };
  }

  if (_isChainEvmCompatible(chainInfo)) {
    return {
      supportTransfer: true,
      supportTransferAll: true
    };
  }

  if (_TRANSFER_NOT_SUPPORTED_CHAINS.includes(networkKey)) {
    return {
      supportTransfer: false,
      supportTransferAll: false
    };
  }

  const api = substrateApi.api;
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

  if (_isTokenWasmSmartContract(tokenInfo) && api.query.contracts) { // for PSP tokens
    return {
      supportTransfer: true,
      supportTransferAll: true
    };
  }

  if (_TRANSFER_CHAIN_GROUP.acala.includes(networkKey) && !_isNativeToken(tokenInfo) && isTxCurrenciesSupported) {
    result.supportTransfer = true;
    result.supportTransferAll = false;
  } else if (_TRANSFER_CHAIN_GROUP.kintsugi.includes(networkKey) && !_isNativeToken(tokenInfo) && isTxTokensSupported) {
    result.supportTransfer = true;
    result.supportTransferAll = true;
  } else if (_TRANSFER_CHAIN_GROUP.genshiro.includes(networkKey) && !_isNativeToken(tokenInfo) && isTxEqBalancesSupported) {
    result.supportTransfer = true;
    result.supportTransferAll = false;
  } else if (_TRANSFER_CHAIN_GROUP.crab.includes(networkKey) && _BALANCE_TOKEN_GROUP.crab.includes(tokenInfo.symbol)) {
    result.supportTransfer = true;
    result.supportTransferAll = true;
  } else if (isTxBalancesSupported && _isNativeToken(tokenInfo)) {
    result.supportTransfer = true;
    result.supportTransferAll = true;
  } else if (_TRANSFER_CHAIN_GROUP.bitcountry.includes(networkKey) && !_isNativeToken(tokenInfo) && _BALANCE_TOKEN_GROUP.bitcountry.includes(tokenInfo.symbol)) {
    result.supportTransfer = true;
    result.supportTransferAll = true;
  } else if (_TRANSFER_CHAIN_GROUP.statemine.includes(networkKey) && !_isNativeToken(tokenInfo)) {
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
  substrateApiMap: Record<string, _SubstrateApi>,
  tokenInfo: _ChainAsset
): Promise<[string, string | undefined]> {
  let fee = '0';
  // eslint-disable-next-line
  let feeSymbol = undefined;

  if (fromKeypair === undefined) {
    return [fee, feeSymbol];
  }

  const chainApi = await substrateApiMap[networkKey].isReady;
  const api = chainApi.api;
  const isTxCurrenciesSupported = !!api && !!api.tx && !!api.tx.currencies;
  const isTxBalancesSupported = !!api && !!api.tx && !!api.tx.balances;
  const isTxTokensSupported = !!api && !!api.tx && !!api.tx.tokens;
  const isTxEqBalancesSupported = !!api && !!api.tx && !!api.tx.eqBalances;

  if (_isTokenWasmSmartContract(tokenInfo) && api.query.contracts) { // for PSP tokens
    const contractPromise = getPSP22ContractPromise(api, _getContractAddressOfToken(tokenInfo));
    const paymentInfo = await contractPromise.tx['psp22::transfer']({ gasLimit: '10000' }, to, value, {}) // gasLimit is arbitrary since it's only estimating fee
      .paymentInfo(fromKeypair);

    fee = paymentInfo.partialFee.toString();
  } else if (_TRANSFER_CHAIN_GROUP.acala.includes(networkKey) && _isNativeToken(tokenInfo) && isTxCurrenciesSupported) {
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
        .transfer(to, _getTokenOnChainInfo(tokenInfo), value)
        .paymentInfo(fromKeypair);

      fee = paymentInfo.partialFee.toString();
    }
  } else if (_TRANSFER_CHAIN_GROUP.kintsugi.includes(networkKey) && !_isNativeToken(tokenInfo) && isTxTokensSupported) {
    if (transferAll) {
      const paymentInfo = await api.tx.tokens
        .transferAll(to, _getTokenOnChainInfo(tokenInfo), false)
        .paymentInfo(fromKeypair);

      fee = paymentInfo.partialFee.toString();
    } else if (value) {
      const paymentInfo = await api.tx.tokens
        .transfer(to, _getTokenOnChainInfo(tokenInfo), new BN(value))
        .paymentInfo(fromKeypair);

      fee = paymentInfo.partialFee.toString();
    }
  } else if (_TRANSFER_CHAIN_GROUP.genshiro.includes(networkKey) && !_isNativeToken(tokenInfo) && isTxEqBalancesSupported) {
    if (transferAll) {
      // currently genshiro_testnet, genshiro, equilibrium_parachain do not have transfer all method for tokens
    } else if (value) {
      const paymentInfo = await api.tx.eqBalances.transfer(_getTokenOnChainInfo(tokenInfo), to, value)
        .paymentInfo(fromKeypair.address, { nonce: -1 });

      fee = paymentInfo.partialFee.toString();
    }
  } else if (_TRANSFER_CHAIN_GROUP.bitcountry.includes(networkKey) && !_isNativeToken(tokenInfo) && _BALANCE_TOKEN_GROUP.bitcountry.includes(tokenInfo.symbol)) {
    const paymentInfo = await api.tx.currencies.transfer(to, _getTokenOnChainInfo(tokenInfo), value).paymentInfo(fromKeypair);

    fee = paymentInfo.partialFee.toString();
  } else if (_TRANSFER_CHAIN_GROUP.statemine.includes(networkKey) && !_isNativeToken(tokenInfo)) {
    const paymentInfo = await api.tx.assets.transfer(_getTokenOnChainAssetId(tokenInfo), to, value).paymentInfo(fromKeypair);

    fee = paymentInfo.partialFee.toString();
  } else if (isTxBalancesSupported && (_isNativeToken(tokenInfo) || (!_isNativeToken(tokenInfo) && _TRANSFER_CHAIN_GROUP.crab.includes(networkKey) && _BALANCE_TOKEN_GROUP.crab.includes(tokenInfo.symbol)))) {
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

export function getUnsupportedResponse (): TransactionResponse {
  return {
    status: false,
    errors: [new TransactionError(BasicTxErrorType.UNSUPPORTED, 'The transaction of current network is unsupported')]
  };
}

interface CreateTransferExtrinsicProps {
  substrateApi: _SubstrateApi;
  networkKey: string,
  to: string,
  from: string,
  value: string,
  transferAll: boolean,
  tokenInfo: _ChainAsset,
}

export const createTransferExtrinsic = async ({ from, networkKey, substrateApi, to, tokenInfo, transferAll, value }: CreateTransferExtrinsicProps): Promise<[SubmittableExtrinsic | null, string]> => {
  const api = substrateApi.api;

  // @ts-ignore
  let transfer: SubmittableExtrinsic<'promise'> | null = null;
  const isTxCurrenciesSupported = !!api && !!api.tx && !!api.tx.currencies;
  const isTxBalancesSupported = !!api && !!api.tx && !!api.tx.balances;
  const isTxTokensSupported = !!api && !!api.tx && !!api.tx.tokens;
  const isTxEqBalancesSupported = !!api && !!api.tx && !!api.tx.eqBalances;
  let transferAmount; // for PSP-22 tokens, might be deprecated in the future

  if (_isTokenWasmSmartContract(tokenInfo) && api.query.contracts) {
    const contractPromise = getPSP22ContractPromise(api, _getContractAddressOfToken(tokenInfo));
    const transferQuery = await contractPromise.query['psp22::transfer'](from, { gasLimit: -1 }, to, value, {});
    const gasLimit = transferQuery.gasRequired.toString();

    transfer = contractPromise.tx['psp22::transfer']({ gasLimit }, to, value, {});
    transferAmount = value;
  } else if (_TRANSFER_CHAIN_GROUP.acala.includes(networkKey) && !_isNativeToken(tokenInfo) && isTxCurrenciesSupported) {
    if (transferAll) {
      // currently Acala, Karura, Acala testnet do not have transfer all method for sub token
    } else if (value) {
      transfer = api.tx.currencies
        .transfer(to, _getTokenOnChainInfo(tokenInfo), value);
    }
  } else if (_TRANSFER_CHAIN_GROUP.kintsugi.includes(networkKey) && !_isNativeToken(tokenInfo) && isTxTokensSupported) {
    if (transferAll) {
      transfer = api.tx.tokens
        .transferAll(to, _getTokenOnChainInfo(tokenInfo), false);
    } else if (value) {
      transfer = api.tx.tokens
        .transfer(to, _getTokenOnChainInfo(tokenInfo), new BN(value));
    }
  } else if (_TRANSFER_CHAIN_GROUP.genshiro.includes(networkKey) && !_isNativeToken(tokenInfo) && isTxEqBalancesSupported) {
    if (transferAll) {
      // currently genshiro_testnet, genshiro, equilibrium_parachain do not have transfer all method for tokens
    } else if (value) {
      transfer = api.tx.eqBalances.transfer(_getTokenOnChainInfo(tokenInfo), to, value);
    }
  } else if (!_isNativeToken(tokenInfo) && (_TRANSFER_CHAIN_GROUP.crab.includes(networkKey) || _BALANCE_TOKEN_GROUP.crab.includes(tokenInfo.symbol))) {
    if (transferAll) {
      transfer = api.tx.kton.transferAll(to, false);
    } else if (value) {
      transfer = api.tx.kton.transfer(to, new BN(value));
    }
  } else if (_TRANSFER_CHAIN_GROUP.bitcountry.includes(networkKey) && tokenInfo && tokenInfo.symbol === 'BIT') {
    transfer = api.tx.currencies.transfer(to, _getTokenOnChainInfo(tokenInfo), value);
  } else if (_TRANSFER_CHAIN_GROUP.statemine.includes(networkKey) && !_isNativeToken(tokenInfo)) {
    transfer = api.tx.assets.transfer(_getTokenOnChainAssetId(tokenInfo), to, value);
  } else if (isTxBalancesSupported && _isNativeToken(tokenInfo)) {
    if (transferAll) {
      transfer = api.tx.balances.transferAll(to, false);
    } else if (value) {
      transfer = api.tx.balances.transfer(to, new BN(value));
    }
  }

  return [transfer, transferAmount || value];
};
