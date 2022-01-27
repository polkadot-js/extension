import React from 'react';
import {ThemeProps} from '@polkadot/extension-koni-ui/types';
import styled from 'styled-components';
import {TransactionHistoryItemType} from '@polkadot/extension-base/background/types';
import TransactionHistoryItem from './TransactionHistoryItem';
import {getScanExplorerTransactionHistoryUrl, isSupportScanExplorer} from '@polkadot/extension-koni-ui/util';
import {ChainRegistry} from "@polkadot/extension-koni-base/api/types";
import TransactionHistoryEmptyList from './EmptyList';

interface Props extends ThemeProps {
  className?: string;
}

interface ContentProp {
  className?: string;
  registryMap: Record<string, ChainRegistry>;
  items: TransactionHistoryItemType[];
}

function getMockTransactionHistory() :TransactionHistoryItemType[] {
  return [
    {
      time: 1643194677273,
      networkKey: 'koni',
      change: '1000000000000000',
      fee: '0000000100000000',
      isSuccess: true,
      action: 'send',
      extrinsicHash: '0x4b7180400e06932b4378d8fa3484eea2d714001b3d7b12488eb6bf49224371c7'
    },
    {
      time: 1643194677273,
      networkKey: 'koni',
      change: '1000000000000000',
      isSuccess: true,
      action: 'send',
      extrinsicHash: '0x4b7180400e06932b4378d8fa3484eea2d724001b3d7b12488eb6bf49224371c7'
    },
    {
      time: 1643194677273,
      networkKey: 'koni',
      change: '1000000000000000',
      fee: '0000000100000000',
      isSuccess: true,
      action: 'received',
      extrinsicHash: '0x4b7180400e06932b4378d8fa3484eea2d734001b3d7b12488eb6bf49224371c7'
    },
    {
      time: 1643194677273,
      networkKey: 'koni',
      change: '0000000000000000',
      fee: '0000000100000000',
      isSuccess: false,
      action: 'send',
      extrinsicHash: '0x4b7180400e06932b4378d8fa3484eea2d744001b3d7b12488eb6bf49224371c7'
    },
    {
      time: 1643194677273,
      networkKey: 'koni',
      change: '0000000000000000',
      fee: '0000000100000000',
      isSuccess: false,
      action: 'send',
      extrinsicHash: '0x4b7180400e06932b4378d8fa3484eea2d754001b3d7b12488eb6bf49224371c7'
    }
  ]
}

function getMockRegistryMap(): Record<string, ChainRegistry> {
  return {
    'koni': {
      chainDecimals: [10],
      chainTokens: ['Unit']
    }
  };
}

function Wrapper({className, theme}: Props): React.ReactElement<Props> {
  const items: TransactionHistoryItemType[] = getMockTransactionHistory();
  const registryMap: Record<string, ChainRegistry> = getMockRegistryMap();

  // if (!items.length) {
    return (<TransactionHistoryEmptyList />)
  // }
  //
  //
  // return (<TransactionHistory items={items} registryMap={registryMap} className={className}/>)
}

function TransactionHistory({items, registryMap, className}: ContentProp): React.ReactElement<ContentProp> {
  const renderChainBalanceItem = (item: TransactionHistoryItemType, registryMap: Record<string, ChainRegistry>) => {
    const {networkKey} = item;

    const {extrinsicHash} = item;

    if (isSupportScanExplorer(networkKey)) {
      return (
        <a href={getScanExplorerTransactionHistoryUrl(networkKey, extrinsicHash)}
           target={'_blank'}
           key={extrinsicHash}
           className={'transaction-item-wrapper'}>
          <TransactionHistoryItem
            item={item}
            registry={registryMap[networkKey]}
          />
        </a>
      )
    }

    return (
      <div key={extrinsicHash}>
        <TransactionHistoryItem
          item={item}
          isSupportSubscan={false}
          registry={registryMap[networkKey]}
        />
      </div>
    )
  };

  return (
    <div className={`transaction-history ${className}`}>
      {items.map(item => renderChainBalanceItem(item, registryMap))}
    </div>
  );
}

export default styled(Wrapper)(({theme}: Props) => `
  height: 100%;
  overflow-y: auto;
`)
