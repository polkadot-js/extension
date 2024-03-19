// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { FilterModal, Layout } from '@subwallet/extension-koni-ui/components';
import EmptyList from '@subwallet/extension-koni-ui/components/EmptyList/EmptyList';
import { FilterTabItemType, FilterTabs } from '@subwallet/extension-koni-ui/components/FilterTabs';
import Search from '@subwallet/extension-koni-ui/components/Search';
import { useDefaultNavigate, useFilterModal, useSelector } from '@subwallet/extension-koni-ui/hooks';
import { MissionDetailModal, PoolDetailModalId } from '@subwallet/extension-koni-ui/Popup/Settings/MissionPool/MissionDetailModal';
import MissionItem from '@subwallet/extension-koni-ui/Popup/Settings/MissionPool/MissionPoolItem';
import { missionCategories, MissionCategoryType } from '@subwallet/extension-koni-ui/Popup/Settings/MissionPool/predefined';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { MissionInfo } from '@subwallet/extension-koni-ui/types/missionPool';
import { Icon, ModalContext, SwList, SwSubHeader } from '@subwallet/react-ui';
import CN from 'classnames';
import { FadersHorizontal, GlobeHemisphereWest } from 'phosphor-react';
import React, { SyntheticEvent, useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps;

const FILTER_MODAL_ID = 'mission-filter-modal';

function computeStatus (item: MissionInfo): MissionCategoryType {
  const now = Date.now();

  try {
    if (item.start_time) {
      const startTime = new Date(item.start_time).getTime();

      if (now < startTime) {
        return MissionCategoryType.UPCOMING;
      }
    }
  } catch (error) {
    console.error(error);
  }

  try {
    if (item.end_time) {
      const endTime = new Date(item.end_time).getTime();

      if (now > endTime) {
        return MissionCategoryType.ARCHIVED;
      }
    }
  } catch (error) {
    console.error(error);
  }

  return MissionCategoryType.LIVE;
}

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();
  const location = useLocation();

  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, selectedFilters } = useFilterModal(FILTER_MODAL_ID);
  const [selectedFilterTab, setSelectedFilterTab] = useState<string>(MissionCategoryType.ALL);
  const [searchInput, setSearchInput] = useState<string>('');
  const { activeModal } = useContext(ModalContext);
  const [currentSelectItem, setCurrentSelectItem] = useState<MissionInfo | null>(null);
  const { missions } = useSelector((state: RootState) => state.missionPool);
  const goBack = useDefaultNavigate().goBack;

  const computedMission = useMemo(() => {
    return missions.map((item) => {
      return {
        ...item,
        status: computeStatus(item)
      };
    });
  }, [missions]);

  console.log('55555missions', missions);

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

    return computedMission.filter(_filterFunction);
  }, [computedMission, filterFunction, searchFunction, searchInput, selectedFilterTab]);

  console.log('55555-filteredItems', filteredItems);

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

  const onClickItem = useCallback((item: MissionInfo) => {
    setCurrentSelectItem(item);
    activeModal(PoolDetailModalId);
  }, [activeModal]);

  const renderItem = useCallback(
    (item: MissionInfo) => {
      console.log('55555-item', item);

      return (
        <MissionItem
          className={'earning-option-item'}
          data={item}
          key={item.id}
          onClick={onClickItem}
        />
      );
    },
    [onClickItem]
  );

  const emptyList = useCallback(() => {
    return (
      <EmptyList
        emptyMessage={t('No mission found')}
        emptyTitle={t('Your missions will show up here')}
        phosphorIcon={GlobeHemisphereWest}
      />
    );
  }, [t]);

  return (
    <div className={className}>
      {/* <Layout.Base */}
      {/*  className={CN(className)} */}
      {/*  showSubHeader={true} */}
      {/*  subHeaderBackground={'transparent'} */}
      {/*  subHeaderCenter={false} */}
      {/*  subHeaderPaddingVertical={true} */}
      {/*  title={t<string>('Mission Pools')} */}
      {/* > */}
      <SwSubHeader
        background={'transparent'}
        center
        onBack={goBack}
        paddingVertical
        showBackButton
        title={t('Mission Pools')}
      />
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
      <SwList
        actionBtnIcon={<Icon phosphorIcon={FadersHorizontal} />}
        className={'__section-list-container'}
        enableSearchInput
        filterBy={filterFunction}
        list={filteredItems}
        renderItem={renderItem}
        renderWhenEmpty={emptyList}
        searchFunction={searchFunction}
        searchMinCharactersCount={2}
        searchPlaceholder={t<string>('Campaign name...')}
        showActionBtn
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
      <MissionDetailModal
        data={currentSelectItem}
      />
      {/* </Layout.Base> */}

      <div
        className={'__scroll-container'}
      >
      </div>
    </div>
  );
};

const MissionPool = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',

    '.__scroll-container': {
      flex: 1,
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
      flexDirection: 'column',
      display: 'flex',
      gap: token.size,
      alignItems: 'flex-start',
      backgroundColor: token.colorBgDefault,
      flexWrap: 'wrap',
      justifyContent: 'flex-end',
      marginBottom: 20,

      '.filter-tabs-container': {
        flex: 1,
        overflowX: 'auto'
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

    '.__mission-list-container': {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))',
      alignItems: 'stretch',
      gap: token.size,
      marginBottom: 40
    },

    '.__header-area': {
      '.ant-sw-header-center-part': {
        marginLeft: 0
      },

      '.ant-sw-sub-header-center-part-pl': {
        textAlign: 'left',
        paddingLeft: 0
      }
    }

  };
});

export default MissionPool;
