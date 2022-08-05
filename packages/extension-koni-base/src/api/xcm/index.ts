// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, NetworkJson, ResponseTransfer, TokenInfo } from '@subwallet/extension-base/background/KoniTypes';
import { doSignAndSend, getUnsupportedResponse } from '@subwallet/extension-koni-base/api/dotsama/transfer';
import { astarEstimateCrossChainFee, astarGetXcmExtrinsic } from '@subwallet/extension-koni-base/api/xcm/astar';
import { moonbeamEstimateCrossChainFee, moonbeamGetXcmExtrinsic } from '@subwallet/extension-koni-base/api/xcm/moonbeamXcm';
import { substrateEstimateCrossChainFee, substrateGetXcmExtrinsic } from '@subwallet/extension-koni-base/api/xcm/substrateXcm';
import { SupportedCrossChainsMap } from '@subwallet/extension-koni-base/api/xcm/utils';

import { SubmittableExtrinsic } from '@polkadot/api/types';
import { KeyringPair } from '@polkadot/keyring/types';
import { EventRecord } from '@polkadot/types/interfaces';

export function isNetworksPairSupportedTransferCrossChain (originNetworkKey: string, destinationNetworkKey: string, token: string, networkMap: Record<string, NetworkJson>): boolean {
  if (!SupportedCrossChainsMap[originNetworkKey] ||
    !SupportedCrossChainsMap[originNetworkKey].relationMap[destinationNetworkKey] ||
    !SupportedCrossChainsMap[originNetworkKey].relationMap[destinationNetworkKey].supportedToken.includes(token)) {
    return false;
  }

  if (SupportedCrossChainsMap[originNetworkKey].relationMap[destinationNetworkKey].type === 'p' && !(networkMap[destinationNetworkKey] && networkMap[destinationNetworkKey].paraId)) {
    return false;
  }

  return true;
}

export async function estimateCrossChainFee (
  originNetworkKey: string,
  destinationNetworkKey: string,
  to: string,
  fromKeypair: KeyringPair,
  value: string,
  dotSamaApiMap: Record<string, ApiProps>,
  tokenInfo: TokenInfo,
  networkMap: Record<string, NetworkJson>
): Promise<[string, string | undefined]> {
  if (!isNetworksPairSupportedTransferCrossChain(originNetworkKey, destinationNetworkKey, tokenInfo.symbol, networkMap)) {
    console.log('unsupported xcm');

    return ['0', ''];
  }

  if (['moonbase', 'moonriver', 'moonbeam'].includes(originNetworkKey)) {
    return moonbeamEstimateCrossChainFee(originNetworkKey, destinationNetworkKey, to, fromKeypair, value, dotSamaApiMap, tokenInfo, networkMap);
  }

  if (['astar', 'shiden'].includes(originNetworkKey)) {
    return astarEstimateCrossChainFee(originNetworkKey, destinationNetworkKey, to, fromKeypair, value, dotSamaApiMap, tokenInfo, networkMap);
  }

  return substrateEstimateCrossChainFee(originNetworkKey, destinationNetworkKey, to, fromKeypair, value, dotSamaApiMap, tokenInfo, networkMap);
}

interface CreateXcmExtrinsicProps {
  destinationNetworkKey: string;
  dotSamaApiMap: Record<string, ApiProps>;
  networkMap: Record<string, NetworkJson>;
  originNetworkKey: string;
  to: string;
  tokenInfo: TokenInfo;
  value: string;
}

export const createXcmExtrinsic = async ({ destinationNetworkKey,
  dotSamaApiMap,
  networkMap,
  originNetworkKey, to, tokenInfo, value }: CreateXcmExtrinsicProps): Promise<SubmittableExtrinsic<'promise'>> => {
  const apiProps = await dotSamaApiMap[originNetworkKey].isReady;
  const api = apiProps.api;

  let extrinsic;

  if (['moonbase', 'moonriver', 'moonbeam'].includes(originNetworkKey)) {
    extrinsic = moonbeamGetXcmExtrinsic(originNetworkKey, destinationNetworkKey, to, value, api, tokenInfo, networkMap);
  } else if (['astar', 'shiden'].includes(originNetworkKey)) {
    extrinsic = astarGetXcmExtrinsic(originNetworkKey, destinationNetworkKey, to, value, api, tokenInfo, networkMap);
  } else {
    extrinsic = substrateGetXcmExtrinsic(originNetworkKey, destinationNetworkKey, to, value, api, tokenInfo, networkMap);
  }

  return extrinsic;
};

export async function makeCrossChainTransfer (
  originNetworkKey: string,
  destinationNetworkKey: string,
  to: string,
  fromKeypair: KeyringPair,
  value: string,
  dotSamaApiMap: Record<string, ApiProps>,
  tokenInfo: TokenInfo,
  networkMap: Record<string, NetworkJson>,
  callback: (data: ResponseTransfer) => void
): Promise<void> {
  if (!isNetworksPairSupportedTransferCrossChain(originNetworkKey, destinationNetworkKey, tokenInfo.symbol, networkMap)) {
    callback(getUnsupportedResponse());

    return;
  }

  const apiProps = await dotSamaApiMap[originNetworkKey].isReady;
  const api = apiProps.api;

  const extrinsic = await createXcmExtrinsic({
    value: value,
    to: to,
    networkMap: networkMap,
    originNetworkKey: originNetworkKey,
    destinationNetworkKey: destinationNetworkKey,
    dotSamaApiMap: dotSamaApiMap,
    tokenInfo: tokenInfo
  });

  await doSignAndSend(api, originNetworkKey, tokenInfo, extrinsic, fromKeypair, updateXcmResponseTxResult, callback);
}

// TODO: add + refine logic for more chains
function updateXcmResponseTxResult (
  networkKey: string,
  tokenInfo: undefined | TokenInfo,
  response: ResponseTransfer,
  records: EventRecord[]
) {
  if (!response.txResult) {
    response.txResult = { change: '0' };
  }

  let isFeeUseMainTokenSymbol = true;

  for (let index = 0; index < records.length; index++) {
    const record = records[index];

    if (['karura', 'acala', 'acala_testnet'].includes(networkKey) && tokenInfo && !tokenInfo.isMainToken) {
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
    } else if (['kintsugi', 'kintsugi_test', 'interlay'].includes(networkKey) && tokenInfo) {
      if (record.event.section === 'tokens' &&
        record.event.method.toLowerCase() === 'transfer') {
        response.txResult.change = record.event.data[3]?.toString() || '0';
        response.txResult.changeSymbol = tokenInfo.symbol;
      }
    } else if (['genshiro_testnet', 'genshiro', 'equilibrium_parachain'].includes(networkKey) && tokenInfo) {
      if (record.event.section === 'eqBalances' &&
        record.event.method.toLowerCase() === 'transfer') {
        response.txResult.change = record.event.data[3]?.toString() || '0';
        response.txResult.changeSymbol = tokenInfo.symbol;
      }
    } else if (['astar', 'shiden'].includes(networkKey) && tokenInfo) {
      if (record.event.section === 'assets' &&
        record.event.method.toLowerCase() === 'burned') {
        response.txResult.change = record.event.data[2]?.toString() || '0';
        response.txResult.changeSymbol = tokenInfo.symbol;
      }
    } else if (['moonbeam', 'moonriver'].includes(networkKey) && tokenInfo) {
      if (record.event.section === 'assets' &&
        record.event.method.toLowerCase() === 'burned') {
        response.txResult.change = record.event.data[2]?.toString() || '0';
        response.txResult.changeSymbol = tokenInfo.symbol;
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
    }
  }
}
