// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { APIItemState, CrowdloanItem, CurrencyJson } from '@subwallet/extension-base/background/KoniTypes';
import { _getChainNativeTokenBasicInfo, _getSubstrateRelayParent } from '@subwallet/extension-base/services/chain-service/utils';
import { fetchStaticData } from '@subwallet/extension-base/utils/fetchStaticData';
import { BN_ZERO } from '@subwallet/extension-koni-ui/constants';
import { getBalanceValue, getConvertedBalanceValue } from '@subwallet/extension-koni-ui/hooks/screen/home/useAccountBalance';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { _CrowdloanItemType } from '@subwallet/extension-koni-ui/types/crowdloan';
import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';

function getCrowdloanContributeList (
  crowdloanMap: Record<string, CrowdloanItem>,
  chainInfoMap: Record<string, _ChainInfo>,
  priceMap: Record<string, number>,
  currency: CurrencyJson
): _CrowdloanItemType[] {
  const result: _CrowdloanItemType[] = [];

  Object.keys(crowdloanMap).forEach((chain) => {
    const chainInfo = chainInfoMap[chain];
    const crowdloanItem = crowdloanMap[chain];

    if (!chainInfo || !crowdloanItem || crowdloanItem.state.valueOf() !== APIItemState.READY.valueOf()) {
      return;
    }

    const relayParentKey = _getSubstrateRelayParent(chainInfo);

    if (!relayParentKey) {
      return;
    }

    const relayChainInfo = chainInfoMap[relayParentKey];

    if (!relayChainInfo) {
      return;
    }

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
        convertedValue: convertedContributeValue,
        currency
      },
      fundStatus: crowdloanItem.status,
      unlockTime: new Date(crowdloanItem.endTime).getTime()
    });
  });

  return result.sort((a, b) => {
    if (a.unlockTime < b.unlockTime) {
      return -1;
    } else if (a.unlockTime > b.unlockTime) {
      return 1;
    } else {
      return a.chainName.localeCompare(b.chainName);
    }
  });
}

export default function useGetCrowdloanList () {
  const crowdloanMap = useSelector((state: RootState) => state.crowdloan.crowdloanMap);
  // chainInfoMap needs to be fetched from online for dynamic usage
  const [chainInfoMap, setChainInfoMap] = useState<Record<string, _ChainInfo>>({});
  const { currencyData, priceMap } = useSelector((state: RootState) => state.price);

  useEffect(() => {
    fetchStaticData<_ChainInfo[]>('chains').then((rs) => {
      const result: Record<string, _ChainInfo> = {};

      rs.forEach((ci) => {
        if (ci.slug) {
          result[ci.slug] = ci;
        }
      });

      setChainInfoMap(result);
    }).catch((e) => {
      console.log('fetch _ChainInfo error:', e);
    });
  }, []);

  return useMemo<_CrowdloanItemType[]>(() => {
    return getCrowdloanContributeList(
      crowdloanMap,
      chainInfoMap,
      priceMap,
      currencyData
    );
  }, [crowdloanMap, chainInfoMap, priceMap, currencyData]);
}
