// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicStatus, ExtrinsicType, TransactionDirection, TransactionHistoryItem } from '@subwallet/extension-base/background/KoniTypes';
import { isAccountAll } from '@subwallet/extension-base/utils';
import { quickFormatAddressToCompare } from '@subwallet/extension-base/utils/address';
import { EmptyList, FilterModal, HistoryItem, Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import { FilterTabItemType, FilterTabs } from '@subwallet/extension-koni-ui/components/FilterTabs';
import NoContent, { PAGE_TYPE } from '@subwallet/extension-koni-ui/components/NoContent';
import Search from '@subwallet/extension-koni-ui/components/Search';
import { HISTORY_DETAIL_MODAL } from '@subwallet/extension-koni-ui/constants';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { useFilterModal, useSelector } from '@subwallet/extension-koni-ui/hooks';
import { ThemeProps, TransactionHistoryDisplayData, TransactionHistoryDisplayItem } from '@subwallet/extension-koni-ui/types';
import { customFormatDate, formatHistoryDate, isTypeStaking, isTypeTransfer } from '@subwallet/extension-koni-ui/utils';
import { Icon, ModalContext, SwIconProps, SwList, SwSubHeader } from '@subwallet/react-ui';
import { Aperture, ArrowDownLeft, ArrowUpRight, Clock, ClockCounterClockwise, Database, FadersHorizontal, Rocket, Spinner } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import styled from 'styled-components';

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
  default: ClockCounterClockwise
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
}

function getHistoryItemKey (item: Pick<TransactionHistoryItem, 'chain' | 'address' | 'extrinsicHash' | 'transactionId'>) {
  return `${item.chain}-${item.address}-${item.transactionId || item.extrinsicHash}`;
}

const modalId = HISTORY_DETAIL_MODAL;

