// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { TransactionHistoryItem } from '@subwallet/extension-base/background/KoniTypes';
import { _getAssetDecimals, _getChainNativeTokenBasicInfo, _isNativeToken } from '@subwallet/extension-base/services/chain-service/utils';

import { EventRecord } from '@polkadot/types/interfaces';

export function parseXcmEventLogs (historyItem: TransactionHistoryItem, eventLogs: EventRecord[], chain: string, sendingTokenInfo: _ChainAsset, chainInfo: _ChainInfo) {
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
        } else {
          historyItem.amount = {
            value: record.event.data[3]?.toString() || '0',
            symbol: sendingTokenInfo.symbol,
            decimals: _getAssetDecimals(sendingTokenInfo)
          };
        }
      }

      if (record.event.section === 'tokens' &&
        record.event.method.toLowerCase() === 'withdrawn') {
        historyItem.amount = {
          value: record.event.data[2]?.toString() || '0',
          symbol: sendingTokenInfo.symbol,
          decimals: _getAssetDecimals(sendingTokenInfo)
        };
      }
    } else if (['kintsugi', 'kintsugi_test', 'interlay'].includes(chain) && sendingTokenInfo) {
      if (record.event.section === 'tokens' &&
        record.event.method.toLowerCase() === 'transfer') {
        historyItem.amount = {
          value: record.event.data[3]?.toString() || '0',
          symbol: sendingTokenInfo.symbol,
          decimals: _getAssetDecimals(sendingTokenInfo)
        };
      }
    } else if (['genshiro_testnet', 'genshiro', 'equilibrium_parachain'].includes(chain) && sendingTokenInfo) {
      if (record.event.section === 'eqBalances' &&
        record.event.method.toLowerCase() === 'transfer') {
        historyItem.amount = {
          value: record.event.data[3]?.toString() || '0',
          symbol: sendingTokenInfo.symbol,
          decimals: _getAssetDecimals(sendingTokenInfo)
        };
      }
    } else if (['bifrost'].includes(chain) && sendingTokenInfo) {
      if (record.event.section === 'tokens' &&
        record.event.method.toLowerCase() === 'withdrawn') {
        historyItem.amount = {
          value: record.event.data[2]?.toString() || '0',
          symbol: sendingTokenInfo.symbol,
          decimals: _getAssetDecimals(sendingTokenInfo)
        };
      } else if (record.event.section === 'balances' &&
        record.event.method.toLowerCase() === 'transfer') {
        historyItem.amount = {
          value: record.event.data[2]?.toString() || '0',
          symbol: sendingTokenInfo.symbol,
          decimals: _getAssetDecimals(sendingTokenInfo)
        };
      }
    } else if (['astar', 'shiden'].includes(chain) && sendingTokenInfo) {
      if (record.event.section === 'assets' &&
        record.event.method.toLowerCase() === 'burned') {
        historyItem.amount = {
          value: record.event.data[2]?.toString() || '0',
          symbol: sendingTokenInfo.symbol,
          decimals: _getAssetDecimals(sendingTokenInfo)
        };
      }
    } else if (['moonbeam', 'moonriver'].includes(chain) && sendingTokenInfo) {
      if (record.event.section === 'assets' &&
        record.event.method.toLowerCase() === 'burned') {
        historyItem.amount = {
          value: record.event.data[2]?.toString() || '0',
          symbol: sendingTokenInfo.symbol,
          decimals: _getAssetDecimals(sendingTokenInfo)
        };
      }
    } else if (['statemint', 'statemine'].includes(chain)) {
      if (!_isNativeToken(sendingTokenInfo)) {
        if (record.event.section === 'assets' &&
          record.event.method.toLowerCase() === 'transferred') {
          historyItem.amount = {
            value: record.event.data[3]?.toString() || '0',
            symbol: sendingTokenInfo.symbol,
            decimals: _getAssetDecimals(sendingTokenInfo)
          };
        }
      } else {
        if (record.event.section === 'balances' &&
          record.event.method.toLowerCase() === 'withdraw') {
          historyItem.amount = {
            value: record.event.data[1]?.toString() || '0',
            symbol: sendingTokenInfo.symbol,
            decimals: _getAssetDecimals(sendingTokenInfo)
          };
        }
      }
    } else {
      if (record.event.section === 'balances' &&
        record.event.method.toLowerCase() === 'transfer') {
        historyItem.amount = {
          value: record.event.data[2]?.toString() || '0',
          symbol: sendingTokenInfo.symbol,
          decimals: _getAssetDecimals(sendingTokenInfo)
        };
      } else if (record.event.section === 'xTokens' &&
        record.event.method.toLowerCase() === 'transferred') {
        historyItem.amount = {
          value: record.event.data[2]?.toString() || '0',
          symbol: sendingTokenInfo.symbol,
          decimals: _getAssetDecimals(sendingTokenInfo)
        };
      }
    }

    const { decimals: nativeDecimals, symbol: nativeSymbol } = _getChainNativeTokenBasicInfo(chainInfo);

    if (isFeeUseMainTokenSymbol && record.event.section === 'balances' && record.event.method.toLowerCase() === 'withdraw') {
      if (!historyItem.fee) {
        historyItem.fee = {
          value: record.event.data[1]?.toString() || '0',
          symbol: nativeSymbol,
          decimals: nativeDecimals
        };
      }
    } else if (isFeeUseMainTokenSymbol && record.event.section === 'tokens' && record.event.method.toLowerCase() === 'withdrawn') {
      if (!historyItem.fee) {
        historyItem.fee = {
          value: record.event.data[2]?.toString() || '0',
          symbol: nativeSymbol,
          decimals: nativeDecimals
        };
      }
    }
  }
}

