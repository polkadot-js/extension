// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BigN from 'bignumber.js';
import React from 'react';
import styled from 'styled-components';

import { NetWorkGroup, NetWorkMetadataDef } from '@subwallet/extension-base/background/KoniTypes';
import NETWORKS from '@subwallet/extension-koni-base/api/endpoints';
import { CrowdloanContributeValueType } from '@subwallet/extension-koni-ui/hooks/screen/home/types';
import { CrowdloanItemType } from '@subwallet/extension-koni-ui/Popup/Home/types';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { BN_ZERO, getLogoByNetworkKey } from '@subwallet/extension-koni-ui/util';

const CrowdloanEmptyList = React.lazy(() => import('./EmptyList'));
const CrowdloanItem = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home/Crowdloans/CrowdloanItem'));

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

function getCrowdloanUrl (networkKey: string) {
  return NETWORKS[networkKey].crowdloanUrl;
}

function getItem (
  networkKey: string,
  contributeValueInfo: CrowdloanContributeValueType,
  networkMetadata: NetWorkMetadataDef
): CrowdloanItemType {
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
    crowdloanUrl: getCrowdloanUrl(networkKey)
  };
}

function getItems (
  networkKeys: string[],
  crowdloanContributeMap: Record<string, CrowdloanContributeValueType>,
  networkMetadataMap: Record<string, NetWorkMetadataDef>,
  includeZeroBalance = false): CrowdloanItemType[] {
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
}

function Wrapper ({ className, crowdloanContributeMap, networkKeys, networkMetadataMap }: Props): React.ReactElement<Props> {
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