const LIST_KEY = 'history-list';

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const dataContext = useContext(DataContext);
  const { isWebUI } = useContext(ScreenContext);
  const { activeModal, checkActive, inactiveModal } = useContext(ModalContext);
  const { accounts, currentAccount } = useSelector((root) => root.accountState);
  const { historyList: rawHistoryList } = useSelector((root) => root.transactionHistory);
  const [searchInput, setSearchInput] = useState<string>('');
  const { chainInfoMap } = useSelector((root) => root.chainStore);
  const { language } = useSelector((root) => root.settings);
  const [selectedFilterTab, setSelectedFilterTab] = useState<string>(FilterValue.ALL);
  const [listKey, setListKey] = useState<string>(LIST_KEY);

  const isActive = checkActive(modalId);

  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, selectedFilters } = useFilterModal(FILTER_MODAL_ID);

  const filterFunction = useMemo<(item: TransactionHistoryDisplayItem) => boolean>(() => {
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
        } else if (filter === FilterValue.SUCCESSFUL) {
          if (item.status === ExtrinsicStatus.SUCCESS) {
            return true;
          }
        } else if (filter === FilterValue.FAILED) {
          if (item.status === ExtrinsicStatus.FAIL) {
            return true;
          }
        }
      }

      return false;
    };
  }, [selectedFilters]);

  const filterOptions = useMemo(() => {
    return [
      { label: t('Send token'), value: FilterValue.SEND },
      { label: t('Receive token'), value: FilterValue.RECEIVED },
      { label: t('NFT transaction'), value: FilterValue.NFT },
      { label: t('Stake transaction'), value: FilterValue.STAKE },
      { label: t('Claim staking reward'), value: FilterValue.CLAIM },
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

  const typeNameMap: Record<string, string> = useMemo(() => ({
    default: t('Transaction'),
    submitting: t('Submitting...'),
    processing: t('Processing...'),
    send: t('Send'),
    received: t('Receive'),
    [ExtrinsicType.SEND_NFT]: t('NFT'),
    [ExtrinsicType.CROWDLOAN]: t('Crowdloan'),
    [ExtrinsicType.STAKING_JOIN_POOL]: t('Stake'),
    [ExtrinsicType.STAKING_LEAVE_POOL]: t('Unstake'),
    [ExtrinsicType.STAKING_BOND]: t('Bond'),
    [ExtrinsicType.STAKING_UNBOND]: t('Unbond'),
    [ExtrinsicType.STAKING_CLAIM_REWARD]: t('Claim Reward'),
    [ExtrinsicType.STAKING_WITHDRAW]: t('Withdraw'),
    [ExtrinsicType.STAKING_CANCEL_UNSTAKE]: t('Cancel unstake'),
    [ExtrinsicType.EVM_EXECUTE]: t('EVM Transaction')
  }), [t]);

  const typeTitleMap: Record<string, string> = useMemo(() => ({
    default: t('Transaction'),
    send: t('Send token'),
    received: t('Receive token'),
    [ExtrinsicType.SEND_NFT]: t('NFT transaction'),
    [ExtrinsicType.CROWDLOAN]: t('Crowdloan transaction'),
    [ExtrinsicType.STAKING_JOIN_POOL]: t('Stake transaction'),
    [ExtrinsicType.STAKING_LEAVE_POOL]: t('Unstake transaction'),
    [ExtrinsicType.STAKING_BOND]: t('Bond transaction'),
    [ExtrinsicType.STAKING_UNBOND]: t('Unbond transaction'),
    [ExtrinsicType.STAKING_CLAIM_REWARD]: t('Claim Reward transaction'),
    [ExtrinsicType.STAKING_WITHDRAW]: t('Withdraw transaction'),
    [ExtrinsicType.STAKING_CANCEL_UNSTAKE]: t('Cancel unstake transaction'),
    [ExtrinsicType.EVM_EXECUTE]: t('EVM Transaction')
  }), [t]);

  // Fill display data to history list
  const historyMap = useMemo(() => {
    const currentAddress = currentAccount?.address || '';
    const currentAddressLowerCase = currentAddress.toLowerCase();
    const isFilterByAddress = currentAccount?.address && !isAccountAll(currentAddress);
    const finalHistoryMap: Record<string, TransactionHistoryDisplayItem> = {};

    rawHistoryList.forEach((item: TransactionHistoryItem) => {
      // Filter account by current account
      if (isFilterByAddress && currentAddressLowerCase !== quickFormatAddressToCompare(item.address)) {
        return;
      }

      // Format display name for account by address
      const fromName = accountMap[quickFormatAddressToCompare(item.from) || ''];
      const toName = accountMap[quickFormatAddressToCompare(item.to) || ''];
      const key = getHistoryItemKey(item);

      finalHistoryMap[key] = { ...item, fromName, toName, displayData: getDisplayData(item, typeNameMap, typeTitleMap) };
    });

    return finalHistoryMap;
  }, [accountMap, rawHistoryList, typeNameMap, typeTitleMap, currentAccount?.address]);

  const historyList = useMemo(() => {
    return Object.values(historyMap).sort((a, b) => (b.time - a.time));
  }, [historyMap]);

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

  const onClickActionBtn = useCallback(() => {
    activeModal(FILTER_MODAL_ID);
  }, [activeModal]);

  useEffect(() => {
    if (extrinsicHashOrId && chain && openDetailLink) {
      const existed = historyList.find((item) => item.chain === chain && (item.transactionId === extrinsicHashOrId || item.extrinsicHash === extrinsicHashOrId));

      if (existed) {
        setSelectedItem(existed);
        activeModal(modalId);
      }
    }
  }, [activeModal, chain, extrinsicHashOrId, openDetailLink, historyList]);

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

  const emptyList = useCallback(() => {
    if (isWebUI) {
      return <NoContent pageType={PAGE_TYPE.HISTORY} />;
    }

    return (
      <EmptyList
        emptyMessage={t('Your transaction history will appear here!')}
        emptyTitle={t('No transaction found')}
        phosphorIcon={Clock}
      />
    );
  }, [t, isWebUI]);

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

  const searchFunc = useCallback((item: TransactionHistoryItem, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();
    const fromName = item.fromName?.toLowerCase();
    const toName = item.toName?.toLowerCase();
    const symbol = (item.amount?.symbol || item.fee?.symbol || item.tip?.symbol)?.toLowerCase();
    const network = chainInfoMap[item.chain]?.name?.toLowerCase();

    return (
      fromName?.includes(searchTextLowerCase) ||
        toName?.includes(searchTextLowerCase) ||
        symbol?.includes(searchTextLowerCase) ||
        network?.includes(searchTextLowerCase)
    );
  }, [chainInfoMap]);

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
    setListKey(`${LIST_KEY}-${Date.now()}`);
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
        label: t('Staking'),
        value: FilterValue.STAKE
      }
    ];
  }, [t]);

  const webUiFilterFunction = useCallback((item: TransactionHistoryDisplayItem) => {
    const filterTabFunction = (_item: TransactionHistoryDisplayItem) => {
      if (selectedFilterTab === FilterValue.ALL) {
        return true;
      }

      if (selectedFilterTab === FilterValue.TOKENS) {
        return isTypeTransfer(_item.type);
      }

      if (selectedFilterTab === FilterValue.NFT) {
        return _item.type === ExtrinsicType.SEND_NFT;
      }

      if (selectedFilterTab === FilterValue.STAKE) {
        return isTypeStaking(_item.type);
      }

      return false;
    };

    return filterTabFunction(item) && filterFunction(item);
  }, [filterFunction, selectedFilterTab]);

  const _onApplyFilter = useCallback(() => {
    onApplyFilter();
    setListKey(`${LIST_KEY}-${Date.now()}`);
  }, [onApplyFilter]);

  const listSection = useMemo(() => {
    if (isWebUI) {
      return (
        <div className='web-list'>
          <div className='web-list-tool-area'>
            <FilterTabs
              className={'filter-tabs-container'}
              items={filterTabItems}
              onSelect={onSelectFilterTab}
              selectedItem={selectedFilterTab}
            />

            <Search
              actionBtnIcon={<Icon phosphorIcon={FadersHorizontal} />}
              onClickActionBtn={onClickActionBtn}
              onSearch={setSearchInput}
              placeholder={'Chain, Address, Type,...'}
              searchValue={searchInput}
              showActionBtn
            />
          </div>
          <SwList
            filterBy={webUiFilterFunction}
            groupBy={groupBy}
            groupSeparator={groupSeparator}
            key={listKey}
            list={historyList}
            renderItem={renderItem}
            renderWhenEmpty={emptyList}
            searchBy={searchFunc}
            searchMinCharactersCount={2}
            searchTerm={searchInput}
          />
        </div>
      );
    }

    return (
      <SwList.Section
        actionBtnIcon={<Icon phosphorIcon={FadersHorizontal} />}
        enableSearchInput
        filterBy={filterFunction}
        groupBy={groupBy}
        groupSeparator={groupSeparator}
        list={historyList}
        onClickActionBtn={onClickActionBtn}
        renderItem={renderItem}
        renderWhenEmpty={emptyList}
        searchFunction={searchFunc}
        searchMinCharactersCount={2}
        searchPlaceholder={t<string>('Search history')}
        showActionBtn
      />
    );
  }, [emptyList, filterFunction, filterTabItems, groupBy, groupSeparator, historyList, isWebUI, listKey, onClickActionBtn, onSelectFilterTab, renderItem, searchFunc, searchInput, selectedFilterTab, t, webUiFilterFunction]);

  return (
    <>
      <PageWrapper
        className={`history ${className}`}
        resolve={dataContext.awaitStores(['transactionHistory', 'price'])}
      >
        <Layout.Base
          title={t('History')}
        >
          {!isWebUI && (
            <SwSubHeader
              background={'transparent'}
              center={false}
              className={'history-header'}
              paddingVertical
              showBackButton={false}
              title={t('History')}
            />
          )}

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

    '.web-list': {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',

      '.web-list-tool-area': {
        display: 'flex',
        gap: token.size,
        alignItems: 'center'
      },

      '.ant-sw-list': {
        marginTop: 24,
        flex: 1
      }
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
    }
  });
});

export default History;
