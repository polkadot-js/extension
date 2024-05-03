// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { ExtrinsicStatus, ExtrinsicType, TransactionDirection, TransactionHistoryItem } from '@subwallet/extension-base/background/KoniTypes';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { YIELD_EXTRINSIC_TYPES } from '@subwallet/extension-base/koni/api/yield/helper/utils';
import { _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { quickFormatAddressToCompare } from '@subwallet/extension-base/utils';
import { AccountSelector, BasicInputEvent, ChainSelector, FilterModal, HistoryItem, Layout, PageWrapper } from '@subwallet/extension-web-ui/components';
import { FilterTabItemType, FilterTabs } from '@subwallet/extension-web-ui/components/FilterTabs';
import NoContent, { PAGE_TYPE } from '@subwallet/extension-web-ui/components/NoContent';
import { HISTORY_DETAIL_MODAL } from '@subwallet/extension-web-ui/constants';
import { DataContext } from '@subwallet/extension-web-ui/contexts/DataContext';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useChainInfoWithState, useFilterModal, useHistorySelection, useSelector, useSetCurrentPage } from '@subwallet/extension-web-ui/hooks';
import { cancelSubscription, subscribeTransactionHistory } from '@subwallet/extension-web-ui/messaging';
import { ChainItemType, ThemeProps, TransactionHistoryDisplayData, TransactionHistoryDisplayItem } from '@subwallet/extension-web-ui/types';
import { customFormatDate, findAccountByAddress, findNetworkJsonByGenesisHash, formatHistoryDate, isTypeStaking, isTypeTransfer } from '@subwallet/extension-web-ui/utils';
import { Button, ButtonProps, Icon, ModalContext, SwIconProps, SwList, SwSubHeader } from '@subwallet/react-ui';
import CN from 'classnames';
import { Aperture, ArrowDownLeft, ArrowsLeftRight, ArrowUpRight, ClockCounterClockwise, Database, FadersHorizontal, Rocket, Spinner } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

import { HistoryDetailModal } from './Detail';

type Props = ThemeProps

const IconMap: Record<string, SwIconProps['phosphorIcon']> = {
  send: ArrowUpRight,
  receive: ArrowDownLeft,
  claim_reward: ClockCounterClockwise,
  staking: Database,
  crowdloan: Rocket,
  nft: Aperture,
  processing: Spinner,
  default: ClockCounterClockwise,
  swap: ArrowsLeftRight
};

function getIcon (item: TransactionHistoryItem): SwIconProps['phosphorIcon'] {
  if (item.status === ExtrinsicStatus.PROCESSING || item.status === ExtrinsicStatus.SUBMITTING) {
    return IconMap.processing;
  }

  if (item.type === ExtrinsicType.SEND_NFT) {
    return IconMap.nft;
  }

  if (item.type === ExtrinsicType.CROWDLOAN) {
    return IconMap.crowdloan;
  }

  if (item.type === ExtrinsicType.STAKING_CLAIM_REWARD) {
    return IconMap.claim_reward;
  }

  if (item.type === ExtrinsicType.SWAP) {
    return IconMap.swap;
  }

  if (isTypeStaking(item.type)) {
    return IconMap.staking;
  }

  return IconMap.default;
}

function getDisplayData (item: TransactionHistoryItem, nameMap: Record<string, string>, titleMap: Record<string, string>): TransactionHistoryDisplayData {
  let displayData: TransactionHistoryDisplayData;
  const time = customFormatDate(item.time, '#hhhh#:#mm#');

  const displayStatus = item.status === ExtrinsicStatus.FAIL ? 'fail' : '';

  if (item.type === ExtrinsicType.TRANSFER_BALANCE || item.type === ExtrinsicType.TRANSFER_TOKEN || item.type === ExtrinsicType.TRANSFER_XCM || item.type === ExtrinsicType.EVM_EXECUTE) {
    if (item.direction === TransactionDirection.RECEIVED) {
      displayData = {
        className: `-receive -${item.status}`,
        title: titleMap.received,
        name: nameMap.received,
        typeName: `${nameMap.received} ${displayStatus} - ${time}`,
        icon: IconMap.receive
      };
    } else {
      displayData = {
        className: `-send -${item.status}`,
        title: titleMap.send,
        name: nameMap.send,
        typeName: `${nameMap.send} ${displayStatus} - ${time}`,
        icon: IconMap.send
      };
    }
  } else {
    const typeName = nameMap[item.type] || nameMap.default;

    displayData = {
      className: `-${item.type} -${item.status}`,
      title: titleMap[item.type],
      typeName: `${typeName} ${displayStatus} - ${time}`,
      name: nameMap[item.type],
      icon: getIcon(item)
    };
  }

  if (item.status === ExtrinsicStatus.PROCESSING) {
    displayData.className = '-processing';
    displayData.typeName = nameMap.processing;
  }

  if (item.status === ExtrinsicStatus.SUBMITTING) {
    displayData.className = '-processing';
    displayData.typeName = nameMap.submitting;
  }

  return displayData;
}

