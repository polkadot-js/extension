// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { GearApi } from '@gear-js/api';
import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { getPSP22ContractPromise } from '@subwallet/extension-base/koni/api/contract-handler/wasm';
import { getWasmContractGasLimit } from '@subwallet/extension-base/koni/api/contract-handler/wasm/utils';
import { _TRANSFER_CHAIN_GROUP } from '@subwallet/extension-base/services/chain-service/constants';
import { _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getContractAddressOfToken, _getTokenOnChainAssetId, _getTokenOnChainInfo, _getXcmAssetMultilocation, _isBridgedToken, _isChainEvmCompatible, _isNativeToken, _isTokenGearSmartContract, _isTokenTransferredByEvm, _isTokenWasmSmartContract } from '@subwallet/extension-base/services/chain-service/utils';
import { calculateGasFeeParams } from '@subwallet/extension-base/services/fee-service/utils';
import { getGRC20ContractPromise } from '@subwallet/extension-base/utils';
import BigN from 'bignumber.js';
import { TransactionConfig } from 'web3-core';

import { SubmittableExtrinsic } from '@polkadot/api/promise/types';
import { BN, u8aToHex } from '@polkadot/util';
import { decodeAddress } from '@polkadot/util-crypto';

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
  const isTxAssetsSupported = !!api && !!api.tx && !!api.tx.assets;
  let transferAmount; // for PSP-22 tokens, might be deprecated in the future

  if (_isBridgedToken(tokenInfo) && api.tx.foreignAssets) {
    const onChainInfo = _getTokenOnChainInfo(tokenInfo) || _getXcmAssetMultilocation(tokenInfo);

    if (transferAll) {
      transfer = api.tx.foreignAssets.transfer(onChainInfo, to, value);
    } else {
      transfer = api.tx.foreignAssets.transferKeepAlive(onChainInfo, to, value);
    }
  } else if (_isTokenWasmSmartContract(tokenInfo) && api.query.contracts) {
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
  } else if (_TRANSFER_CHAIN_GROUP.bitcountry.includes(networkKey) && !_isNativeToken(tokenInfo)) {
    transfer = api.tx.currencies.transfer(to, _getTokenOnChainInfo(tokenInfo), value);
  } else if (_TRANSFER_CHAIN_GROUP.statemine.includes(networkKey) && !_isNativeToken(tokenInfo)) {
    transfer = api.tx.assets.transfer(_getTokenOnChainAssetId(tokenInfo), to, value);
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

export const getTransferMockTxFee = async (address: string, chainInfo: _ChainInfo, tokenInfo: _ChainAsset, api: _SubstrateApi | _EvmApi): Promise<BigN> => {
  try {
    let estimatedFee;

    if (_isChainEvmCompatible(chainInfo) && _isTokenTransferredByEvm(tokenInfo)) {
      const web3 = api as _EvmApi;
      const transaction: TransactionConfig = {
        value: 0,
        to: '0x0000000000000000000000000000000000000000', // null address
        from: address
      };
      const gasLimit = await web3.api.eth.estimateGas(transaction);
      const priority = await calculateGasFeeParams(web3, chainInfo.slug);

      if (priority.baseGasFee) {
        const maxFee = priority.maxFeePerGas;

        estimatedFee = maxFee.multipliedBy(gasLimit);
      } else {
        estimatedFee = new BigN(priority.gasPrice).multipliedBy(gasLimit);
      }
    } else {
      const substrateApi = api as _SubstrateApi;
      const chainApi = await substrateApi.isReady;
      const [mockTx] = await createTransferExtrinsic({
        from: address,
        networkKey: chainInfo.slug,
        substrateApi: chainApi,
        to: address,
        tokenInfo,
        transferAll: true,
        value: '1000000000000000000'
      });

      const paymentInfo = await mockTx?.paymentInfo(address);

      estimatedFee = new BigN(paymentInfo?.partialFee?.toString() || '0'); // todo: should handle error case instead of setting fee to 0
    }

    return estimatedFee;
  } catch (e) {
    console.error('error mocking tx fee', e);

    return new BigN(0);
  }
};
