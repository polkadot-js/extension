// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { ExtrinsicType, TransactionHistoryItem } from '@subwallet/extension-base/background/KoniTypes';
import { _getAssetDecimals, _getAssetSymbol, _getChainNativeTokenBasicInfo } from '@subwallet/extension-base/services/chain-service/utils';

import { EventRecord } from '@polkadot/types/interfaces';

export function parseXcmEventLogs (historyItem: Partial<TransactionHistoryItem>, eventLogs: EventRecord[], chain: string, sendingTokenInfo: _ChainAsset, chainInfo: _ChainInfo) {
  for (let index = 0; index < eventLogs.length; index++) {
    const record = eventLogs[index];
    const { decimals: nativeDecimals, symbol: nativeSymbol } = _getChainNativeTokenBasicInfo(chainInfo);

    if (record.event.section === 'balances' && record.event.method.toLowerCase() === 'withdraw') {
      if (record.event.data[1]?.toString()) {
        historyItem.fee = {
          value: record.event.data[1]?.toString(),
          symbol: nativeSymbol,
          decimals: nativeDecimals
        };
      }
    } else if (record.event.section === 'tokens' && record.event.method.toLowerCase() === 'withdrawn') {
      if (!historyItem.fee && record.event.data[2]?.toString()) {
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
  for (let index = 0; index < eventLogs.length; index++) {
    const record = eventLogs[index];

    if (['genshiro_testnet', 'genshiro', 'equilibrium_parachain'].includes(chain) && sendingTokenInfo) {
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

    if (record.event.section === 'balances' &&
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

export function parseLiquidStakingEvents (historyItem: Partial<TransactionHistoryItem>, eventLogs: EventRecord[], inputTokenInfo: _ChainAsset, chainInfo: _ChainInfo, feePaidWithInputAsset: boolean, extrinsicType: ExtrinsicType) {
  if (feePaidWithInputAsset) {
    historyItem.fee = {
      value: '0', // TODO
      symbol: _getAssetSymbol(inputTokenInfo),
      decimals: _getAssetDecimals(inputTokenInfo)
    };
  } else {
    for (let index = 0; index < eventLogs.length; index++) {
      const record = eventLogs[index];

      const { decimals: nativeDecimals, symbol: nativeSymbol } = _getChainNativeTokenBasicInfo(chainInfo);

      const eventMethod = extrinsicType === ExtrinsicType.MINT_VDOT ? 'deposit' : 'withdraw';

      if (record.event.section === 'balances' &&
        record.event.method.toLowerCase() === eventMethod) {
        if (record.event.data[2]?.toString()) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          historyItem.fee = {
            value: record.event.data[2]?.toString() || '0',
            symbol: nativeSymbol,
            decimals: nativeDecimals
          };
        }
      }
    }
  }
}

export function parseLiquidStakingFastUnstakeEvents (historyItem: Partial<TransactionHistoryItem>, eventLogs: EventRecord[], chainInfo: _ChainInfo, extrinsicType: ExtrinsicType) {
  for (let index = 0; index < eventLogs.length; index++) {
    const record = eventLogs[index];

    const { decimals: nativeDecimals, symbol: nativeSymbol } = _getChainNativeTokenBasicInfo(chainInfo);

    const section = extrinsicType === ExtrinsicType.REDEEM_QDOT ? 'balances' : 'tokens';
    const eventMethod = extrinsicType === ExtrinsicType.REDEEM_QDOT ? 'withdrawn' : 'withdraw';

    if (record.event.section === section &&
      record.event.method.toLowerCase() === eventMethod) {
      if (record.event.data[2]?.toString()) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        historyItem.fee = {
          value: record.event.data[2]?.toString() || '0',
          symbol: nativeSymbol,
          decimals: nativeDecimals
        };
      }
    }
  }
}
