// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { FilterModal } from '@subwallet/extension-koni-ui/components';
import { FilterTabItemType, FilterTabs } from '@subwallet/extension-koni-ui/components/FilterTabs';
import NoContent, { PAGE_TYPE } from '@subwallet/extension-koni-ui/components/NoContent';
import Search from '@subwallet/extension-koni-ui/components/Search';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { WebUIContext } from '@subwallet/extension-koni-ui/contexts/WebUIContext';
import { useFilterModal, useSelector } from '@subwallet/extension-koni-ui/hooks';
import { MissionDetailModal, PoolDetailModalId } from '@subwallet/extension-koni-ui/Popup/MissionPool/MissionDetailModal';
import MissionItem from '@subwallet/extension-koni-ui/Popup/MissionPool/MissionItem';
import { missionCategories, MissionCategoryType } from '@subwallet/extension-koni-ui/Popup/MissionPool/predefined';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { MissionInfo } from '@subwallet/extension-koni-ui/types/missionPool';
import { ButtonProps, Icon, ModalContext, SwHeader } from '@subwallet/react-ui';
import { FadersHorizontal, X } from 'phosphor-react';
import React, { SyntheticEvent, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

import useDefaultNavigate from '../../hooks/router/useDefaultNavigate';

type Props = ThemeProps;

const FILTER_MODAL_ID = 'mission-filter-modal';

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();
  const { setTitle } = useContext(WebUIContext);
  const location = useLocation();

  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, selectedFilters } = useFilterModal(FILTER_MODAL_ID);
  const [selectedFilterTab, setSelectedFilterTab] = useState<string>(MissionCategoryType.ALL);
  const [searchInput, setSearchInput] = useState<string>('');
  const { activeModal } = useContext(ModalContext);
  const { isWebUI } = useContext(ScreenContext);
  const { goHome } = useDefaultNavigate();
  const [currentSelectItem, setCurrentSelectItem] = useState<MissionInfo | null>(null);
  const { missions } = useSelector((state: RootState) => state.missionPool);

  useEffect(() => {
    if (location.pathname === '/mission-pools') {
      setTitle(t('Mission Pools'));
    }
  }, [location.pathname, setTitle, t]);

  const filterOptions = useMemo(() => [
    ...missionCategories.map((c) => ({
      label: t(c.name),
      value: c.slug
    }))
  ], [t]);

  const filterTabItems = useMemo<FilterTabItemType[]>(() => {
    return [
      {
        label: t('All'),
        value: MissionCategoryType.ALL
      },
      ...filterOptions
    ];
  }, [filterOptions, t]);

  const filterFunction = useMemo<(item: MissionInfo) => boolean>(() => {
    return (item) => {
      if (!selectedFilters.length) {
        return true;
      }

      for (const filter of selectedFilters) {
        if (item.status === filter) {
          return true;
        }
      }

      return false;
    };
  }, [selectedFilters]);

  const searchFunction = useCallback((item: MissionInfo, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    if (!item.name && !searchTextLowerCase) {
      return true;
    }

    return (
      item.name?.toLowerCase().includes(searchTextLowerCase)
    );
  }, []);

  const filteredItems = useMemo(() => {
    const filterTabFunction = (item: MissionInfo) => {
      if (selectedFilterTab === MissionCategoryType.ALL) {
        return true;
      }

      return item.status === selectedFilterTab;
    };

    const _filterFunction = (_item: MissionInfo) => {
      return filterTabFunction(_item) && filterFunction(_item) && searchFunction(_item, searchInput);
    };

    return missions.filter(_filterFunction);
  }, [missions, filterFunction, searchFunction, searchInput, selectedFilterTab]);

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

  const onClickItem = useCallback((item: MissionInfo) => {
    setCurrentSelectItem(item);
    activeModal(PoolDetailModalId);
  }, [activeModal]);

  return (
    <div className={className}>
      {
        !isWebUI && (
          <SwHeader
            left='logo'
            onClickLeft={goHome}
            rightButtons={headerIcons}
            showLeftButton={true}
          >
            {t('DApps')}
          </SwHeader>
        )
      }

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
          placeholder={t('Campaign name...')}
          searchValue={searchInput}
          showActionBtn
        />
      </div>

      <div
        className={'__scroll-container'}
      >
        <div className={'__mission-list-area'}>
          {!filteredItems.length && (
            <NoContent pageType={PAGE_TYPE.MISSION} />
          )}

          {
            !!filteredItems.length && (
              <div className='__mission-list-container'>
                {
                  filteredItems.map((item) => (
                    <MissionItem
                      data={item}
                      key={item.id}
                      onClick={onClickItem}
                    />
                  ))
                }
              </div>
            )
          }

        </div>
      </div>

      <MissionDetailModal
        data={currentSelectItem}
      />

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
    </div>
  );
};

const MissionPool = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    height: '100%',

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
      overflow: 'hidden'
    },

    '.__feature-area-inner': {
      marginRight: -token.size
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

    '.__mission-list-area': {
      marginTop: 32,
      marginBottom: 40
    },

    '.__mission-list-container': {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
      alignItems: 'stretch',
      gap: token.size
    }
  };
});

export default MissionPool;
