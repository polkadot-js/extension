// [object Object]
// SPDX-License-Identifier: Apache-2.0

import BigN from 'bignumber.js';
import React from 'react';
import styled from 'styled-components';

import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';
import LogosMap from '@polkadot/extension-koni-ui/assets/logo';
import CrowdloanItem from '@polkadot/extension-koni-ui/Popup/Home/Crowdloans/CrowdloanItem';
import { CrowdloanItemType } from '@polkadot/extension-koni-ui/Popup/Home/types';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { BalanceValueType, BN_ZERO } from '@polkadot/extension-koni-ui/util';

import CrowdloanEmptyList from './EmptyList';

interface Props extends ThemeProps {
  className?: string;
}

interface ContentProp {
  items: CrowdloanItemType[];
}

const GroupDisplayNameMap: Record<string, string> = {
  POLKADOT_PARACHAIN: 'Polkadot\'s parachain',
  KUSAMA_PARACHAIN: 'Kusama\'s parachain'
};

function getItem (networkName: string, contributeValueInfo: BalanceValueType): CrowdloanItemType {
  const networkInfo = NETWORKS[networkName];
  const groupDisplayName = GroupDisplayNameMap[networkInfo.group] || '';
  const { balanceValue,
    convertedBalanceValue,
    symbol } = contributeValueInfo;

  return {
    contribute: balanceValue,
    contributeToUsd: convertedBalanceValue,
    logo: LogosMap[networkName],
    networkDisplayName: networkInfo.chain,
    networkName,
    symbol,
    groupDisplayName
  };
}

function getItems (networkNames: string[], crowdloanContributeMap: Record<string, BalanceValueType>, includeZeroBalance = false): CrowdloanItemType[] {
  const result: CrowdloanItemType[] = [];

  networkNames.forEach((n) => {
    const contributeValueInfo: BalanceValueType = crowdloanContributeMap[n] ||
      { balanceValue: new BigN(0), convertedBalanceValue: new BigN(0) };

    if (!includeZeroBalance && !BN_ZERO.lt(new BigN(contributeValueInfo.convertedBalanceValue))) {
      return;
    }

    result.push(getItem(n, contributeValueInfo));
  });

  return result;
}

const mockCrowdloanContributeMap: Record<string, BalanceValueType> = {

};

function getmockCrowdloanContributeMap (networkNames: string[]): Record<string, BalanceValueType> {
  const result: Record<string, BalanceValueType> = {};

  networkNames.forEach((n) => {
    result[n] = {
      balanceValue: new BigN(50),
      convertedBalanceValue: new BigN(50),
      symbol: 'DOT'
    };
  });

  return result;
}

function Wrapper (): React.ReactElement<Props> {
  const mockNetworks = [
    'statemint',
    'acala',
    'moonbeam',
    'clover',
    'hydradx',
    'statemine',
    'karura',
    'moonriver',
    'shiden',
    'khala',
    'bifrost'
  ];

  const items: CrowdloanItemType[] = getItems(mockNetworks, getmockCrowdloanContributeMap(mockNetworks));

  if (!items.length) {
    return <CrowdloanEmptyList />;
  }

  return <Crowdloans items={items} />;
}

function Crowdloans ({ items }: ContentProp): React.ReactElement<ContentProp> {
  return (
    <div className={'crowdloan-items-container'}>
      {items.map((item) => (
        <CrowdloanItem
          item={item}
          key={item.networkName}
        />
      ))}
    </div>
  );
}

export default styled(Wrapper)(({ theme }: Props) => '');
