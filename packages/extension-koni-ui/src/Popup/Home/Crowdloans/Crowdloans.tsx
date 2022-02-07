// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BigN from 'bignumber.js';
import React from 'react';
import styled from 'styled-components';
import CrowdloanItem from '@polkadot/extension-koni-ui/Popup/Home/Crowdloans/CrowdloanItem';
import {CrowdloanItemType} from '@polkadot/extension-koni-ui/Popup/Home/types';
import {ThemeProps} from '@polkadot/extension-koni-ui/types';
import {BN_ZERO, getLogoByNetworkKey} from '@polkadot/extension-koni-ui/util';

import CrowdloanEmptyList from './EmptyList';
import {CrowdloanContributeValueType} from "@polkadot/extension-koni-ui/hooks/screen/home/types";
import {NetWorkMetadataDef} from "@polkadot/extension-base/background/KoniTypes";

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
  POLKADOT_PARACHAIN: 'Polkadot\'s parachain',
  KUSAMA_PARACHAIN: 'Kusama\'s parachain'
};

function getItem (
  networkKey: string,
  contributeValueInfo: CrowdloanContributeValueType,
  networkMetadata: NetWorkMetadataDef
): CrowdloanItemType {
  const groupDisplayName = GroupDisplayNameMap[networkMetadata.group] || '';
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
    paraState: contributeValueInfo.paraState
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

function Wrapper ({ className, networkKeys, crowdloanContributeMap, networkMetadataMap }: Props): React.ReactElement<Props> {
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
    <div className={`crowdloan-items-container ${className? className : ''}`}>
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
