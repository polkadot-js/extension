// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BigN from 'bignumber.js';
import React, { useCallback } from 'react';
import { useSelector } from 'react-redux';
import styled from 'styled-components';

import { NetWorkGroup, NetWorkMetadataDef } from '@polkadot/extension-base/background/KoniTypes';
import { CrowdloanContributeValueType } from '@polkadot/extension-koni-ui/hooks/screen/home/types';
import CrowdloanItem from '@polkadot/extension-koni-ui/Popup/Home/Crowdloans/CrowdloanItem';
import { CrowdloanItemType } from '@polkadot/extension-koni-ui/Popup/Home/types';
import { RootState } from '@polkadot/extension-koni-ui/stores';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { BN_ZERO, getLogoByNetworkKey } from '@polkadot/extension-koni-ui/util';

import CrowdloanEmptyList from './EmptyList';

interface Props extends ThemeProps {
  className?: string;
  networkKeys: string[];
  crowdloanContributeMap: Record<string, CrowdloanContributeValueType>;
  networkMetadataMap: Record<string, NetWorkMetadataDef>;
}

interface ContentProp {
  className?: string;
  items: CrowdloanItemType[];
}

const GroupDisplayNameMap: Record<string, string> = {
  POLKADOT_PARACHAIN: 'Polkadot parachain',
  KUSAMA_PARACHAIN: 'Kusama parachain'
};

function getGroupDisplayName (groups: NetWorkGroup[]): string {
  for (const group of groups) {
    if (GroupDisplayNameMap[group]) {
      return GroupDisplayNameMap[group];
    }
  }

  return '';
}

function Wrapper ({ className, crowdloanContributeMap, networkKeys, networkMetadataMap }: Props): React.ReactElement<Props> {
  const { networkMap } = useSelector((state: RootState) => state);

  const getItem = useCallback((networkKey: string, contributeValueInfo: CrowdloanContributeValueType, networkMetadata: NetWorkMetadataDef): CrowdloanItemType => {
    const groupDisplayName = getGroupDisplayName(networkMetadata.groups);
    const { balanceValue,
      convertedBalanceValue,
      symbol } = contributeValueInfo.contribute;

    return {
      contribute: balanceValue,
      contributeToUsd: convertedBalanceValue,
      logo: getLogoByNetworkKey(networkKey),
      networkDisplayName: networkMetadata.chain,
      networkKey,
      symbol,
      groupDisplayName,
      paraState: contributeValueInfo.paraState,
      crowdloanUrl: networkMap[networkKey].crowdloanUrl
    };
  }, [networkMap]);

  const getItems = useCallback((networkKeys: string[], crowdloanContributeMap: Record<string, CrowdloanContributeValueType>, networkMetadataMap: Record<string, NetWorkMetadataDef>, includeZeroBalance = false): CrowdloanItemType[] => {
    const result: CrowdloanItemType[] = [];

    networkKeys.forEach((n) => {
      const networkMetadata = networkMetadataMap[n];

      if (!networkMetadata) {
        return;
      }

      const contributeValueInfo: CrowdloanContributeValueType = crowdloanContributeMap[n] ||
        {
          contribute: {
            balanceValue: new BigN(0),
            convertedBalanceValue: new BigN(0),
            symbol: 'Unit'
          }
        };

      if (!includeZeroBalance && !BN_ZERO.lt(new BigN(contributeValueInfo.contribute.balanceValue))) {
        return;
      }

      result.push(getItem(n, contributeValueInfo, networkMetadata));
    });

    return result;
  }, [getItem]);

  const items: CrowdloanItemType[] = getItems(networkKeys, crowdloanContributeMap, networkMetadataMap);

  if (!items.length) {
    return <CrowdloanEmptyList />;
  }

  return <Crowdloans
    className={className}
    items={items}
  />;
}

function Crowdloans ({ className, items }: ContentProp): React.ReactElement<ContentProp> {
  return (
    <div className={`crowdloan-items-container ${className || ''}`}>
      {items.map((item) => (
        <CrowdloanItem
          item={item}
          key={item.networkKey}
        />
      ))}
    </div>
  );
}

export default styled(Wrapper)(({ theme }: Props) => '');
