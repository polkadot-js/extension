// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _AssetRef, _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { TransactionResponse } from '@subwallet/extension-base/background/KoniTypes';
import { _XCM_CHAIN_GROUP } from '@subwallet/extension-base/services/chain-service/constants';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _isNativeToken, _isXcmPathSupported } from '@subwallet/extension-base/services/chain-service/utils';
import { getUnsupportedResponse } from '@subwallet/extension-koni-base/api/dotsama/transfer';
import { astarEstimateCrossChainFee, astarGetXcmExtrinsic } from '@subwallet/extension-koni-base/api/xcm/astar';
import { moonbeamEstimateCrossChainFee, moonbeamGetXcmExtrinsic } from '@subwallet/extension-koni-base/api/xcm/moonbeamXcm';
import { statemintEstimateCrossChainFee, statemintGetXcmExtrinsic } from '@subwallet/extension-koni-base/api/xcm/statemintXcm';
import { substrateEstimateCrossChainFee, substrateGetXcmExtrinsic } from '@subwallet/extension-koni-base/api/xcm/substrateXcm';
import { KeyringPair } from '@subwallet/keyring/types';

import { SubmittableExtrinsic } from '@polkadot/api/types';
import { EventRecord } from '@polkadot/types/interfaces';

export async function estimateCrossChainFee (
  sender: KeyringPair,
  recipient: string,
  sendingValue: string,
  originTokenInfo: _ChainAsset,
  destinationTokenInfo: _ChainAsset,
  chainInfoMap: Record<string, _ChainInfo>,
  substrateApiMap: Record<string, _SubstrateApi>,
  assetRefMap: Record<string, _AssetRef>
): Promise<[string, string | undefined]> {
  if (!_isXcmPathSupported(originTokenInfo.slug, destinationTokenInfo.slug, assetRefMap)) {
    console.log('Unsupported xcm');

    return ['0', ''];
  }

  const originNetworkKey = originTokenInfo.originChain;
  const destinationNetworkKey = destinationTokenInfo.originChain;

  if (_XCM_CHAIN_GROUP.moonbeam.includes(originNetworkKey)) {
    return moonbeamEstimateCrossChainFee(originNetworkKey, destinationNetworkKey, recipient, sender, sendingValue, substrateApiMap, originTokenInfo, chainInfoMap);
  }

  if (_XCM_CHAIN_GROUP.astar.includes(originNetworkKey)) {
    return astarEstimateCrossChainFee(originNetworkKey, destinationNetworkKey, recipient, sender, sendingValue, substrateApiMap, originTokenInfo, chainInfoMap);
  }

  if (_XCM_CHAIN_GROUP.statemine.includes(originNetworkKey)) {
    return statemintEstimateCrossChainFee(originNetworkKey, destinationNetworkKey, recipient, sender, sendingValue, substrateApiMap, originTokenInfo, chainInfoMap);
  }

  return substrateEstimateCrossChainFee(originNetworkKey, destinationNetworkKey, recipient, sender, sendingValue, substrateApiMap, originTokenInfo, chainInfoMap);
}

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

interface MakeCrossChainTransferProps {
  originTokenInfo: _ChainAsset;
  destinationTokenInfo: _ChainAsset;
  recipient: string;
  sender: KeyringPair;
  sendingValue: string;
  substrateApiMap: Record<string, _SubstrateApi>;
  chainInfoMap: Record<string, _ChainInfo>;
  assetRefMap: Record<string, _AssetRef>;
  callback: (data: TransactionResponse) => void;
}

export async function makeCrossChainTransfer ({ assetRefMap,
  callback,
  chainInfoMap,
  destinationTokenInfo,
  originTokenInfo,
  recipient,
  sender,
  sendingValue,
  substrateApiMap }: MakeCrossChainTransferProps): Promise<void> {
  const txState: TransactionResponse = {};

  const originNetworkKey = originTokenInfo.originChain;

  if (!_isXcmPathSupported(originTokenInfo.slug, destinationTokenInfo.slug, assetRefMap)) {
    callback(getUnsupportedResponse());

    return;
  }

  const substrateApi = await substrateApiMap[originNetworkKey].isReady;

  const extrinsic = await createXcmExtrinsic({
    destinationTokenInfo,
    originTokenInfo,
    sendingValue: sendingValue,
    recipient: recipient,
    chainInfoMap: chainInfoMap,
    substrateApiMap: substrateApiMap
  });

  const updateResponseTxResult = (response: TransactionResponse, records: EventRecord[]) => {
    updateXcmResponseTxResult(originNetworkKey, originTokenInfo, response, records);
  };

  // Todo: Handle EVM Transaction Here
  // await signAndSendExtrinsic({
  //   type: SignerType.PASSWORD,
  //   substrateApi: substrateApi,
  //   callback: callback,
  //   extrinsic: extrinsic,
  //   txState: txState,
  //   address: sender.address,
  //   updateResponseTxResult: updateResponseTxResult,
  //   errorMessage: 'error xcm transfer'
  // });
}

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