const FILTER_MODAL_ID = 'history-filter-id';

enum FilterValue {
  ALL = 'all',
  TOKENS = 'tokens',
  SEND = 'send',
  RECEIVED = 'received',
  NFT = 'nft',
  STAKE = 'stake',
  CLAIM = 'claim',
  CROWDLOAN = 'crowdloan',
  SUCCESSFUL = 'successful',
  FAILED = 'failed',
  EARN = 'earn',
  SWAP = 'swap'
}

function getHistoryItemKey (item: Pick<TransactionHistoryItem, 'chain' | 'address' | 'extrinsicHash' | 'transactionId'>) {
  return `${item.chain}-${item.address}-${item.transactionId || item.extrinsicHash}`;
}

function findLedgerChainOfSelectedAccount (
  address: string,
  accounts: AccountJson[],
  chainInfoMap: Record<string, _ChainInfo>
): string | undefined {
  if (!address) {
    return undefined;
  }

  const isAccountEthereum = isEthereumAddress(address);

  const account = findAccountByAddress(accounts, address);

  if (isAccountEthereum && account?.isHardware) {
    return 'ethereum';
  }

  if (!account || !account.isHardware) {
    return undefined;
  }

  const validGen: string[] = account.availableGenesisHashes || [];
  const validLedgerNetworks = validGen.map((genesisHash) => findNetworkJsonByGenesisHash(chainInfoMap, genesisHash)?.slug).filter((i) => !!i);

  if (validLedgerNetworks.length) {
    return validLedgerNetworks[0];
  }

  return undefined;
}

function filterDuplicateItems (items: TransactionHistoryItem[]): TransactionHistoryItem[] {
  const result: TransactionHistoryItem[] = [];

  const exclusionMap: Record<string, boolean> = {};

  const getExclusionKey = (i: TransactionHistoryItem): string => {
    return `${i.direction}_${i.blockNumber}_${i.type}_${i.from}_${i.to}`.toLowerCase();
  };

  items.forEach((i) => {
    if (i.origin === 'app' && i.blockNumber > 0 && i.type === ExtrinsicType.TRANSFER_BALANCE) {
      exclusionMap[getExclusionKey(i)] = true;
    }
  });

  if (!Object.keys(exclusionMap).length) {
    return items;
  }

  items.forEach((i) => {
    if (i.origin === 'subscan' && exclusionMap[getExclusionKey(i)]) {
      return;
    }

    result.push(i);
  });

  return result;
}

