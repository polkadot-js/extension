// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CrowdloanParaState } from '@subwallet/extension-base/background/KoniTypes';
import { FilterModal, Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import EmptyList from '@subwallet/extension-koni-ui/components/EmptyList';
import { FilterTabItemType, FilterTabs } from '@subwallet/extension-koni-ui/components/FilterTabs';
import NoContent, { PAGE_TYPE } from '@subwallet/extension-koni-ui/components/NoContent';
import Search from '@subwallet/extension-koni-ui/components/Search';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { useSelector } from '@subwallet/extension-koni-ui/hooks';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { useFilterModal } from '@subwallet/extension-koni-ui/hooks/modal/useFilterModal';
import useGetCrowdloanList from '@subwallet/extension-koni-ui/hooks/screen/crowdloan/useGetCrowdloanList';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { GlobalToken } from '@subwallet/extension-koni-ui/themes';
import { PriceChangeStatus, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { CrowdloanItemType } from '@subwallet/extension-koni-ui/types/crowdloan';
import { CrowdloanItem, Icon, Logo, ModalContext, Number, SwList, Table, Tag } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import { FadersHorizontal, Rocket } from 'phosphor-react';
import React, { SyntheticEvent, useCallback, useContext, useMemo, useState } from 'react';
import styled, { ThemeContext } from 'styled-components';

type Props = ThemeProps;

enum FilterValue {
  ALL = 'all',
  POLKADOT_PARACHAIN = 'Polkadot parachain',
  KUSAMA_PARACHAIN = 'Kusama parachain',
  WINNER = 'completed',
  FAIL = 'failed',
  ACTIVE = 'active'
}

function getTagColor (paraState?: CrowdloanParaState) {
  if (!paraState) {
    return 'default';
  }

  if (paraState.valueOf() === CrowdloanParaState.COMPLETED.valueOf()) {
    return 'success';
  }

  if (paraState === CrowdloanParaState.FAILED.valueOf()) {
    return 'error';
  }

  if (paraState === CrowdloanParaState.ONGOING.valueOf()) {
    return 'warning';
  }

  return 'default';
}

function getRelayParentKey (groupDisplayName: string) {
  if (groupDisplayName === 'Polkadot parachain') {
    return 'polkadot';
  } else {
    return 'kusama';
  }
}

const FILTER_MODAL_ID = 'crowdloan-filter-modal';

type PriceChange = {
  value: BigN,
  changePercent: BigN,
  changeStatus?: PriceChangeStatus,
};

type PriceChangeMap = Record<string, PriceChange>;

const BN_0 = new BigN(0);
const BN_100 = new BigN(100);

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const dataContext = useContext(DataContext);
  const { isWebUI } = useContext(ScreenContext);
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const theme: {
    token: GlobalToken
  } = useContext(ThemeContext);
  const items: CrowdloanItemType[] = useGetCrowdloanList();

  const [searchInput, setSearchInput] = useState<string>('');
  const { activeModal } = useContext(ModalContext);

  const { isShowBalance } = useSelector((state) => state.settings);

  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, selectedFilters } = useFilterModal(FILTER_MODAL_ID);
  const priceMap = useSelector((state: RootState) => state.price.priceMap);
  const price24hMap = useSelector((state: RootState) => state.price.price24hMap);
  const [selectedFilterTab, setSelectedFilterTab] = useState<string>(FilterValue.ALL);

  const filterOptions = useMemo(() => [
    { label: t('Polkadot parachain'), value: FilterValue.POLKADOT_PARACHAIN },
    { label: t('Kusama parachain'), value: FilterValue.KUSAMA_PARACHAIN },
    { label: t('Win'), value: FilterValue.WINNER },
    { label: t('Fail'), value: FilterValue.FAIL }
  ], [t]);

  const filterFunction = useMemo<(item: CrowdloanItemType) => boolean>(() => {
    return (item) => {
      if (!selectedFilters.length) {
        return true;
      }

      for (const filter of selectedFilters) {
        if (filter === FilterValue.POLKADOT_PARACHAIN) {
          if (item.relayParentDisplayName === 'Polkadot parachain') {
            return true;
          }
        } else if (filter === FilterValue.KUSAMA_PARACHAIN) {
          if (item.relayParentDisplayName === 'Kusama parachain') {
            return true;
          }
        } else if (filter === FilterValue.WINNER) {
          if (item.paraState === CrowdloanParaState.COMPLETED) {
            return true;
          }
        } else if (filter === FilterValue.FAIL) {
          if (item.paraState === CrowdloanParaState.FAILED) {
            return true;
          }
        }
      }

      return false;
    };
  }, [selectedFilters]);

  // filter
  const onClickActionBtn = useCallback(
    (e?: SyntheticEvent) => {
      e && e.stopPropagation();
      activeModal(FILTER_MODAL_ID);
    },
    [activeModal]
  );

  const searchFunction = useCallback((item: CrowdloanItemType, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      item.chainDisplayName.toLowerCase().includes(searchTextLowerCase)
    );
  }, []);

  const filteredItems = useMemo(() => {
    const filterTabFunction = (item: CrowdloanItemType) => {
      if (selectedFilterTab === FilterValue.ALL) {
        return true;
      }

      if (selectedFilterTab === FilterValue.WINNER) {
        return item.paraState === CrowdloanParaState.COMPLETED;
      }

      if (selectedFilterTab === FilterValue.ACTIVE) {
        return item.paraState === CrowdloanParaState.ONGOING;
      }

      return false;
    };

    const _filterFunction = (_item: CrowdloanItemType) => {
      return filterTabFunction(_item) && filterFunction(_item) && searchFunction(_item, searchInput);
    };

    return items.filter(_filterFunction);
  }, [filterFunction, items, searchFunction, searchInput, selectedFilterTab]);

  // render item
  const getParaStateLabel = useCallback((paraState?: CrowdloanParaState) => {
    if (!paraState) {
      return '';
    }

    if (paraState.valueOf() === CrowdloanParaState.COMPLETED.valueOf()) {
      return t('Win');
    }

    if (paraState === CrowdloanParaState.FAILED.valueOf()) {
      return t('Fail');
    }

    if (paraState === CrowdloanParaState.ONGOING.valueOf()) {
      return t('Active');
    }

    return '';
  }, [t]);

  const renderItem = useCallback(
    (item: CrowdloanItemType) => {
      return (
        <CrowdloanItem
          balanceValue={item.contribute}
          className={'crowdloan-item'}
          convertedBalanceValue={item.convertedContribute}
          crowdloanStatusTag={
            <Tag color={getTagColor(item.paraState)}>{getParaStateLabel(item.paraState)}</Tag>
          }
          decimal={0}
          displayNetwork={item.chainDisplayName}
          displayToken={item.symbol}
          hideBalance={!isShowBalance}
          isShowSubLogo={true}
          key={`${item.symbol}_${item.slug}`}
          networkKey={item.slug}
          paraChain={item.relayParentDisplayName}
          subNetworkKey={getRelayParentKey(item.relayParentDisplayName)}
        />
      );
    },
    [getParaStateLabel, isShowBalance]
  );

  // empty list
  const emptyCrowdloanList = useCallback(
    () => {
      return (
        <EmptyList
          emptyMessage={t('Your crowdloan will appear here!')}
          emptyTitle={t('No crowdloan')}
          phosphorIcon={Rocket}
        />
      );
    },
    [t]
  );

  const handleSearch = useCallback((value: string) => setSearchInput(value), [setSearchInput]);

  const getPriceChangeInfo = useCallback((chain: string): PriceChange => {
    const priceValue = new BigN(priceMap[chain] || 0);
    const price24Value = new BigN(price24hMap[chain] || 0);

    let change = BN_0;
    let changePercent = BN_0;
    let changeStatus: PriceChangeStatus | undefined;

    if (priceValue.gt(price24Value)) {
      change = priceValue.minus(price24Value);
      changeStatus = 'increase';
    } else if (price24Value.gt(priceValue)) {
      change = price24Value.minus(priceValue);
      changeStatus = 'decrease';
    }

    if (!change.eq(0)) {
      changePercent = change.multipliedBy(BN_100).dividedBy(price24Value);
    }

    return {
      value: priceValue,
      changePercent,
      changeStatus
    };
  }, [price24hMap, priceMap]);

  const priceChangeMap = useMemo<PriceChangeMap>(() => {
    return {
      polkadot: getPriceChangeInfo('polkadot'),
      kusama: getPriceChangeInfo('kusama')
    };
  }, [getPriceChangeInfo]);

  const columns = useMemo(() => {
    return [
      {
        title: 'Project name',
        dataIndex: 'name',
        key: 'name',
        render: (_: any, row: CrowdloanItemType) => {
          return <div className='project-container'>
            <Logo
              isShowSubLogo={true}
              network={row.slug}
              shape={'squircle'}
              size={40}
              subLogoShape={'circle'}
              subNetwork={getRelayParentKey(row.relayParentDisplayName)}
            />
            <div className='project-information'>
              <div className={'project-name'}>{row.chainDisplayName}</div>
              <div className={'project-parachain'}>{row.relayParentDisplayName}</div>
            </div>
          </div>;
        }
      },
      {
        title: () => (
          <span
            style={{
              padding: '0 20px'
            }}
          >
            Status
          </span>
        ),
        dataIndex: 'status',
        key: 'status',
        render: (_: any, item: CrowdloanItemType) => {
          return <Tag color={getTagColor(item.paraState)}>{getParaStateLabel(item.paraState)}</Tag>;
        }
      },
      {
        title: 'Price',
        dataIndex: 'price',
        key: 'price',
        render: (_: any, row: CrowdloanItemType) => {
          const priceChangeInfo = priceChangeMap[row.relayParent];

          if (!priceChangeInfo) {
            return <></>;
          }

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          const marginColor: string = priceChangeInfo.changeStatus === 'decrease' ? theme.token?.colorError : theme.token?.colorSuccess;

          return (
            <div className={'price-wrapper'}>
              <Number
                decimal={0}
                decimalOpacity={0.45}
                prefix={'$'}
                value={priceChangeInfo?.value}
              />
              <Number
                className='margin-percentage'
                decimal={0}
                decimalColor={marginColor}
                intColor={marginColor}
                prefix={priceChangeInfo?.changeStatus === 'decrease' ? '-' : '+'}
                size={12}
                suffix='%'
                unitColor={marginColor}
                value={priceChangeInfo?.changePercent}
              />
            </div>
          );
        }
      },
      {
        title: 'Contribute',
        dataIndex: 'contribute',
        key: 'contribute',
        render: (_: any, row: CrowdloanItemType) => {
          return (
            <div className={''}>
              <Number
                decimal={0}
                decimalOpacity={0.45}
                hide={!isShowBalance}
                suffix={row.symbol}
                value={row.contribute}
              />
              <Number
                decimal={0}
                decimalOpacity={0.45}
                hide={!isShowBalance}
                prefix='$'
                size={12}
                value={row.convertedContribute}
              />
            </div>
          );
        }
      }
    ];
  }, [getParaStateLabel, isShowBalance, priceChangeMap, theme.token?.colorError, theme.token?.colorSuccess]);

  const filterTabItems = useMemo<FilterTabItemType[]>(() => {
    return [
      {
        label: t('All'),
        value: FilterValue.ALL
      },
      {
        label: t('Active'),
        value: FilterValue.ACTIVE
      },
      {
        label: t('Winner'),
        value: FilterValue.WINNER
      }
    ];
  }, [t]);

  const onSelectFilterTab = useCallback((value: string) => {
    setSelectedFilterTab(value);
  }, []);

  const crowdloansContent = useMemo(() => {
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
              actionBtnIcon={(
                <Icon
                  phosphorIcon={FadersHorizontal}
                  size='sm'
                />
              )}
              onClickActionBtn={onClickActionBtn}
              onSearch={handleSearch}
              placeholder={'Token name'}
              searchValue={searchInput}
              showActionBtn
            />
          </div>

          <div className='web-container'>
            {filteredItems.length > 0
              ? (
                <Table
                  columns={columns}
                  dataSource={filteredItems}
                  pagination={false}
                  rowKey={'slug'}
                />
              )
              : (
                <NoContent pageType={PAGE_TYPE.CROWDLOANS} />
              )}
          </div>

        </div>
      );
    }

    return (
      <SwList.Section
        actionBtnIcon={<Icon phosphorIcon={FadersHorizontal} />}
        enableSearchInput
        filterBy={filterFunction}
        list={items}
        onClickActionBtn={onClickActionBtn}
        renderItem={renderItem}
        renderWhenEmpty={emptyCrowdloanList}
        searchFunction={searchFunction}
        searchMinCharactersCount={2}
        searchPlaceholder={t<string>('Search project')}
        showActionBtn
      />

    );
  }, [isWebUI, filterFunction, items, onClickActionBtn, renderItem, emptyCrowdloanList, searchFunction, t, filterTabItems, onSelectFilterTab, selectedFilterTab, handleSearch, searchInput, filteredItems, columns]);

  return (
    <PageWrapper
      className={`crowdloans ${className}`}
      resolve={dataContext.awaitStores(['crowdloan', 'price', 'chainStore'])}
    >
      <Layout.Base
        showSubHeader={true}
        subHeaderBackground={'transparent'}
        subHeaderCenter={false}
        subHeaderPaddingVertical={true}
        title={t<string>('Crowdloans')}
      >
        {crowdloansContent}
        <FilterModal
          applyFilterButtonTitle={t('Apply filter')}
          id={FILTER_MODAL_ID}
          onApplyFilter={onApplyFilter}
          onCancel={onCloseFilterModal}
          onChangeOption={onChangeFilterOption}
          optionSelectionMap={filterSelectionMap}
          options={filterOptions}
          title={t('Filter')}
        />
      </Layout.Base>
    </PageWrapper>
  );
}

