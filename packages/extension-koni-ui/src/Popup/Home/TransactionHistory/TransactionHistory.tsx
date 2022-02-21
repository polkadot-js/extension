// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React from 'react';
import styled from 'styled-components';

import { ChainRegistry, TransactionHistoryItemType } from '@polkadot/extension-base/background/KoniTypes';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { getScanExplorerTransactionHistoryUrl, isSupportScanExplorer } from '@polkadot/extension-koni-ui/util';

import TransactionHistoryEmptyList from './EmptyList';
import TransactionHistoryItem from './TransactionHistoryItem';

interface Props extends ThemeProps {
  className?: string;
  registryMap: Record<string, ChainRegistry>;
  items: TransactionHistoryItemType[];
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

function Wrapper ({ className, items, registryMap }: Props): React.ReactElement<Props> {
  const readyNetworks = getReadyNetwork(registryMap);
  const readyItems = items.filter((i) => readyNetworks.includes(i.networkKey));

  if (!readyItems.length) {
    return (<TransactionHistoryEmptyList />);
  }

  return (<TransactionHistory
    className={className}
    items={readyItems}
    registryMap={registryMap}
  />);
}

function TransactionHistory ({ className, items, registryMap }: ContentProp): React.ReactElement<ContentProp> {
  const renderChainBalanceItem = (item: TransactionHistoryItemType, registryMap: Record<string, ChainRegistry>) => {
    const { networkKey } = item;

    const { extrinsicHash } = item;

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
            registry={registryMap[networkKey]}
          />
        </a>
      );
    }

    return (
      <div key={extrinsicHash}>
        <TransactionHistoryItem
          isSupportScanExplorer={false}
          item={item}
          registry={registryMap[networkKey]}
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