const modalId = HISTORY_DETAIL_MODAL;
const DEFAULT_ITEMS_COUNT = 20;
const NEXT_ITEMS_COUNT = 10;

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  useSetCurrentPage('/home/history');
  const { t } = useTranslation();
  const dataContext = useContext(DataContext);
  const { isWebUI } = useContext(ScreenContext);
  const { activeModal, checkActive, inactiveModal } = useContext(ModalContext);
  const { accounts, currentAccount, isAllAccount } = useSelector((root) => root.accountState);
  const { chainInfoMap } = useSelector((root) => root.chainStore);
  const chainInfoList = useChainInfoWithState();
  const { language } = useSelector((root) => root.settings);
  const [selectedFilterTab, setSelectedFilterTab] = useState<string>(FilterValue.ALL);
  const [loading, setLoading] = useState<boolean>(true);
  const [rawHistoryList, setRawHistoryList] = useState<TransactionHistoryItem[]>([]);

  const isActive = checkActive(modalId);

  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, selectedFilters } = useFilterModal(FILTER_MODAL_ID);

  const _filterFunction = useMemo<(item: TransactionHistoryItem) => boolean>(() => {
    return (item) => {
      if (!selectedFilters.length) {
        return true;
      }

      for (const filter of selectedFilters) {
        if (filter === FilterValue.SEND) {
          if (isTypeTransfer(item.type) && item.direction === TransactionDirection.SEND) {
            return true;
          }
        } else if (filter === FilterValue.RECEIVED) {
          if (isTypeTransfer(item.type) && item.direction === TransactionDirection.RECEIVED) {
            return true;
          }
        } else if (filter === FilterValue.NFT) {
          if (item.type === ExtrinsicType.SEND_NFT) {
            return true;
          }
        } else if (filter === FilterValue.STAKE) {
          if (isTypeStaking(item.type)) {
            return true;
          }
        } else if (filter === FilterValue.CLAIM) {
          if (item.type === ExtrinsicType.STAKING_CLAIM_REWARD) {
            return true;
          }
        } else if (filter === FilterValue.CROWDLOAN) {
          if (item.type === ExtrinsicType.CROWDLOAN) {
            return true;
          }
        } else if (filter === FilterValue.SWAP) {
          if (item.type === ExtrinsicType.SWAP) {
            return true;
          }
        } else if (filter === FilterValue.SUCCESSFUL) {
          if (item.status === ExtrinsicStatus.SUCCESS) {
            return true;
          }
        } else if (filter === FilterValue.FAILED) {
          if (item.status === ExtrinsicStatus.FAIL) {
            return true;
          }
        } else if (filter === FilterValue.EARN) {
          if (YIELD_EXTRINSIC_TYPES.includes(item.type)) {
            return true;
          }
        }
      }

      return false;
    };
  }, [selectedFilters]);

  const filterFunction = useCallback((item: TransactionHistoryItem) => {
    if (!isWebUI) {
      return _filterFunction(item);
    }

    const filterTabFunction = (_item: TransactionHistoryItem) => {
      if (selectedFilterTab === FilterValue.ALL) {
        return true;
      }

      if (selectedFilterTab === FilterValue.TOKENS) {
        return isTypeTransfer(_item.type);
      }

      if (selectedFilterTab === FilterValue.NFT) {
        return _item.type === ExtrinsicType.SEND_NFT;
      }

      if (selectedFilterTab === FilterValue.EARN) {
        return YIELD_EXTRINSIC_TYPES.includes(_item.type);
      }

      return false;
    };

    return filterTabFunction(item) && _filterFunction(item);
  }, [_filterFunction, isWebUI, selectedFilterTab]);

  const filterOptions = useMemo(() => {
    return [
      { label: t('Send token'), value: FilterValue.SEND },
      { label: t('Receive token'), value: FilterValue.RECEIVED },
      { label: t('NFT transaction'), value: FilterValue.NFT },
      { label: t('Earning transaction'), value: FilterValue.STAKE },
      { label: t('Claim reward'), value: FilterValue.CLAIM },
      { label: t('Swap'), value: FilterValue.SWAP },
      // { label: t('Crowdloan transaction'), value: FilterValue.CROWDLOAN }, // support crowdloan later
      { label: t('Successful'), value: FilterValue.SUCCESSFUL },
      { label: t('Failed'), value: FilterValue.FAILED }
    ];
  }, [t]);

  const accountMap = useMemo(() => {
    return accounts.reduce((accMap, cur) => {
      accMap[cur.address.toLowerCase()] = cur.name || '';

      return accMap;
    }, {} as Record<string, string>);
  }, [accounts]);

  const typeNameMap: Record<string, string> = useMemo((): Record<ExtrinsicType | 'default' | 'submitting' | 'processing' | 'timeout' | 'send' | 'received', string> => ({
    default: t('Transaction'),
    submitting: t('Submitting...'),
    processing: t('Processing...'),
    timeout: t('Time-out'),
    send: t('Send'),
    received: t('Receive'),
    [ExtrinsicType.TRANSFER_BALANCE]: t('Send token'),
    [ExtrinsicType.TRANSFER_TOKEN]: t('Send token'),
    [ExtrinsicType.TRANSFER_XCM]: t('Send token'),
    [ExtrinsicType.SEND_NFT]: t('NFT'),
    [ExtrinsicType.CROWDLOAN]: t('Crowdloan'),
    [ExtrinsicType.STAKING_JOIN_POOL]: t('Stake'),
    [ExtrinsicType.STAKING_LEAVE_POOL]: t('Unstake'),
    [ExtrinsicType.STAKING_BOND]: t('Stake'),
    [ExtrinsicType.STAKING_UNBOND]: t('Unstake'),
    [ExtrinsicType.STAKING_CLAIM_REWARD]: t('Claim Reward'),
    [ExtrinsicType.STAKING_WITHDRAW]: t('Withdraw'),
    [ExtrinsicType.STAKING_POOL_WITHDRAW]: t('Withdraw'),
    [ExtrinsicType.STAKING_CANCEL_UNSTAKE]: t('Cancel unstake'),
    [ExtrinsicType.STAKING_COMPOUNDING]: t('Compound'),
    [ExtrinsicType.STAKING_CANCEL_COMPOUNDING]: t('Cancel compound'),
    [ExtrinsicType.EVM_EXECUTE]: t('EVM Transaction'),
    [ExtrinsicType.JOIN_YIELD_POOL]: t('Stake'),
    [ExtrinsicType.MINT_QDOT]: t('Mint qDOT'),
    [ExtrinsicType.MINT_SDOT]: t('Mint sDOT'),
    [ExtrinsicType.MINT_LDOT]: t('Mint LDOT'),
    [ExtrinsicType.MINT_VDOT]: t('Mint vDOT'),
    [ExtrinsicType.MINT_VMANTA]: t('Mint vMANTA'),
    [ExtrinsicType.MINT_STDOT]: t('Mint stDOT'),
    [ExtrinsicType.REDEEM_QDOT]: t('Redeem qDOT'),
    [ExtrinsicType.REDEEM_SDOT]: t('Redeem sDOT'),
    [ExtrinsicType.REDEEM_LDOT]: t('Redeem LDOT'),
    [ExtrinsicType.REDEEM_VDOT]: t('Redeem vDOT'),
    [ExtrinsicType.REDEEM_VMANTA]: t('Redeem vMANTA'),
    [ExtrinsicType.REDEEM_STDOT]: t('Redeem stDOT'),
    [ExtrinsicType.UNSTAKE_QDOT]: t('Unstake qDOT'),
    [ExtrinsicType.UNSTAKE_VDOT]: t('Unstake vDOT'),
    [ExtrinsicType.UNSTAKE_VMANTA]: t('Unstake vMANTA'),
    [ExtrinsicType.UNSTAKE_LDOT]: t('Unstake LDOT'),
    [ExtrinsicType.UNSTAKE_SDOT]: t('Unstake sDOT'),
    [ExtrinsicType.UNSTAKE_STDOT]: t('Unstake stDOT'),
    [ExtrinsicType.TOKEN_APPROVE]: t('Token approve'),
    [ExtrinsicType.SWAP]: t('Swap'),
    [ExtrinsicType.UNKNOWN]: t('Unknown')
  }), [t]);

  const typeTitleMap: Record<string, string> = useMemo((): Record<ExtrinsicType | 'default' | 'send' | 'received', string> => ({
    default: t('Transaction'),
    send: t('Send token'),
    received: t('Receive token'),
    [ExtrinsicType.TRANSFER_BALANCE]: t('Send token'),
    [ExtrinsicType.TRANSFER_TOKEN]: t('Send token'),
    [ExtrinsicType.TRANSFER_XCM]: t('Send token'),
    [ExtrinsicType.SEND_NFT]: t('NFT transaction'),
    [ExtrinsicType.CROWDLOAN]: t('Crowdloan transaction'),
    [ExtrinsicType.STAKING_JOIN_POOL]: t('Stake transaction'),
    [ExtrinsicType.STAKING_LEAVE_POOL]: t('Unstake transaction'),
    [ExtrinsicType.STAKING_BOND]: t('Stake transaction'),
    [ExtrinsicType.STAKING_UNBOND]: t('Unstake transaction'),
    [ExtrinsicType.STAKING_CLAIM_REWARD]: t('Claim Reward transaction'),
    [ExtrinsicType.STAKING_WITHDRAW]: t('Withdraw transaction'),
    [ExtrinsicType.STAKING_POOL_WITHDRAW]: t('Withdraw transaction'),
    [ExtrinsicType.STAKING_CANCEL_UNSTAKE]: t('Cancel unstake transaction'),
    [ExtrinsicType.STAKING_COMPOUNDING]: t('Compound transaction'),
    [ExtrinsicType.STAKING_CANCEL_COMPOUNDING]: t('Cancel compound transaction'),
    [ExtrinsicType.EVM_EXECUTE]: t('EVM Transaction'),
    [ExtrinsicType.JOIN_YIELD_POOL]: t('Stake transaction'),
    [ExtrinsicType.MINT_QDOT]: t('Mint qDOT transaction'),
    [ExtrinsicType.MINT_SDOT]: t('Mint sDOT transaction'),
    [ExtrinsicType.MINT_LDOT]: t('Mint LDOT transaction'),
    [ExtrinsicType.MINT_VDOT]: t('Mint vDOT transaction'),
    [ExtrinsicType.MINT_VMANTA]: t('Mint vMANTA transaction'),
    [ExtrinsicType.MINT_STDOT]: t('Mint stDOT transaction'),
    [ExtrinsicType.REDEEM_QDOT]: t('Redeem qDOT transaction'),
    [ExtrinsicType.REDEEM_SDOT]: t('Redeem sDOT transaction'),
    [ExtrinsicType.REDEEM_LDOT]: t('Redeem LDOT transaction'),
    [ExtrinsicType.REDEEM_VDOT]: t('Redeem vDOT transaction'),
    [ExtrinsicType.REDEEM_VMANTA]: t('Redeem vMANTA transaction'),
    [ExtrinsicType.REDEEM_STDOT]: t('Redeem stDOT transaction'),
    [ExtrinsicType.UNSTAKE_QDOT]: t('Unstake qDOT tranasction'),
    [ExtrinsicType.UNSTAKE_VDOT]: t('Unstake vDOT tranasction'),
    [ExtrinsicType.UNSTAKE_VMANTA]: t('Unstake vMANTA tranasction'),
    [ExtrinsicType.UNSTAKE_LDOT]: t('Unstake LDOT tranasction'),
    [ExtrinsicType.UNSTAKE_SDOT]: t('Unstake sDOT tranasction'),
    [ExtrinsicType.UNSTAKE_STDOT]: t('Unstake stDOT tranasction'),
    [ExtrinsicType.TOKEN_APPROVE]: t('Token approve transaction'),
    [ExtrinsicType.SWAP]: t('Swap transaction'),
    [ExtrinsicType.UNKNOWN]: t('Unknown transaction')
  }), [t]);

  // Fill display data to history list
  const historyMap = useMemo(() => {
    const finalHistoryMap: Record<string, TransactionHistoryDisplayItem> = {};

    rawHistoryList.forEach((item: TransactionHistoryItem) => {
      // Format display name for account by address
      const fromName = accountMap[quickFormatAddressToCompare(item.from) || ''];
      const toName = accountMap[quickFormatAddressToCompare(item.to) || ''];
      const key = getHistoryItemKey(item);

      finalHistoryMap[key] = { ...item, fromName, toName, displayData: getDisplayData(item, typeNameMap, typeTitleMap) };
    });

    return finalHistoryMap;
  }, [accountMap, rawHistoryList, typeNameMap, typeTitleMap]);

  const [currentItemDisplayCount, setCurrentItemDisplayCount] = useState<number>(DEFAULT_ITEMS_COUNT);

  const getHistoryItems = useCallback((count: number) => {
    return Object.values(historyMap).filter(filterFunction).sort((a, b) => (b.time - a.time)).slice(0, count);
  }, [filterFunction, historyMap]);

  const [historyItems, setHistoryItems] = useState<TransactionHistoryDisplayItem[]>(getHistoryItems(DEFAULT_ITEMS_COUNT));

  const [curAdr] = useState(currentAccount?.address);

  // Handle detail modal
  const { chain, extrinsicHashOrId } = useParams();
  const [selectedItem, setSelectedItem] = useState<TransactionHistoryDisplayItem | null>(null);
  const [openDetailLink, setOpenDetailLink] = useState<boolean>(!!chain && !!extrinsicHashOrId);

  const onOpenDetail = useCallback((item: TransactionHistoryDisplayItem) => {
    return () => {
      setSelectedItem(item);
      activeModal(modalId);
    };
  }, [activeModal]);

  const onCloseDetail = useCallback(() => {
    inactiveModal(modalId);
    setSelectedItem(null);
    setOpenDetailLink(false);
  }, [inactiveModal]);

  const onClickFilter = useCallback(() => {
    activeModal(FILTER_MODAL_ID);
  }, [activeModal]);

  useEffect(() => {
    if (extrinsicHashOrId && chain && openDetailLink) {
      const existed = Object.values(historyMap).find((item) => item.chain === chain && (item.transactionId === extrinsicHashOrId || item.extrinsicHash === extrinsicHashOrId));

      if (existed) {
        setSelectedItem(existed);
        activeModal(modalId);
      }
    }
  }, [activeModal, chain, extrinsicHashOrId, openDetailLink, historyMap]);

  useEffect(() => {
    if (isActive) {
      setSelectedItem((selected) => {
        if (selected) {
          const key = getHistoryItemKey(selected);

          return historyMap[key] || null;
        } else {
          return selected;
        }
      });
    }
  }, [isActive, historyMap]);

  useEffect(() => {
    if (currentAccount?.address !== curAdr) {
      inactiveModal(modalId);
      setSelectedItem(null);
    }
  }, [curAdr, currentAccount?.address, inactiveModal]);

  const { selectedAddress, selectedChain, setSelectedAddress, setSelectedChain } = useHistorySelection();

  const emptyList = useCallback(() => {
    return <NoContent pageType={PAGE_TYPE.HISTORY} />;
  }, []);

  const renderItem = useCallback(
    (item: TransactionHistoryDisplayItem) => {
      return (
        <HistoryItem
          item={item}
          key={`${item.extrinsicHash}-${item.address}-${item.direction}`}
          onClick={onOpenDetail(item)}
        />
      );
    },
    [onOpenDetail]
  );

  const groupBy = useCallback((item: TransactionHistoryItem) => {
    return formatHistoryDate(item.time, language, 'list');
  }, [language]);

  const groupSeparator = useCallback((group: TransactionHistoryItem[], idx: number, groupLabel: string) => {
    return (
      <div className='__group-separator'>{groupLabel}</div>
    );
  }, []);

  const onSelectFilterTab = useCallback((value: string) => {
    setSelectedFilterTab(value);
    setCurrentItemDisplayCount(DEFAULT_ITEMS_COUNT);
  }, []);

  const filterTabItems = useMemo<FilterTabItemType[]>(() => {
    return [
      {
        label: t('All'),
        value: FilterValue.ALL
      },
      {
        label: t('Tokens'),
        value: FilterValue.TOKENS
      },
      {
        label: t('NFT'),
        value: FilterValue.NFT
      },
      {
        label: t('Earning'),
        value: FilterValue.EARN
      }
    ];
  }, [t]);

  const chainItems = useMemo<ChainItemType[]>(() => {
    if (!selectedAddress) {
      return [];
    }

    const result: ChainItemType[] = [];

    chainInfoList.forEach((c) => {
      if (_isChainEvmCompatible(c) === isEthereumAddress(selectedAddress)) {
        result.push({
          name: c.name,
          slug: c.slug
        });
      }
    });

    return result;
  }, [chainInfoList, selectedAddress]);

  const onSelectAccount = useCallback((event: BasicInputEvent) => {
    setSelectedAddress(event.target.value);
  }, [setSelectedAddress]);

  const onSelectChain = useCallback((event: BasicInputEvent) => {
    setSelectedChain(event.target.value);
  }, [setSelectedChain]);

  const currentLedgerChainOfSelectedAccount = useMemo(() => {
    return findLedgerChainOfSelectedAccount(selectedAddress,
      accounts,
      chainInfoMap);
  }, [accounts, chainInfoMap, selectedAddress]);

  const isChainSelectorEmpty = !chainItems.length;

  const chainSelectorDisabled = useMemo(() => {
    if (!selectedAddress || isChainSelectorEmpty) {
      return true;
    }

    if (!isEthereumAddress(selectedAddress)) {
      return !!currentLedgerChainOfSelectedAccount;
    }

    return false;
  }, [isChainSelectorEmpty, currentLedgerChainOfSelectedAccount, selectedAddress]);

  const historySelectorsNode = (
    <>
      {
        isAllAccount && (
          <AccountSelector
            className={'__history-address-selector'}
            onChange={onSelectAccount}
            value={selectedAddress}
          />
        )
      }

      <ChainSelector
        className={'__history-chain-selector'}
        disabled={chainSelectorDisabled}
        items={chainItems}
        loading={loading}
        onChange={onSelectChain}
        title={t('Select chain')}
        value={selectedChain}
      />
    </>
  );

  const _onApplyFilter = useCallback(() => {
    onApplyFilter();
    setCurrentItemDisplayCount(DEFAULT_ITEMS_COUNT);
  }, [onApplyFilter]);

  const onLoadMoreItems = useCallback(() => {
    setCurrentItemDisplayCount((prev) => {
      const rawItemsLength = rawHistoryList.filter(filterFunction).length;

      if (prev + NEXT_ITEMS_COUNT > rawItemsLength) {
        return rawItemsLength;
      } else {
        return prev + NEXT_ITEMS_COUNT;
      }
    });
  }, [filterFunction, rawHistoryList]);

  const hasMoreItems = useMemo(() => {
    return rawHistoryList.filter(filterFunction).length > historyItems.length;
  }, [filterFunction, historyItems.length, rawHistoryList]);

  const listSection = useMemo(() => (
    <>
      <div className={'__page-list-area'}>
        <SwList
          groupBy={groupBy}
          groupSeparator={groupSeparator}
          hasMoreItems={hasMoreItems}
          list={historyItems}
          loadMoreItems={onLoadMoreItems}
          renderItem={renderItem}
          renderOnScroll={false}
          renderWhenEmpty={emptyList}
        />
      </div>
    </>
  ), [emptyList, groupBy, groupSeparator, hasMoreItems, historyItems, onLoadMoreItems, renderItem]);

  const headerIcons = useMemo<ButtonProps[]>(() => {
    return [
      {
        icon: (
          <Icon
            customSize={'24px'}
            phosphorIcon={FadersHorizontal}
            type='phosphor'
          />
        ),
        onClick: onClickFilter
      }
    ];
  }, [onClickFilter]);

  const isSelectedChainEvm = useMemo(() => {
    const selectedChainInfo = chainInfoMap[selectedChain];

    return selectedChainInfo && _isChainEvmCompatible(selectedChainInfo);
  }, [chainInfoMap, selectedChain]);

  useEffect(() => {
    let id: string;
    let isSubscribed = true;

    setLoading(true);

    setCurrentItemDisplayCount(DEFAULT_ITEMS_COUNT);

    subscribeTransactionHistory(
      selectedChain,
      selectedAddress,
      (items: TransactionHistoryItem[]) => {
        if (isSubscribed) {
          setRawHistoryList(isSelectedChainEvm ? filterDuplicateItems(items) : items);
        }

        setLoading(false);
      }
    ).then((res) => {
      id = res.id;

      if (isSubscribed) {
        setRawHistoryList(isSelectedChainEvm ? filterDuplicateItems(res.items) : res.items);
      } else {
        cancelSubscription(id).catch(console.log);
      }
    }).catch((e) => {
      console.log('subscribeTransactionHistory error:', e);
    });

    return () => {
      isSubscribed = false;

      if (id) {
        cancelSubscription(id).catch(console.log);
      }
    };
  }, [isSelectedChainEvm, selectedAddress, selectedChain]);

  useEffect(() => {
    if (chainItems.length) {
      setSelectedChain((prevChain) => {
        const _isEthereumAddress = isEthereumAddress(selectedAddress);

        if (currentLedgerChainOfSelectedAccount) {
          if (!_isEthereumAddress) {
            return currentLedgerChainOfSelectedAccount;
          }
        }

        if (prevChain && chainInfoMap[prevChain]) {
          const _isPrevChainEvm = _isChainEvmCompatible(chainInfoMap[prevChain]);

          if (_isEthereumAddress && !_isPrevChainEvm && currentLedgerChainOfSelectedAccount) {
            return currentLedgerChainOfSelectedAccount;
          }

          if (_isPrevChainEvm === _isEthereumAddress) {
            return prevChain;
          }
        }

        return chainItems[0].slug;
      });
    }
  }, [chainInfoMap, chainItems, currentLedgerChainOfSelectedAccount, selectedAddress, setSelectedChain]);

  useEffect(() => {
    setHistoryItems(getHistoryItems(currentItemDisplayCount));
  }, [currentItemDisplayCount, getHistoryItems]);

  return (
    <>
      <PageWrapper
        className={CN(`history ${className}`, {
          '-desktop': isWebUI,
          '-mobile': !isWebUI
        })}
        resolve={dataContext.awaitStores(['price'])}
      >
        <Layout.Base
          title={t('History')}
        >
          {!isWebUI && (
            <>
              <SwSubHeader
                background={'transparent'}
                center={false}
                className={'history-header'}
                paddingVertical
                rightButtons={headerIcons}
                showBackButton={false}
                title={t('History')}
              />

              <div className={'__page-background'}></div>
            </>
          )}

          {
            isWebUI && (
              <div className={'__page-tool-area-desktop'}>
                <FilterTabs
                  className={'__page-filter-tabs-container'}
                  items={filterTabItems}
                  onSelect={onSelectFilterTab}
                  selectedItem={selectedFilterTab}
                />

                <div className={'__page-selection-area'}>
                  <Button
                    icon={(
                      <Icon
                        phosphorIcon={FadersHorizontal}
                      />
                    )}
                    onClick={onClickFilter}
                    size={'xs'}
                    type={'ghost'}
                  />
                  {historySelectorsNode}
                </div>
              </div>
            )
          }

          {
            !isWebUI && (
              <div className={'__page-tool-area-mobile'}>
                {historySelectorsNode}
              </div>
            )
          }

          {listSection}
        </Layout.Base>
      </PageWrapper>

      <HistoryDetailModal
        data={selectedItem}
        onCancel={onCloseDetail}
      />

      <FilterModal
        id={FILTER_MODAL_ID}
        onApplyFilter={_onApplyFilter}
        onCancel={onCloseFilterModal}
        onChangeOption={onChangeFilterOption}
        optionSelectionMap={filterSelectionMap}
        options={filterOptions}
      />
    </>
  );
}

