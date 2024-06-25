// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { ChainType, ExtrinsicStatus, ExtrinsicType, TransactionDirection, TransactionHistoryItem } from '@subwallet/extension-base/background/KoniTypes';
import { getExtrinsicParserKey, subscanExtrinsicParserMap, supportedExtrinsicParser } from '@subwallet/extension-base/services/history-service/helpers/subscan-extrinsic-parser-helper';
import { ExtrinsicItem, TransferItem } from '@subwallet/extension-base/services/subscan-service/types';
import { isSameAddress } from '@subwallet/extension-base/utils';

import { decodeAddress, encodeAddress, isEthereumAddress } from '@polkadot/util-crypto';

function autoFormatAddress (address: string): string {
  try {
    if (isEthereumAddress(address)) {
      return address;
    } else {
      const decoded = decodeAddress(address);

      return encodeAddress(decoded, 42);
    }
  } catch (e) {
    return '';
  }
}

export function parseSubscanExtrinsicData (address: string, extrinsicItem: ExtrinsicItem, chainInfo: _ChainInfo): TransactionHistoryItem | null {
  const extrinsicParserKey = getExtrinsicParserKey(extrinsicItem);

  if (!supportedExtrinsicParser.includes(extrinsicParserKey)) {
    return null;
  }

  const chainType = chainInfo.substrateInfo ? ChainType.SUBSTRATE : ChainType.EVM;
  const nativeDecimals = chainInfo.substrateInfo?.decimals || chainInfo.evmInfo?.decimals || 18;
  const nativeSymbol = chainInfo.substrateInfo?.symbol || chainInfo.evmInfo?.symbol || '';

  const initData: TransactionHistoryItem = {
    address,
    origin: 'subscan',
    time: extrinsicItem.block_timestamp * 1000,
    chainType,
    from: address,
    signature: extrinsicItem.signature,
    fromName: undefined,
    direction: TransactionDirection.SEND,
    blockNumber: extrinsicItem.block_num,
    blockHash: '',
    chain: chainInfo.slug,
    type: ExtrinsicType.UNKNOWN,
    to: '',
    toName: undefined,
    extrinsicHash: extrinsicItem.extrinsic_hash,
    amount: {
      value: '0',
      decimals: nativeDecimals,
      symbol: nativeSymbol
    },
    data: extrinsicItem.params,
    fee: {
      value: extrinsicItem.fee,
      decimals: nativeDecimals,
      symbol: nativeSymbol
    },
    status: extrinsicItem.success ? ExtrinsicStatus.SUCCESS : ExtrinsicStatus.FAIL,
    nonce: extrinsicItem.nonce
  };

  try {
    return subscanExtrinsicParserMap[extrinsicParserKey](initData);
  } catch (e) {
    console.log('parseSubscanExtrinsicData error:', e, initData);

    return null;
  }
}

export function parseSubscanTransferData (address: string, transferItem: TransferItem, chainInfo: _ChainInfo): TransactionHistoryItem | null {
  const chainType = chainInfo.substrateInfo ? ChainType.SUBSTRATE : ChainType.EVM;
  const nativeDecimals = chainInfo.substrateInfo?.decimals || chainInfo.evmInfo?.decimals || 18;
  const nativeSymbol = chainInfo.substrateInfo?.symbol || chainInfo.evmInfo?.symbol || '';
  const from = autoFormatAddress(transferItem.from);
  const to = autoFormatAddress(transferItem.to);

  if (!transferItem.from_account_display || !transferItem.to_account_display) {
    return null;
  }

  return {
    address,
    origin: 'subscan',
    time: transferItem.block_timestamp * 1000,
    chainType,
    from,
    fromName: transferItem.from_account_display.display || transferItem.from_account_display.address,
    direction: isSameAddress(address, from) ? TransactionDirection.SEND : TransactionDirection.RECEIVED,
    blockNumber: transferItem.block_num,
    blockHash: '',
    chain: chainInfo.slug,
    type: ExtrinsicType.TRANSFER_BALANCE,
    to,
    toName: transferItem.to_account_display.display || transferItem.to_account_display.address,
    extrinsicHash: transferItem.hash,
    amount: {
      value: transferItem.amount,
      decimals: 0,
      symbol: transferItem.asset_type === 'nfts' ? 'NFT' : transferItem.asset_symbol
    },
    fee: {
      value: transferItem.fee,
      decimals: nativeDecimals,
      symbol: nativeSymbol
    },
    status: transferItem.success ? ExtrinsicStatus.SUCCESS : ExtrinsicStatus.FAIL,
    nonce: transferItem.nonce
  };
}
