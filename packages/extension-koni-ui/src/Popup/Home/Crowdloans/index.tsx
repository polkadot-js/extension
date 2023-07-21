// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset, _MultiChainAsset } from '@subwallet/chain-list/types';
import { CrowdloanParaState } from '@subwallet/extension-base/background/KoniTypes';
import { FilterModal, Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import EmptyList from '@subwallet/extension-koni-ui/components/EmptyList';
import NoContent, { PAGE_TYPE } from '@subwallet/extension-koni-ui/components/NoContent';
import Search from '@subwallet/extension-koni-ui/components/Search';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { HomeContext } from '@subwallet/extension-koni-ui/contexts/screen/HomeContext';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { useFilterModal } from '@subwallet/extension-koni-ui/hooks/modal/useFilterModal';
import useGetCrowdloanList from '@subwallet/extension-koni-ui/hooks/screen/crowdloan/useGetCrowdloanList';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { GlobalToken } from '@subwallet/extension-koni-ui/themes';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { TokenBalanceItemType } from '@subwallet/extension-koni-ui/types/balance';
import { CrowdloanItemType } from '@subwallet/extension-koni-ui/types/crowdloan';
import { CrowdloanItem, Icon, Logo, ModalContext, Number, SwList, Table, Tag } from '@subwallet/react-ui';
import { FadersHorizontal, Rocket } from 'phosphor-react';
import React, { SyntheticEvent, useCallback, useContext, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import styled, { ThemeContext } from 'styled-components';

type Props = ThemeProps;

enum FilterValue {
  POLKADOT_PARACHAIN = 'Polkadot parachain',
  KUSAMA_PARACHAIN = 'Kusama parachain',
  WINNER = 'completed',
  FAIL = 'failed'
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
  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, selectedFilters } = useFilterModal(FILTER_MODAL_ID);

  const { accountBalance: { tokenGroupBalanceMap } } = useContext(HomeContext);
  const assetRegistryMap = useSelector((state: RootState) => state.assetRegistry.assetRegistry);
  const multiChainAssetMap = useSelector((state: RootState) => state.assetRegistry.multiChainAssetMap);

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
    return items.filter(filterFunction).filter((item: CrowdloanItemType) => searchFunction(item, searchInput));
  }, [filterFunction, items, searchFunction, searchInput]);

  // render item
  const getParaStateLabel = useCallback((paraState?: CrowdloanParaState) => {
    if (!paraState) {
      return '';
    }

    if (paraState.valueOf() === CrowdloanParaState.COMPLETED.valueOf()) {
      return isWebUI ? t('Winner') : t('Win');
    }

    if (paraState === CrowdloanParaState.FAILED.valueOf()) {
      return t('Fail');
    }

    if (paraState === CrowdloanParaState.ONGOING.valueOf()) {
      return t('Active');
    }

    return '';
  }, [isWebUI, t]);

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
          isShowSubLogo={true}
          key={`${item.symbol}_${item.slug}`}
          networkKey={item.slug}
          paraChain={item.relayParentDisplayName}
          subNetworkKey={getRelayParentKey(item.relayParentDisplayName)}
        />
      );
    },
    [getParaStateLabel]
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

  const currentChainBalance = useCallback((crowdloanItem: CrowdloanItemType) => {
    const currentChainAsset: _MultiChainAsset | _ChainAsset | undefined = Object.values(multiChainAssetMap).find((item) => item.name === crowdloanItem.chainDisplayName) || Object.values(assetRegistryMap).find((item) => item.name === crowdloanItem.chainDisplayName);

    if (!currentChainAsset) {
      return undefined;
    }

    const currentChainBalance: TokenBalanceItemType = tokenGroupBalanceMap[currentChainAsset.slug];

    return currentChainBalance;
  }, [assetRegistryMap, multiChainAssetMap, tokenGroupBalanceMap]);

  const columns = useMemo(() => {
    return [
      {
        title: 'Project name',
        dataIndex: 'name',
        key: 'name',
        render: (_, row: CrowdloanItemType) => {
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
        render: (_, item: CrowdloanItemType) => {
          return <Tag color={getTagColor(item.paraState)}>{getParaStateLabel(item.paraState)}</Tag>;
        }
      },
      {
        title: 'Price',
        dataIndex: 'price',
        key: 'price',
        render: (_, row: CrowdloanItemType) => {
          // TODO: update priceChangeStatus
          const currentChainInfo = currentChainBalance(row);

          if (!currentChainInfo) {
            return <></>;
          }

          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
          const marginColor: string = currentChainInfo?.priceChangeStatus === 'increase' ? theme.token?.colorSuccess : theme.token?.colorError;
          const { price24hValue, priceValue } = currentChainInfo;
          const margin = !price24hValue || !priceValue ? 0 : Math.abs(price24hValue - priceValue) / price24hValue * 100;

          return (
            <div className={'price-wrapper'}>
              <Number
                decimal={0}
                decimalOpacity={0.45}
                prefix={'$'}
                value={currentChainInfo?.priceValue}
              />
              <Number
                className='margin-percentage'
                decimal={0}
                decimalColor={marginColor}
                intColor={marginColor}
                prefix={currentChainInfo?.priceChangeStatus === 'decrease' ? '-' : '+'}
                size={12}
                suffix='%'
                unitColor={marginColor}
                value={margin}
              />
            </div>
          );
        }
      },
      {
        title: 'Contribute',
        dataIndex: 'contribute',
        key: 'contribute',
        render: (_, row: CrowdloanItemType) => {
          return (
            <div className={''}>
              <Number
                decimal={0}
                decimalOpacity={0.45}
                suffix={row.symbol}
                value={row.contribute}
              />
              <Number
                decimal={0}
                decimalOpacity={0.45}
                prefix='$'
                size={12}
                value={row.convertedContribute}
              />
            </div>
          );
        }
      }
    ];
  }, [currentChainBalance, getParaStateLabel, theme.token?.colorError, theme.token?.colorSuccess]);

  const crowdloansContent = useMemo(() => {
    console.log('filteredItems', filteredItems.length);

    if (isWebUI) {
      return (
        <div className='web-list'>
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

          <div className='web-container'>
            {filteredItems.length > 0
              ? (
                <Table
                  columns={columns}
                  dataSource={filteredItems}
                  pagination={false}
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
  }, [handleSearch, searchInput, columns, filteredItems, emptyCrowdloanList, filterFunction, isWebUI, items, onClickActionBtn, renderItem, searchFunction, t]);

  return (
    <PageWrapper
      className={`crowdloans ${className}`}
      resolve={dataContext.awaitStores(['crowdloan', 'price', 'chainStore'])}
    >
      <Layout.Base
        {...!isWebUI && {
          title: t<string>('Crowdloans'),
          subHeaderBackground: 'transparent',
          subHeaderCenter: false,
          subHeaderPaddingVertical: true,
          showSubHeader: true
        }}
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