export function parseTransferEventLogs (historyItem: TransactionHistoryItem, eventLogs: EventRecord[], chain: string, sendingTokenInfo: _ChainAsset, chainInfo: _ChainInfo) {
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
        } else {
          historyItem.amount = {
            value: record.event.data[3]?.toString() || '0',
            symbol: sendingTokenInfo.symbol,
            decimals: _getAssetDecimals(sendingTokenInfo)
          };
        }
      }
    } else if (['kintsugi', 'kintsugi_test', 'interlay'].includes(chain) && sendingTokenInfo) {
      if (record.event.section === 'tokens' &&
        record.event.method.toLowerCase() === 'transfer') {
        historyItem.amount = {
          value: record.event.data[3]?.toString() || '0',
          symbol: sendingTokenInfo.symbol,
          decimals: _getAssetDecimals(sendingTokenInfo)
        };
      }
    } else if (['genshiro_testnet', 'genshiro', 'equilibrium_parachain'].includes(chain) && sendingTokenInfo) {
      if (record.event.section === 'eqBalances' &&
        record.event.method.toLowerCase() === 'transfer') {
        historyItem.amount = {
          value: record.event.data[3]?.toString() || '0',
          symbol: sendingTokenInfo.symbol,
          decimals: _getAssetDecimals(sendingTokenInfo)
        };
      } else if (record.event.section === 'transactionPayment' &&
        record.event.method.toLowerCase() === 'transactionfeepaid') {
        historyItem.fee = {
          value: record.event.data[1]?.toString() || '0',
          symbol: sendingTokenInfo.symbol,
          decimals: _getAssetDecimals(sendingTokenInfo)
        };
      }
    } else if (['pioneer', 'bitcountry'].includes(chain) && sendingTokenInfo && !_isNativeToken(sendingTokenInfo)) {
      if (record.event.section === 'tokens' &&
        record.event.method.toLowerCase() === 'transfer') {
        historyItem.amount = {
          value: record.event.data[3]?.toString() || '0',
          symbol: sendingTokenInfo.symbol,
          decimals: _getAssetDecimals(sendingTokenInfo)
        };
      }
    } else if (['statemint', 'statemine'].includes(chain) && sendingTokenInfo && !_isNativeToken(sendingTokenInfo)) {
      if (record.event.section === 'assets' &&
        record.event.method.toLowerCase() === 'transferred') {
        historyItem.amount = {
          value: record.event.data[3]?.toString() || '0',
          symbol: sendingTokenInfo.symbol,
          decimals: _getAssetDecimals(sendingTokenInfo)
        };
      }
    } else {
      if (record.event.section === 'balances' &&
        record.event.method.toLowerCase() === 'transfer') {
        historyItem.amount = {
          value: record.event.data[2]?.toString() || '0',
          symbol: sendingTokenInfo.symbol,
          decimals: _getAssetDecimals(sendingTokenInfo)
        };
      } else if (record.event.section === 'xTokens' &&
        record.event.method.toLowerCase() === 'transferred') {
        historyItem.amount = {
          value: record.event.data[2]?.toString() || '0',
          symbol: sendingTokenInfo.symbol,
          decimals: _getAssetDecimals(sendingTokenInfo)
        };
      }
    }

    const { decimals: nativeDecimals, symbol: nativeSymbol } = _getChainNativeTokenBasicInfo(chainInfo);

    if (isFeeUseMainTokenSymbol && record.event.section === 'balances' &&
      record.event.method.toLowerCase() === 'withdraw') {
      if (!historyItem.fee) {
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
