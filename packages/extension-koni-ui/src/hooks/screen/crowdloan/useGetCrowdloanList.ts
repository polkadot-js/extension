// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { APIItemState, CrowdloanItem } from '@subwallet/extension-base/background/KoniTypes';
import { _getChainNativeTokenBasicInfo, _getSubstrateParaId, _getSubstrateRelayParent } from '@subwallet/extension-base/services/chain-service/utils';
import { BN_ZERO } from '@subwallet/extension-koni-ui/constants';
import { getBalanceValue, getConvertedBalanceValue } from '@subwallet/extension-koni-ui/hooks/screen/home/useAccountBalance';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { _CrowdloanItemType } from '@subwallet/extension-koni-ui/types/crowdloan';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';

function getCrowdloanChains (chainInfoMap: Record<string, _ChainInfo>) {
  const result: string[] = [];

  for (const chainKey in chainInfoMap) {
    // eslint-disable-next-line no-prototype-builtins
    if (!chainInfoMap.hasOwnProperty(chainKey)) {
      continue;
    }

    const chainInfo = chainInfoMap[chainKey];

    if (_getSubstrateParaId(chainInfo) === -1) {
      continue;
    }

    result.push(chainKey);
  }

  return result;
}

function getCrowdloanContributeList (
  crowdloanChains: string[],
  chainInfoMap: Record<string, _ChainInfo>,
  crowdloanMap: Record<string, CrowdloanItem>,
  priceMap: Record<string, number>
): _CrowdloanItemType[] {
  const result: _CrowdloanItemType[] = [];

  crowdloanChains.forEach((chain) => {
    const chainInfo = chainInfoMap[chain];
    const crowdloanItem = crowdloanMap[chain];

    if (!chainInfo || !crowdloanItem || crowdloanItem.state.valueOf() !== APIItemState.READY.valueOf()) {
      return;
    }

    const relayParentKey = _getSubstrateRelayParent(chainInfo);
    const relayChainInfo = chainInfoMap[relayParentKey];
    const { decimals, symbol } = _getChainNativeTokenBasicInfo(relayChainInfo);
    const price = priceMap[relayParentKey] || 0;
    const contributeValue = getBalanceValue(crowdloanItem.contribute, decimals);

    if (!BN_ZERO.lt(contributeValue)) {
      return;
    }

    const convertedContributeValue = getConvertedBalanceValue(contributeValue, price);

    result.push({
      fundId: crowdloanItem.fundId,
      chainSlug: chainInfo.slug,
      chainName: chainInfo.name,
      relayChainSlug: relayChainInfo.slug,
      relayChainName: relayChainInfo.name,
      contribution: {
        symbol,
        value: contributeValue,
        convertedValue: convertedContributeValue
      },
      fundStatus: crowdloanItem.status,
      unlockTime: new Date(crowdloanItem.endTime).getTime()
    });
  });

  return result;
}

export default function useGetCrowdloanList () {
  const crowdloanMap = useSelector((state: RootState) => state.crowdloan.crowdloanMap);
  const chainInfoMap = useSelector((state: RootState) => state.chainStore.chainInfoMap);
  const priceMap = useSelector((state: RootState) => state.price.priceMap);
  const crowdloanChains = useMemo<string[]>(() => getCrowdloanChains(chainInfoMap), [chainInfoMap]);

  return useMemo<_CrowdloanItemType[]>(() => {
    return getCrowdloanContributeList(
      crowdloanChains,
      chainInfoMap,
      crowdloanMap,
      priceMap
    );
  }, [crowdloanMap, crowdloanChains, chainInfoMap, priceMap]);
}
