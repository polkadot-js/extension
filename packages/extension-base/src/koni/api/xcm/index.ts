// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { TransactionResponse } from '@subwallet/extension-base/background/KoniTypes';
import { astarGetXcmExtrinsic } from '@subwallet/extension-base/koni/api/xcm/astar';
import { moonbeamGetXcmExtrinsic } from '@subwallet/extension-base/koni/api/xcm/moonbeamXcm';
import { statemintGetXcmExtrinsic } from '@subwallet/extension-base/koni/api/xcm/statemintXcm';
import { substrateGetXcmExtrinsic } from '@subwallet/extension-base/koni/api/xcm/substrateXcm';
import { _XCM_CHAIN_GROUP } from '@subwallet/extension-base/services/chain-service/constants';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _isNativeToken } from '@subwallet/extension-base/services/chain-service/utils';

import { SubmittableExtrinsic } from '@polkadot/api/types';
import { EventRecord } from '@polkadot/types/interfaces';

interface CreateXcmExtrinsicProps {
  originTokenInfo: _ChainAsset;
  destinationTokenInfo: _ChainAsset;
  recipient: string;
  sendingValue: string;

  substrateApiMap: Record<string, _SubstrateApi>;
  chainInfoMap: Record<string, _ChainInfo>;
}

export const createXcmExtrinsic = async ({ chainInfoMap,
  destinationTokenInfo,
  originTokenInfo,
  recipient,
  sendingValue,
  substrateApiMap }: CreateXcmExtrinsicProps): Promise<SubmittableExtrinsic<'promise'>> => {
  const originNetworkKey = originTokenInfo.originChain;
  const destinationNetworkKey = destinationTokenInfo.originChain;

  const substrateApi = await substrateApiMap[originNetworkKey].isReady;
  const api = substrateApi.api;

  let extrinsic;

  if (_XCM_CHAIN_GROUP.moonbeam.includes(originNetworkKey)) {
    extrinsic = moonbeamGetXcmExtrinsic(originNetworkKey, destinationNetworkKey, recipient, sendingValue, api, originTokenInfo, chainInfoMap);
  } else if (_XCM_CHAIN_GROUP.astar.includes(originNetworkKey)) {
    extrinsic = astarGetXcmExtrinsic(originNetworkKey, destinationNetworkKey, recipient, sendingValue, api, originTokenInfo, chainInfoMap);
  } else if (_XCM_CHAIN_GROUP.statemine.includes(originNetworkKey)) {
    extrinsic = statemintGetXcmExtrinsic(originNetworkKey, destinationNetworkKey, recipient, sendingValue, api, originTokenInfo, chainInfoMap);
  } else {
    extrinsic = substrateGetXcmExtrinsic(originNetworkKey, destinationNetworkKey, recipient, sendingValue, api, originTokenInfo, chainInfoMap);
  }

  return extrinsic;
};

// TODO: add + refine logic for more chains
export function updateXcmResponseTxResult (
  networkKey: string,
  tokenInfo: _ChainAsset,
  response: TransactionResponse,
  records: EventRecord[]
) {
  if (!response.txResult) {
    response.txResult = { change: '0' };
  }

  let isFeeUseMainTokenSymbol = true;

  for (let index = 0; index < records.length; index++) {
    const record = records[index];

    if (_XCM_CHAIN_GROUP.acala.includes(networkKey) && !_isNativeToken(tokenInfo)) {
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

      if (record.event.section === 'tokens' &&
        record.event.method.toLowerCase() === 'withdrawn') {
        response.txResult.change = record.event.data[2]?.toString() || '0';
        response.txResult.changeSymbol = tokenInfo.symbol;
      }
    } else if (_XCM_CHAIN_GROUP.kintsugi.includes(networkKey) && !_isNativeToken(tokenInfo)) {
      if (record.event.section === 'tokens' &&
        record.event.method.toLowerCase() === 'transfer') {
        response.txResult.change = record.event.data[3]?.toString() || '0';
        response.txResult.changeSymbol = tokenInfo.symbol;
      }
    } else if (_XCM_CHAIN_GROUP.genshiro.includes(networkKey) && !_isNativeToken(tokenInfo)) {
      if (record.event.section === 'eqBalances' &&
        record.event.method.toLowerCase() === 'transfer') {
        response.txResult.change = record.event.data[3]?.toString() || '0';
        response.txResult.changeSymbol = tokenInfo.symbol;
      }
    } else if (_XCM_CHAIN_GROUP.bifrost.includes(networkKey) && !_isNativeToken(tokenInfo)) {
      if (record.event.section === 'tokens' &&
        record.event.method.toLowerCase() === 'withdrawn') {
        response.txResult.change = record.event.data[2]?.toString() || '0';
        response.txResult.changeSymbol = tokenInfo.symbol;
      } else if (record.event.section === 'balances' &&
        record.event.method.toLowerCase() === 'transfer') {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        response.txResult.change = record.event.data[2]?.toString() || '0';
        response.txResult.changeSymbol = tokenInfo.symbol;
      }
    } else if (_XCM_CHAIN_GROUP.astar.includes(networkKey) && !_isNativeToken(tokenInfo)) {
      if (record.event.section === 'assets' &&
        record.event.method.toLowerCase() === 'burned') {
        response.txResult.change = record.event.data[2]?.toString() || '0';
        response.txResult.changeSymbol = tokenInfo.symbol;
      }
    } else if (_XCM_CHAIN_GROUP.moonbeam.includes(networkKey) && !_isNativeToken(tokenInfo)) {
      if (record.event.section === 'assets' &&
        record.event.method.toLowerCase() === 'burned') {
        response.txResult.change = record.event.data[2]?.toString() || '0';
        response.txResult.changeSymbol = tokenInfo.symbol;
      }
    } else if (_XCM_CHAIN_GROUP.statemine.includes(networkKey)) {
      if (!_isNativeToken(tokenInfo)) {
        if (record.event.section === 'assets' &&
          record.event.method.toLowerCase() === 'transferred') {
          response.txResult.change = record.event.data[3]?.toString() || '0';
          response.txResult.changeSymbol = tokenInfo.symbol;
        }
      } else {
        if (record.event.section === 'balances' &&
          record.event.method.toLowerCase() === 'withdraw') {
          response.txResult.change = record.event.data[1]?.toString() || '0';
          response.txResult.changeSymbol = tokenInfo.symbol;
        }
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

    if (isFeeUseMainTokenSymbol && record.event.section === 'balances' && record.event.method.toLowerCase() === 'withdraw') {
      if (!response.txResult.fee) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        response.txResult.fee = record.event.data[1]?.toString() || '0';
      }
    } else if (isFeeUseMainTokenSymbol && record.event.section === 'tokens' && record.event.method.toLowerCase() === 'withdrawn') {
      if (!response.txResult.fee) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        response.txResult.fee = record.event.data[2]?.toString() || '0';
      }
    }
  }
}
