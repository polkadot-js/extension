// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _FundStatus } from '@subwallet/chain-list/types';
import { FilterModal, Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import CrowdloanTable from '@subwallet/extension-koni-ui/components/CrowdloanTable';
import { FilterTabItemType, FilterTabs } from '@subwallet/extension-koni-ui/components/FilterTabs';
import NoContent, { PAGE_TYPE } from '@subwallet/extension-koni-ui/components/NoContent';
import Search from '@subwallet/extension-koni-ui/components/Search';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { useSelector, useSetCurrentPage } from '@subwallet/extension-koni-ui/hooks';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { useFilterModal } from '@subwallet/extension-koni-ui/hooks/modal/useFilterModal';
import useGetCrowdloanList from '@subwallet/extension-koni-ui/hooks/screen/crowdloan/useGetCrowdloanList';
import { _CrowdloanItemType, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Icon, ModalContext } from '@subwallet/react-ui';
import { FadersHorizontal } from 'phosphor-react';
import React, { SyntheticEvent, useCallback, useContext, useMemo, useState } from 'react';
import styled from 'styled-components';

type Props = ThemeProps;

enum FilterValue {
  ALL = 'all',
  POLKADOT_PARACHAIN = 'Polkadot parachain',
  KUSAMA_PARACHAIN = 'Kusama parachain',
  WON = 'won',
  IN_AUCTION = 'in auction'
}

const FILTER_MODAL_ID = 'crowdloan-filter-modal';

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  useSetCurrentPage('/home/crowdloans');
  const { t } = useTranslation();
  const dataContext = useContext(DataContext);
  const items: _CrowdloanItemType[] = useGetCrowdloanList();
  const { isWebUI } = useContext(ScreenContext);

  const [searchInput, setSearchInput] = useState<string>('');
  const { activeModal } = useContext(ModalContext);

  const { isShowBalance } = useSelector((state) => state.settings);

  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, selectedFilters } = useFilterModal(FILTER_MODAL_ID);
  const [selectedFilterTab, setSelectedFilterTab] = useState<string>(FilterValue.ALL);

  const filterOptions = useMemo(() => [
    { label: t('Polkadot parachain'), value: FilterValue.POLKADOT_PARACHAIN },
    { label: t('Kusama parachain'), value: FilterValue.KUSAMA_PARACHAIN },
    { label: t('Won'), value: FilterValue.WON }
  ], [t]);

  const filterFunction = useMemo<(item: _CrowdloanItemType) => boolean>(() => {
    return (item) => {
      if (!selectedFilters.length) {
        return true;
      }

      for (const filter of selectedFilters) {
        if (filter === FilterValue.POLKADOT_PARACHAIN) {
          if (item.relayChainSlug === 'polkadot') {
            return true;
          }
        } else if (filter === FilterValue.KUSAMA_PARACHAIN) {
          if (item.relayChainSlug === 'kusama') {
            return true;
          }
        } else if (filter === FilterValue.WON) {
          if (item.fundStatus === _FundStatus.WON) {
            return true;
          }
        } else if (filter === FilterValue.IN_AUCTION) {
          if (item.fundStatus === _FundStatus.IN_AUCTION) {
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

  const searchFunction = useCallback((item: _CrowdloanItemType, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      item.chainName.toLowerCase().includes(searchTextLowerCase)
    );
  }, []);

  const filteredItems = useMemo(() => {
    const filterTabFunction = (item: _CrowdloanItemType) => {
      if (selectedFilterTab === FilterValue.ALL) {
        return true;
      }

      if (selectedFilterTab === FilterValue.WON) {
        return item.fundStatus === _FundStatus.WON;
      }

      if (selectedFilterTab === FilterValue.IN_AUCTION) {
        return item.fundStatus === _FundStatus.IN_AUCTION;
      }

      return false;
    };

    const _filterFunction = (_item: _CrowdloanItemType) => {
      return filterTabFunction(_item) && filterFunction(_item) && searchFunction(_item, searchInput);
    };

    return items.filter(_filterFunction);
  }, [filterFunction, items, searchFunction, searchInput, selectedFilterTab]);

  const handleSearch = useCallback((value: string) => setSearchInput(value), [setSearchInput]);

  const filterTabItems = useMemo<FilterTabItemType[]>(() => {
    return [
      {
        label: t('All'),
        value: FilterValue.ALL
      },
      {
        label: t('In Auction'),
        value: FilterValue.IN_AUCTION
      },
      {
        label: t('Won'),
        value: FilterValue.WON
      }
    ];
  }, [t]);

  const onSelectFilterTab = useCallback((value: string) => {
    setSelectedFilterTab(value);
  }, []);

  const crowdloansContent = useMemo(() => {
    return (
      <div className='web-list'>
        <div className='web-list-tool-area'>
          {
            isWebUI && (
              <FilterTabs
                className={'filter-tabs-container'}
                items={filterTabItems}
                onSelect={onSelectFilterTab}
                selectedItem={selectedFilterTab}
              />
            )
          }

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
              <CrowdloanTable
                className={'__crowdloan-table'}
                hideBalance={!isShowBalance}
                items={filteredItems}
              />
            )
            : (
              <NoContent pageType={PAGE_TYPE.CROWDLOANS} />
            )}
        </div>
      </div>
    );
  }, [isWebUI, filterTabItems, onSelectFilterTab, selectedFilterTab, onClickActionBtn, handleSearch, searchInput, filteredItems, isShowBalance]);

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
        alignItems: 'center',
        paddingBottom: 24,
        position: 'sticky',
        top: 0,
        zIndex: 50,
        backgroundColor: token.colorBgDefault
      },

      '.web-container': {
        height: '100%'
      },

      '.search-container': {
        width: 'auto',
        flex: 1
      }
    },

    '.__crowdloan-table': {
      paddingBottom: token.sizeXS
    },

    '@media (max-width: 991px)': {
      '.right-section, .right-section .search-input': {
        width: '100%'
      },

      '.web-list': {
        paddingLeft: token.padding,
        paddingRight: token.padding,

        '.web-list-tool-area': {
          paddingBottom: token.padding
        }
      }
    }
  });
});

export default Crowdloans;
