// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { GearApi } from '@gear-js/api';
import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { SupportTransferResponse } from '@subwallet/extension-base/background/KoniTypes';
import { getPSP22ContractPromise } from '@subwallet/extension-base/koni/api/tokens/wasm';
import { getWasmContractGasLimit } from '@subwallet/extension-base/koni/api/tokens/wasm/utils';
import { _BALANCE_TOKEN_GROUP, _MANTA_ZK_CHAIN_GROUP, _TRANSFER_CHAIN_GROUP, _TRANSFER_NOT_SUPPORTED_CHAINS, _ZK_ASSET_PREFIX } from '@subwallet/extension-base/services/chain-service/constants';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getContractAddressOfToken, _getTokenOnChainAssetId, _getTokenOnChainInfo, _isChainEvmCompatible, _isNativeToken, _isTokenGearSmartContract, _isTokenWasmSmartContract } from '@subwallet/extension-base/services/chain-service/utils';
import { getGRC20ContractPromise } from '@subwallet/extension-base/utils';

import { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import { AccountInfoWithProviders, AccountInfoWithRefCount } from '@polkadot/types/interfaces';
import { BN, u8aToHex } from '@polkadot/util';
import { decodeAddress } from '@polkadot/util-crypto';

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

  if (tokenInfo.symbol.startsWith(_ZK_ASSET_PREFIX) && _MANTA_ZK_CHAIN_GROUP.includes(tokenInfo.originChain)) {
    return {
      supportTransfer: false,
      supportTransferAll: false
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

  // TODO: need review
  if (_TRANSFER_CHAIN_GROUP.acala.includes(networkKey) && !_isNativeToken(tokenInfo) && isTxCurrenciesSupported) {
    result.supportTransfer = true;
    result.supportTransferAll = true;
  } else if (_TRANSFER_CHAIN_GROUP.kintsugi.includes(networkKey) && !_isNativeToken(tokenInfo) && isTxTokensSupported) {
    result.supportTransfer = true;
    result.supportTransferAll = true;
  } else if (
    _TRANSFER_CHAIN_GROUP.genshiro.includes(networkKey)
    // && !_isNativeToken(tokenInfo) && isTxEqBalancesSupported
  ) {
    result.supportTransfer = false;
    result.supportTransferAll = false;
  // } else if (_TRANSFER_CHAIN_GROUP.crab.includes(networkKey) && _BALANCE_TOKEN_GROUP.crab.includes(tokenInfo.symbol)) {
  //   result.supportTransfer = true;
  //   result.supportTransferAll = true;
  } else if (isTxBalancesSupported && _isNativeToken(tokenInfo)) {
    result.supportTransfer = true;
    result.supportTransferAll = true;
  } else if (_TRANSFER_CHAIN_GROUP.bitcountry.includes(networkKey) && !_isNativeToken(tokenInfo) && _BALANCE_TOKEN_GROUP.bitcountry.includes(tokenInfo.symbol)) {
    result.supportTransfer = true;
    result.supportTransferAll = true;
  } else if (_TRANSFER_CHAIN_GROUP.statemine.includes(networkKey) && !_isNativeToken(tokenInfo)) {
    result.supportTransfer = true;
    result.supportTransferAll = true;
  } else if (_TRANSFER_CHAIN_GROUP.sora_substrate.includes(networkKey)) {
    result.supportTransfer = true;
    result.supportTransferAll = true;
  // } else if (_TRANSFER_CHAIN_GROUP.riochain.includes(networkKey) && _isNativeToken(tokenInfo)) {
  //   result.supportTransfer = true;
  //   result.supportTransferAll = true;
  } else if (_TRANSFER_CHAIN_GROUP.avail.includes(networkKey)) {
    result.supportTransfer = true;
    result.supportTransferAll = true;
  } else if (_TRANSFER_CHAIN_GROUP.centrifuge.includes(networkKey)) {
    result.supportTransfer = true;
    result.supportTransferAll = true;
  }

  return result;
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

  const isDisableTransfer = tokenInfo.metadata?.isDisableTransfer as boolean;

  if (isDisableTransfer) {
    return [null, value];
  }

  // @ts-ignore
  let transfer: SubmittableExtrinsic<'promise'> | null = null;
  const isTxCurrenciesSupported = !!api && !!api.tx && !!api.tx.currencies;
  const isTxBalancesSupported = !!api && !!api.tx && !!api.tx.balances;
  const isTxTokensSupported = !!api && !!api.tx && !!api.tx.tokens;
  // const isTxEqBalancesSupported = !!api && !!api.tx && !!api.tx.eqBalances;
  const isTxAssetsSupported = !!api && !!api.tx && !!api.tx.assets;
  let transferAmount; // for PSP-22 tokens, might be deprecated in the future

  if (_isTokenWasmSmartContract(tokenInfo) && api.query.contracts) {
    const contractPromise = getPSP22ContractPromise(api, _getContractAddressOfToken(tokenInfo));
    // @ts-ignore
    const gasLimit = await getWasmContractGasLimit(api, from, 'psp22::transfer', contractPromise, {}, [from, value, {}]);

    // @ts-ignore
    transfer = contractPromise.tx['psp22::transfer']({ gasLimit }, to, value, {});
    transferAmount = value;
  } else if (_isTokenGearSmartContract(tokenInfo) && (api instanceof GearApi)) {
    const contractPromise = getGRC20ContractPromise(api, _getContractAddressOfToken(tokenInfo));
    const transaction = await contractPromise
      .transfer(u8aToHex(decodeAddress(to)), BigInt(value)) // Create transfer transaction
      .withAccount(from) // Set sender account
      .calculateGas(); // Add account arg to extrinsic

    transfer = transaction.tx;
    transferAmount = value;
  } else if (_TRANSFER_CHAIN_GROUP.acala.includes(networkKey)) {
    if (!_isNativeToken(tokenInfo)) {
      if (isTxCurrenciesSupported) {
        transfer = api.tx.currencies.transfer(to, _getTokenOnChainInfo(tokenInfo), value);
      }
    } else {
      if (transferAll) {
        transfer = api.tx.balances.transferAll(to, false);
      } else if (value) {
        transfer = api.tx.balances.transferKeepAlive(to, new BN(value));
      }
    }
  } else if (_TRANSFER_CHAIN_GROUP.kintsugi.includes(networkKey) && isTxTokensSupported) {
    if (transferAll) {
      transfer = api.tx.tokens.transferAll(to, _getTokenOnChainInfo(tokenInfo) || _getTokenOnChainAssetId(tokenInfo), false);
    } else if (value) {
      transfer = api.tx.tokens.transfer(to, _getTokenOnChainInfo(tokenInfo) || _getTokenOnChainAssetId(tokenInfo), new BN(value));
    }
  } else if (_TRANSFER_CHAIN_GROUP.pendulum.includes(networkKey) && isTxTokensSupported && !_isNativeToken(tokenInfo)) {
    if (transferAll) {
      transfer = api.tx.tokens.transferAll(to, _getTokenOnChainInfo(tokenInfo) || _getTokenOnChainAssetId(tokenInfo), false);
    } else if (value) {
      transfer = api.tx.tokens.transfer(to, _getTokenOnChainInfo(tokenInfo) || _getTokenOnChainAssetId(tokenInfo), new BN(value));
    }
  } else if (
    _TRANSFER_CHAIN_GROUP.genshiro.includes(networkKey)
    // && isTxEqBalancesSupported
  ) {
    // transfer = api.tx.eqBalances.transfer(_getTokenOnChainAssetId(tokenInfo), to, value);
    /* empty */
  // } else if (!_isNativeToken(tokenInfo) && (_TRANSFER_CHAIN_GROUP.crab.includes(networkKey) || _BALANCE_TOKEN_GROUP.crab.includes(tokenInfo.symbol))) {
  //   if (transferAll) {
  //     transfer = api.tx.kton.transferAll(to, false);
  //   } else if (value) {
  //     transfer = api.tx.kton.transfer(to, new BN(value));
  //   }
  } else if (_TRANSFER_CHAIN_GROUP.bitcountry.includes(networkKey) && !_isNativeToken(tokenInfo)) {
    transfer = api.tx.currencies.transfer(to, _getTokenOnChainInfo(tokenInfo), value);
  } else if (_TRANSFER_CHAIN_GROUP.statemine.includes(networkKey) && !_isNativeToken(tokenInfo)) {
    transfer = api.tx.assets.transfer(_getTokenOnChainAssetId(tokenInfo), to, value);
    // } else if (_TRANSFER_CHAIN_GROUP.riochain.includes(networkKey)) {
    //   if (_isNativeToken(tokenInfo)) {
    //     transfer = api.tx.currencies.transferNativeCurrency(to, value);
    //   }
  } else if (_TRANSFER_CHAIN_GROUP.sora_substrate.includes(networkKey) && isTxAssetsSupported) {
    transfer = api.tx.assets.transfer(_getTokenOnChainAssetId(tokenInfo), to, value);
  } else if (isTxBalancesSupported && _isNativeToken(tokenInfo)) {
    if (_TRANSFER_CHAIN_GROUP.disable_transfer.includes(networkKey)) {
      return [null, transferAmount || value];
    }

    if (transferAll) {
      transfer = api.tx.balances.transferAll(to, false);
    } else if (value) {
      if (api.tx.balances.transferKeepAlive) {
        transfer = api.tx.balances.transferKeepAlive(to, new BN(value));
      } else {
        transfer = api.tx.balances.transfer(to, new BN(value));
      }
    }
  }

  return [transfer, transferAmount || value];
};
