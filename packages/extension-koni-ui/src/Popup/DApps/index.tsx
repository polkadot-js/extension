// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { FilterModal } from '@subwallet/extension-koni-ui/components';
import { FilterTabItemType, FilterTabs } from '@subwallet/extension-koni-ui/components/FilterTabs';
import NoContent, { PAGE_TYPE } from '@subwallet/extension-koni-ui/components/NoContent';
import Search from '@subwallet/extension-koni-ui/components/Search';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { WebUIContext } from '@subwallet/extension-koni-ui/contexts/WebUIContext';
import { useFilterModal } from '@subwallet/extension-koni-ui/hooks';
import DAppItem from '@subwallet/extension-koni-ui/Popup/DApps/DAppItem';
import FeatureDAppItem from '@subwallet/extension-koni-ui/Popup/DApps/FeatureDAppItem';
import { DAppCategoryType, DAppInfo, predefinedDApps } from '@subwallet/extension-koni-ui/Popup/DApps/predefined';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ButtonProps, Icon, ModalContext, SwHeader } from '@subwallet/react-ui';
import { FadersHorizontal, X } from 'phosphor-react';
import React, { SyntheticEvent, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

import PageWrapper from '../../components/Layout/PageWrapper';
import useDefaultNavigate from '../../hooks/router/useDefaultNavigate';

type Props = ThemeProps;

const FILTER_MODAL_ID = 'dapp-filter-modal';

const items = predefinedDApps.dApps;
const featureItems = predefinedDApps.featureDApps;

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();
  const { setTitle } = useContext(WebUIContext);
  const location = useLocation();

  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, selectedFilters } = useFilterModal(FILTER_MODAL_ID);
  const [selectedFilterTab, setSelectedFilterTab] = useState<string>(DAppCategoryType.ALL);
  const [searchInput, setSearchInput] = useState<string>('');
  const { activeModal } = useContext(ModalContext);
  const { isWebUI } = useContext(ScreenContext);
  const { goHome } = useDefaultNavigate();

  useEffect(() => {
    if (location.pathname === '/dapps') {
      setTitle(t('DApps'));
    }
  }, [location.pathname, setTitle, t]);

  const filterOptions = useMemo(() => [
    ...predefinedDApps.categories.map((c) => ({
      label: t(c.name),
      value: c.id
    }))
  ], [t]);

  const filterTabItems = useMemo<FilterTabItemType[]>(() => {
    return [
      {
        label: t('All'),
        value: DAppCategoryType.ALL
      },
      ...filterOptions
    ];
  }, [filterOptions, t]);

  const filterFunction = useMemo<(item: DAppInfo) => boolean>(() => {
    return (item) => {
      if (!selectedFilters.length) {
        return true;
      }

      for (const filter of selectedFilters) {
        if (item.categories.includes(filter)) {
          return true;
        }
      }

      return false;
    };
  }, [selectedFilters]);

  const searchFunction = useCallback((item: DAppInfo, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      item.name.toLowerCase().includes(searchTextLowerCase)
      // || item.subTitle.toLowerCase().includes(searchTextLowerCase)
    );
  }, []);

  const filteredItems = useMemo(() => {
    const filterTabFunction = (item: DAppInfo) => {
      if (selectedFilterTab === DAppCategoryType.ALL) {
        return true;
      }

      return item.categories.includes(selectedFilterTab);
    };

    const _filterFunction = (_item: DAppInfo) => {
      return filterTabFunction(_item) && filterFunction(_item) && searchFunction(_item, searchInput);
    };

    return items.filter(_filterFunction);
  }, [filterFunction, searchFunction, searchInput, selectedFilterTab]);

  const onSelectFilterTab = useCallback((value: string) => {
    setSelectedFilterTab(value);
  }, []);

  const handleSearch = useCallback((value: string) => setSearchInput(value), [setSearchInput]);

  const onClickActionBtn = useCallback(
    (e?: SyntheticEvent) => {
      e && e.stopPropagation();
      activeModal(FILTER_MODAL_ID);
    },
    [activeModal]
  );

  const headerIcons = useMemo<ButtonProps[]>(() => {
    return [
      {
        icon: (
          <Icon
            customSize={'24px'}
            phosphorIcon={X}
            type='phosphor'
            weight={'bold'}
          />
        ),
        onClick: goHome
      }
    ];
  }, [goHome]);

  return (
    <PageWrapper className={className}>
      {!isWebUI && <SwHeader
        left='logo'
        onClickLeft={goHome}
        rightButtons={headerIcons}
        showLeftButton={true}
      >
        {t('DApps')}
      </SwHeader>}

      <div
        className={'__scroll-container'}
      >
        <div className={'__feature-area'}>
          {
            featureItems.map((i, index) => (
              <FeatureDAppItem
                className={'__feature-dapp-item'}
                key={`${i.id}-${index}`}
                {...i}
              />
            ))
          }
        </div>

        <div className={'__tool-area'}>
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
            placeholder={t('Dapp name')}
            searchValue={searchInput}
            showActionBtn
          />
        </div>

        <div className={'__dapp-list-area'}>
          {!filteredItems.length && (
            <NoContent pageType={PAGE_TYPE.DAPPS} />
          )}

          {!!filteredItems.length && (
            <div className={'__dapp-list-container'}>
              {
                filteredItems.map((i) => (
                  <DAppItem
                    className={'__dapp-item'}
                    key={i.id}
                    {...i}
                  />
                ))
              }
            </div>
          )}
        </div>
      </div>

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
    </PageWrapper>
  );
};

