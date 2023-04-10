// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { TransactionHistoryItem } from '@subwallet/extension-base/background/KoniTypes';
import { _getAssetDecimals, _getChainNativeTokenBasicInfo, _isNativeToken } from '@subwallet/extension-base/services/chain-service/utils';

import { EventRecord } from '@polkadot/types/interfaces';

export function parseXcmEventLogs (historyItem: Partial<TransactionHistoryItem>, eventLogs: EventRecord[], chain: string, sendingTokenInfo: _ChainAsset, chainInfo: _ChainInfo) {
  let isFeeUseMainTokenSymbol = true;

  for (let index = 0; index < eventLogs.length; index++) {
    const record = eventLogs[index];

    if (['karura', 'acala', 'acala_testnet'].includes(chain) && sendingTokenInfo && !_isNativeToken(sendingTokenInfo)) {
      if (record.event.section === 'currencies' &&
        record.event.method.toLowerCase() === 'transferred') {
        if (index === 0) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          historyItem.fee = {
            value: record.event.data[3]?.toString() || '0',
            symbol: sendingTokenInfo.symbol,
            decimals: _getAssetDecimals(sendingTokenInfo)
          };

          isFeeUseMainTokenSymbol = false;
        }
      }
    }

    const { decimals: nativeDecimals, symbol: nativeSymbol } = _getChainNativeTokenBasicInfo(chainInfo);

    if (isFeeUseMainTokenSymbol && record.event.section === 'balances' && record.event.method.toLowerCase() === 'withdraw') {
      if (record.event.data[1]?.toString()) {
        historyItem.fee = {
          value: record.event.data[1]?.toString(),
          symbol: nativeSymbol,
          decimals: nativeDecimals
        };
      }
    } else if (isFeeUseMainTokenSymbol && record.event.section === 'tokens' && record.event.method.toLowerCase() === 'withdrawn') {
      if (record.event.data[2]?.toString()) {
        historyItem.fee = {
          value: record.event.data[2]?.toString(),
          symbol: nativeSymbol,
          decimals: nativeDecimals
        };
      }
    }
  }
}

export function parseTransferEventLogs (historyItem: Partial<TransactionHistoryItem>, eventLogs: EventRecord[], chain: string, sendingTokenInfo: _ChainAsset, chainInfo: _ChainInfo) {
  let isFeeUseMainTokenSymbol = true;

  for (let index = 0; index < eventLogs.length; index++) {
    const record = eventLogs[index];

    if (['karura', 'acala', 'acala_testnet'].includes(chain) && !_isNativeToken(sendingTokenInfo)) {
      if (record.event.section === 'currencies' &&
        record.event.method.toLowerCase() === 'transferred') {
        if (index === 0) {
          historyItem.fee = {
            value: record.event.data[3]?.toString() || '0',
            symbol: sendingTokenInfo.symbol,
            decimals: _getAssetDecimals(sendingTokenInfo)
          };

          isFeeUseMainTokenSymbol = false;
        }
      }
    } else if (['genshiro_testnet', 'genshiro', 'equilibrium_parachain'].includes(chain) && sendingTokenInfo) {
      if (record.event.section === 'transactionPayment' &&
        record.event.method.toLowerCase() === 'transactionfeepaid') {
        if (record.event.data[1]?.toString()) {
          historyItem.fee = {
            value: record.event.data[1]?.toString() || '0',
            symbol: sendingTokenInfo.symbol,
            decimals: _getAssetDecimals(sendingTokenInfo)
          };
        }
      }
    }

    const { decimals: nativeDecimals, symbol: nativeSymbol } = _getChainNativeTokenBasicInfo(chainInfo);

    if (isFeeUseMainTokenSymbol && record.event.section === 'balances' &&
      record.event.method.toLowerCase() === 'withdraw') {
      if (record.event.data[1]?.toString()) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        historyItem.fee = {
          value: record.event.data[1]?.toString() || '0',
          symbol: nativeSymbol,
          decimals: nativeDecimals
        };
      }
    }
  }
}
