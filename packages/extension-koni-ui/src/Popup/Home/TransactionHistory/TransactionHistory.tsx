// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainRegistry, TransactionHistoryItemType } from '@subwallet/extension-base/background/KoniTypes';
import useScanExplorerTxUrl from '@subwallet/extension-koni-ui/hooks/screen/home/useScanExplorerTxUrl';
import useSupportScanExplorer from '@subwallet/extension-koni-ui/hooks/screen/home/useSupportScanExplorer';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
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

interface ItemWrapperProp {
  item: TransactionHistoryItemType;
  registryMap: Record<string, ChainRegistry>;
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

function TransactionHistoryItemWrapper ({ item, registryMap }: ItemWrapperProp) {
  const { change, eventIdx, extrinsicHash, networkKey } = item;
  const registry = registryMap[networkKey];
  const isSupportScanExplorer = useSupportScanExplorer(networkKey);
  const isScanExplorerTxUrl = useScanExplorerTxUrl(networkKey, extrinsicHash);

  const key = `${extrinsicHash}/${eventIdx || change}`;

  if ((item.changeSymbol && !registry.tokenMap[item.changeSymbol]) ||
    (item.feeSymbol && !registry.tokenMap[item.feeSymbol])) {
    return null;
  }

  if (isSupportScanExplorer) {
    return (
      <a
        className={'transaction-item-wrapper'}
        href={isScanExplorerTxUrl}
        key={key}
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
    <div key={key}>
      <TransactionHistoryItem
        isSupportScanExplorer={false}
        item={item}
        registry={registry}
      />
    </div>
  );
}

function TransactionHistory ({ className, items, registryMap }: ContentProp): React.ReactElement<ContentProp> {
  return (
    <div className={`transaction-history ${className || ''}`}>
      {items.map((item) => (
        <TransactionHistoryItemWrapper
          item={item}
          key={`${item.extrinsicHash}/${item.eventIdx || item.change}`}
          registryMap={registryMap}
        />
      ))}
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