const DApps = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    '.ant-sw-header-container': {
      paddingTop: token.padding,
      paddingBottom: token.padding,
      backgroundColor: token.colorBgDefault
    },

    '.ant-sw-header-center-part': {
      color: token.colorTextLight1,
      fontSize: token.fontSizeHeading4,
      lineHeight: token.lineHeightHeading4,
      fontWeight: token.headingFontWeight
    },

    '.__scroll-container': {
      height: '100%',
      marginLeft: -44,
      marginRight: -44,
      paddingLeft: 44,
      paddingRight: 44,
      overflow: 'auto'
    },

    '.__feature-area': {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      alignItems: 'stretch',
      gap: token.size,
      marginBottom: 40
    },

    '.__tool-area': {
      display: 'flex',
      gap: token.size,
      alignItems: 'center',
      position: 'sticky',
      top: 0,
      backgroundColor: token.colorBgDefault,
      zIndex: 30,
      paddingBottom: token.paddingXS,
      flexWrap: 'wrap',
      justifyContent: 'flex-end',

      '.filter-tabs-container': {
        flex: 1,
        overflowX: 'auto',
        flexBasis: 650
      },

      '.search-container': {
        display: 'block',
        flex: 1,
        maxWidth: 360
      },

      '.right-section': {
        width: '100%',
        justifyContent: 'flex-end'
      },

      '.right-section .search-input': {
        width: '100%'
      }
    },

    '.__dapp-list-area': {
      marginTop: 32,
      marginBottom: 40
    },

    '.__dapp-list-container': {
      display: 'grid',
      gridTemplateColumns: 'repeat(4, 1fr)',
      alignItems: 'stretch',
      gap: token.size
    },

    '.__dapp-item.-is-stared': {
      order: -1
    },

    '@media (min-width: 1600px)': {
      '.__feature-area': {
        gridTemplateColumns: 'repeat(auto-fill, minmax(410px, 1fr))'
      },

      '.__dapp-list-container': {
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))'
      }
    },

    '@media (max-width: 1400px)': {
      '.__dapp-list-container': {
        gridTemplateColumns: 'repeat(3, 1fr)'
      }
    },

    '@media (max-width: 991px)': {
      '.__scroll-container': {
        marginLeft: 0,
        marginRight: 0,
        paddingLeft: token.padding,
        paddingRight: token.padding
      },

      '.__feature-area, .__dapp-list-container': {
        gridTemplateColumns: 'repeat(2, 1fr)'
      }
    },

    '@media (max-width: 767px)': {
      '.__feature-area, .__dapp-list-container': {
        gridTemplateColumns: 'repeat(1, 1fr)'
      }
    }
  };
});

export default DApps;
