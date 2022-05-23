// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainRegistry, TransactionHistoryItemType } from '@subwallet/extension-base/background/KoniTypes';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { getScanExplorerTransactionHistoryUrl, isSupportScanExplorer } from '@subwallet/extension-koni-ui/util';
import React from 'react';
import styled from 'styled-components';

const TransactionHistoryItem = React.lazy(() => import('./TransactionHistoryItem'));
const TransactionHistoryEmptyList = React.lazy(() => import('./EmptyList'));

interface Props extends ThemeProps {
  className?: string;
  registryMap: Record<string, ChainRegistry>;
  networkKey: string;
  historyMap: Record<string, TransactionHistoryItemType[]>;
}

interface ContentProp {
  className?: string;
  registryMap: Record<string, ChainRegistry>;
  items: TransactionHistoryItemType[];
}

function getReadyNetwork (registryMap: Record<string, ChainRegistry>): string[] {
  const result: string[] = [];

  for (const networkKey in registryMap) {
    // eslint-disable-next-line no-prototype-builtins
    if (!registryMap.hasOwnProperty(networkKey)) {
      continue;
    }

    if (registryMap[networkKey]) {
      result.push(networkKey);
    }
  }

  return result;
}

function getItems (networkKey: string, historyMap: Record<string, TransactionHistoryItemType[]>): TransactionHistoryItemType[] {
  const result: TransactionHistoryItemType[] = [];

  if (networkKey === 'all') {
    Object.values(historyMap).forEach((items) => {
      result.push(...items);
    });
  } else {
    if (!historyMap[networkKey]) {
      return [];
    }

    result.push(...historyMap[networkKey]);
  }

  return result.sort((a, b) => b.time - a.time);
}

function Wrapper ({ className, historyMap, networkKey, registryMap }: Props): React.ReactElement<Props> {
  const readyNetworks = getReadyNetwork(registryMap);
  const items = getItems(networkKey, historyMap);
  const readyItems = items.filter((i) => readyNetworks.includes(i.networkKey));

  if (!readyItems.length) {
    return (<TransactionHistoryEmptyList />);
  }

  return (
    <TransactionHistory
      className={className}
      items={readyItems}
      registryMap={registryMap}
    />
  );
}

function TransactionHistory ({ className, items, registryMap }: ContentProp): React.ReactElement<ContentProp> {
  const renderChainBalanceItem = (item: TransactionHistoryItemType, registryMap: Record<string, ChainRegistry>) => {
    const { networkKey } = item;
    const { extrinsicHash } = item;
    const registry = registryMap[networkKey];

    if ((item.changeSymbol && !registry.tokenMap[item.changeSymbol]) ||
      (item.feeSymbol && !registry.tokenMap[item.feeSymbol])) {
      return null;
    }

    if (isSupportScanExplorer(networkKey)) {
      return (
        <a
          className={'transaction-item-wrapper'}
          href={getScanExplorerTransactionHistoryUrl(networkKey, extrinsicHash)}
          key={extrinsicHash}
          rel='noreferrer'
          target={'_blank'}
        >
          <TransactionHistoryItem
            isSupportScanExplorer={true}
            item={item}
            registry={registry}
          />
        </a>
      );
    }

    return (
      <div key={extrinsicHash}>
        <TransactionHistoryItem
          isSupportScanExplorer={false}
          item={item}
          registry={registry}
        />
      </div>
    );
  };

  return (
    <div className={`transaction-history ${className || ''}`}>
      {items.map((item) => renderChainBalanceItem(item, registryMap))}
    </div>
  );
}

export default styled(Wrapper)(({ theme }: Props) => `
  height: 100%;
  overflow-y: auto;

  .transaction-item-wrapper {
    color: ${theme.textColor};
  }
`);
