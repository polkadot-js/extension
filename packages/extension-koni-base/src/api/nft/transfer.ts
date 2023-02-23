// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { SubstrateNftTransaction } from '@subwallet/extension-base/background/KoniTypes';
import { _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getChainNativeTokenBasicInfo } from '@subwallet/extension-base/services/chain-service/utils';
import { getFreeBalance } from '@subwallet/extension-koni-base/api/dotsama/balance';
import { SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME } from '@subwallet/extension-koni-base/api/nft/config';
import { parseNumberToDisplay, reformatAddress } from '@subwallet/extension-base/utils';

import { BN } from '@polkadot/util';

export async function acalaTransferHandler (networkKey: string, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, senderAddress: string, recipientAddress: string, params: Record<string, any>, chainInfo: _ChainInfo) {
  const { decimals, symbol } = _getChainNativeTokenBasicInfo(chainInfo);

  try {
    const apiProp = substrateApiMap[networkKey];
    const itemId = params.itemId as number;
    const collectionId = params.collectionId as number;
    const [info, balance] = await Promise.all([
      apiProp.api.tx.nft.transfer(recipientAddress, [collectionId, itemId]).paymentInfo(senderAddress),
      getFreeBalance(networkKey, senderAddress, substrateApiMap, evmApiMap)
    ]);

    const binaryBalance = new BN(balance);
    const balanceError = info.partialFee.gt(binaryBalance);

    const feeString = parseNumberToDisplay(info.partialFee, decimals) + ` ${symbol}`;

    return {
      error: false,
      estimatedFee: feeString,
      balanceError
    } as SubstrateNftTransaction;
  } catch (e) {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    if (e.toString().includes('Error: createType(RuntimeDispatchInfo):: Struct: failed on weight: u64:: Assertion failed')) {
      return {
        error: false,
        estimatedFee: `0.0000 ${symbol}`,
        balanceError: false
      } as SubstrateNftTransaction;
    }

    console.error('error handling acala transfer nft', e);

    return {
      error: true,
      balanceError: false
    };
  }
}

export async function rmrkTransferHandler (networkKey: string, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, senderAddress: string, recipientAddress: string, params: Record<string, any>, chainInfo: _ChainInfo) {
  const { decimals, symbol } = _getChainNativeTokenBasicInfo(chainInfo);

  try {
    const apiProp = substrateApiMap[networkKey];
    const remark = params.remark as string;

    if (!remark) {
      return { error: true, balanceError: false };
    }

    const parsedRemark = remark.concat(recipientAddress.replace(
      /\\s/g,
      ''
    ));

    const [info, balance] = await Promise.all([
      await apiProp.api.tx.system.remark(parsedRemark).paymentInfo(senderAddress),
      getFreeBalance(networkKey, senderAddress, substrateApiMap, evmApiMap)
    ]);

    const binaryBalance = new BN(balance);
    const balanceError = info.partialFee.gt(binaryBalance);

    const feeString = parseNumberToDisplay(info.partialFee, decimals) + ` ${symbol}`;

    return {
      error: false,
      estimatedFee: feeString,
      balanceError
    } as SubstrateNftTransaction;
  } catch (e) {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    if (e.toString().includes('Error: createType(RuntimeDispatchInfo):: Struct: failed on weight: u64:: Assertion failed')) {
      return {
        error: false,
        estimatedFee: `0.0000 ${symbol}`,
        balanceError: false
      } as SubstrateNftTransaction;
    }

    console.error('error handling rmrk transfer nft', e);

    return {
      error: true,
      balanceError: false
    };
  }
}

export async function uniqueTransferHandler (networkKey: string, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, senderAddress: string, recipientAddress: string, params: Record<string, any>, chainInfo: _ChainInfo) {
  const { decimals, symbol } = _getChainNativeTokenBasicInfo(chainInfo);

  try {
    const apiProp = substrateApiMap[networkKey];
    const itemId = params.itemId as number;
    const collectionId = params.collectionId as number;

    const [info, balance] = await Promise.all([
      apiProp.api.tx.nft.transfer({ Substrate: recipientAddress }, collectionId, itemId, 1).paymentInfo(senderAddress), // 1 is amount
      getFreeBalance(networkKey, senderAddress, substrateApiMap, evmApiMap)
    ]);

    const binaryBalance = new BN(balance);
    const balanceError = info.partialFee.gt(binaryBalance);

    const feeString = parseNumberToDisplay(info.partialFee, decimals) + ` ${symbol}`;

    return {
      error: false,
      estimatedFee: feeString,
      balanceError
    } as SubstrateNftTransaction;
  } catch (e) {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    if (e.toString().includes('Error: createType(RuntimeDispatchInfo):: Struct: failed on weight: u64:: Assertion failed')) {
      return {
        error: false,
        estimatedFee: `0.0000 ${symbol}`,
        balanceError: false
      } as SubstrateNftTransaction;
    }

    console.error('error handling unique transfer nft', e);

    return {
      error: true,
      balanceError: false
    };
  }
}