const History = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    display: 'flex',
    flexDirection: 'column',

    '.__page-tool-area-desktop': {
      display: 'flex',
      marginBottom: 24
    },

    '.__page-background': {
      position: 'relative',
      zIndex: 1,

      '&:before': {
        content: '""',
        display: 'block',
        height: 190,
        top: 0,
        left: 0,
        right: 0,
        position: 'absolute',
        background: 'linear-gradient(180deg, rgba(76, 234, 172, 0.10) 0%, rgba(76, 234, 172, 0.00) 94.17%)'
      }
    },

    '.__page-tool-area-mobile': {
      display: 'flex',
      padding: token.padding,
      paddingTop: 0,
      borderBottomLeftRadius: token.size,
      borderBottomRightRadius: token.size,
      backgroundColor: token.colorBgDefault,
      gap: token.sizeSM,
      position: 'relative',
      zIndex: 2,

      '.__history-address-selector, .__history-chain-selector': {
        height: 40,
        flex: 1,
        flexBasis: '50%',
        borderRadius: 32,
        overflow: 'hidden',

        '&:before': {
          display: 'none'
        },

        '.ant-select-modal-input-wrapper': {
          paddingLeft: token.padding,
          paddingRight: token.padding
        }
      },

      '.__history-address-selector': {
        '.__selected-item-address': {
          display: 'none'
        }
      }
    },

    '.__loading-area': { display: 'flex', flex: 1, justifyContent: 'center', alignItems: 'center', height: '100%' },

    '.__page-selection-area': {
      display: 'flex',
      flex: 1,
      justifyContent: 'flex-end',
      alignItems: 'center',
      gap: token.sizeXS,

      '.__history-address-selector, .__history-chain-selector': {
        height: 48
      },

      '.__history-address-selector': {
        maxWidth: 280
      },

      '.__history-chain-selector': {
        maxWidth: 244
      }
    },

    '.__page-list-area': {
      flex: 1,
      overflow: 'auto',
      position: 'relative',
      zIndex: 2
    },

    '.ant-sw-list': {
      height: '100%',
      overflow: 'auto',
      paddingBottom: token.padding,
      paddingLeft: token.padding,
      paddingRight: token.padding,
      paddingTop: token.paddingSM,

      '.__infinite-loader': {
        opacity: 0
      }
    },

    '.ant-sw-screen-layout-body': {
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    },

    '.history-header.ant-sw-sub-header-container': {
      marginBottom: 0
    },

    '.ant-sw-list-section': {
      flex: 1
    },
    '.ant-sw-sub-header-container': {
      marginBottom: token.marginXS
    },
    '.history-item + .history-item, .history-item + .___list-separator': {
      marginTop: token.marginXS
    },
    '.___list-separator': {
      fontSize: token.fontSizeSM,
      lineHeight: token.lineHeightSM,
      color: token.colorTextLight3,
      fontWeight: token.headingFontWeight,
      marginBottom: token.marginXS
    },

    '&.-desktop': {
      '.ant-sw-list': {
        paddingLeft: 0,
        paddingRight: 0,
        paddingTop: 0
      }
    }
  });
});

export default History;