const Crowdloans = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    color: token.colorTextLight1,
    fontSize: token.fontSizeLG,

    '.ant-sw-screen-layout-body': {
      display: 'flex',
      flexDirection: 'column'
    },

    '.web-list': {
      flex: 1,
      display: 'flex',
      flexDirection: 'column',

      '.web-list-tool-area': {
        display: 'flex',
        gap: token.size,
        alignItems: 'center'
      },

      '.web-container': {
        height: '100%',
        marginTop: 24
      }
    },

    '.project-container': {
      display: 'flex',
      gap: 16,

      '.project-information': {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        paddingRight: token.paddingXS,

        '.project-name': {
          fontSize: token.fontSizeLG,
          lineHeight: token.lineHeightLG,
          fontWeight: 600,
          color: token.colorTextLight1,
          paddingRight: 8,
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis'
        },

        '.project-parachain': {
          fontSize: token.fontSizeSM,
          lineHeight: token.lineHeightSM,
          fontWeight: 500,
          color: token.colorTextLight4
        }
      }
    },
    '.crowdloan-item': {
      marginBottom: token.marginXS
    },

    '.crowdloan__filter_option': {
      width: '100%'
    },

    '.crowdloan__filter_option_wrapper': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.marginLG
    },

    '.ant-sw-list-section': {
      height: '100%'
    }
  });
});

export default Crowdloans;