export async function quartzTransferHandler (networkKey: string, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, senderAddress: string, recipientAddress: string, params: Record<string, any>, chainInfo: _ChainInfo) {
  const { decimals, symbol } = _getChainNativeTokenBasicInfo(chainInfo);

  try {
    const apiProp = substrateApiMap[networkKey];
    const itemId = params.itemId as number;
    const collectionId = params.collectionId as number;

    const [info, balance] = await Promise.all([
      apiProp.api.tx.unique.transfer({ Substrate: recipientAddress }, collectionId, itemId, 1).paymentInfo(senderAddress),
      getFreeBalance(networkKey, senderAddress, substrateApiMap, evmApiMap)
    ]);

    const binaryBalance = new BN(balance);
    const balanceError = info.partialFee.gt(binaryBalance);

    const feeString = parseNumberToDisplay(info.partialFee, decimals) + ` ${symbol}`;

    return {
      error: false,
      estimatedFee: feeString,
      balanceError
    } as SubstrateNftTransaction;
  } catch (e) {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    if (e.toString().includes('Error: createType(RuntimeDispatchInfo):: Struct: failed on weight: u64:: Assertion failed')) {
      return {
        error: false,
        estimatedFee: `0.0000 ${symbol}`,
        balanceError: false
      } as SubstrateNftTransaction;
    }

    console.error('error handling quartz transfer nft', e);

    return {
      error: true,
      balanceError: false
    };
  }
}

export async function statemineTransferHandler (networkKey: string, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, senderAddress: string, recipientAddress: string, params: Record<string, any>, chainInfo: _ChainInfo) {
  const { decimals, symbol } = _getChainNativeTokenBasicInfo(chainInfo);

  try {
    const apiProp = substrateApiMap[networkKey];
    const itemId = params.itemId as number;
    const collectionId = params.collectionId as number;

    const [info, balance] = await Promise.all([
      apiProp.api.tx.uniques.transfer(collectionId, itemId, recipientAddress).paymentInfo(senderAddress),
      getFreeBalance(networkKey, senderAddress, substrateApiMap, evmApiMap)
    ]);

    const binaryBalance = new BN(balance);
    const balanceError = info.partialFee.gt(binaryBalance);

    const feeString = parseNumberToDisplay(info.partialFee, decimals) + ` ${symbol}`;

    return {
      error: false,
      estimatedFee: feeString,
      balanceError
    } as SubstrateNftTransaction;
  } catch (e) {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    if (e.toString().includes('Error: createType(RuntimeDispatchInfo):: Struct: failed on weight: u64:: Assertion failed')) {
      return {
        error: false,
        estimatedFee: `0.0000 ${symbol}`,
        balanceError: false
      } as SubstrateNftTransaction;
    }

    console.error('error handling statemine transfer nft', e);

    return {
      error: true,
      balanceError: false
    };
  }
}

export function isRecipientSelf (currentAddress: string, recipientAddress: string) {
  return reformatAddress(currentAddress, 1) === reformatAddress(recipientAddress, 1);
}

export function acalaGetExtrinsic (apiProp: _SubstrateApi, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const itemId = params.itemId as number;
    const collectionId = params.collectionId as number;

    return apiProp.api.tx.nft.transfer(recipientAddress, [collectionId, itemId]);
  } catch (e) {
    console.error('error handling acala transfer nft', e);

    return null;
  }
}

export function rmrkGetExtrinsic (apiProp: _SubstrateApi, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const remark = params.remark as string;

    if (!remark) {
      return null;
    }

    const parsedRemark = remark.concat(recipientAddress.replace(
      /\\s/g,
      ''
    ));

    return apiProp.api.tx.system.remark(parsedRemark);
  } catch (e) {
    console.error('error handling rmrk transfer nft', e);

    return null;
  }
}

export function uniqueGetExtrinsic (apiProp: _SubstrateApi, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const itemId = params.itemId as number;
    const collectionId = params.collectionId as number;

    return apiProp.api.tx.nft.transfer({ Substrate: recipientAddress }, collectionId, itemId, 1);
  } catch (e) {
    console.error('error handling unique transfer nft', e);

    return null;
  }
}

export function quartzGetExtrinsic (apiProp: _SubstrateApi, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const itemId = params.itemId as number;
    const collectionId = params.collectionId as number;

    return apiProp.api.tx.unique.transfer({ Substrate: recipientAddress }, collectionId, itemId, 1);
  } catch (e) {
    console.error('error handling quartz transfer nft', e);

    return null;
  }
}

export function statemineGetExtrinsic (apiProp: _SubstrateApi, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  try {
    const itemId = params.itemId as number;
    const collectionId = params.collectionId as number;

    return apiProp.api.tx.uniques.transfer(collectionId, itemId, recipientAddress);
  } catch (e) {
    console.error('error handling statemine transfer nft', e);

    return null;
  }
}

export function getNftTransferExtrinsic (networkKey: string, apiProp: _SubstrateApi, senderAddress: string, recipientAddress: string, params: Record<string, any>) {
  switch (networkKey) {
    case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.acala:
      return acalaGetExtrinsic(apiProp, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.karura:
      return acalaGetExtrinsic(apiProp, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.kusama:
      return rmrkGetExtrinsic(apiProp, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.uniqueNft:
      return uniqueGetExtrinsic(apiProp, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.quartz:
      return quartzGetExtrinsic(apiProp, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.opal:
      return quartzGetExtrinsic(apiProp, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.statemine:
      return statemineGetExtrinsic(apiProp, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.statemint:
      return statemineGetExtrinsic(apiProp, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.bitcountry:
      return acalaGetExtrinsic(apiProp, senderAddress, recipientAddress, params);
    case SUPPORTED_TRANSFER_SUBSTRATE_CHAIN_NAME.pioneer:
      return acalaGetExtrinsic(apiProp, senderAddress, recipientAddress, params);
  }

  return null;
}
