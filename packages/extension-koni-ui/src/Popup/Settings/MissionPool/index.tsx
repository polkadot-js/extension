// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { FilterModal, Layout } from '@subwallet/extension-koni-ui/components';
import EmptyList from '@subwallet/extension-koni-ui/components/EmptyList/EmptyList';
import { FilterTabItemType, FilterTabs } from '@subwallet/extension-koni-ui/components/FilterTabs';
import Search from '@subwallet/extension-koni-ui/components/Search';
import { useFilterModal, useSelector } from '@subwallet/extension-koni-ui/hooks';
import { MissionDetailModal, PoolDetailModalId } from '@subwallet/extension-koni-ui/Popup/Settings/MissionPool/MissionDetailModal';
import MissionItem from '@subwallet/extension-koni-ui/Popup/Settings/MissionPool/MissionPoolItem';
import { missionCategories, MissionCategoryType, MissionTab } from '@subwallet/extension-koni-ui/Popup/Settings/MissionPool/predefined';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { MissionInfo, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { computeStatus } from '@subwallet/extension-koni-ui/utils';
import { Icon, ModalContext, SwList } from '@subwallet/react-ui';
import CN from 'classnames';
import { FadersHorizontal, GlobeHemisphereWest } from 'phosphor-react';
import React, { SyntheticEvent, useCallback, useContext, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import styled from 'styled-components';

type Props = ThemeProps;

const FILTER_MODAL_ID = 'mission-filter-modal';

const Component: React.FC<Props> = ({ className }: Props) => {
  const { t } = useTranslation();
  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, selectedFilters } = useFilterModal(FILTER_MODAL_ID);
  const [selectedFilterTab, setSelectedFilterTab] = useState<string>(MissionCategoryType.ALL);
  const [searchInput, setSearchInput] = useState<string>('');
  const { activeModal } = useContext(ModalContext);
  const [currentSelectItem, setCurrentSelectItem] = useState<MissionInfo | null>(null);
  const { missions } = useSelector((state: RootState) => state.missionPool);

  const computedMission = useMemo(() => {
    return missions.map((item) => {
      return {
        ...item,
        status: computeStatus(item)
      };
    });
  }, [missions]);

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
        value: MissionTab.ALL
      },
      {
        label: t('Defi'),
        value: MissionTab.DEFI
      },
      {
        label: t('Meme'),
        value: MissionTab.MEME
      },
      {
        label: t('Gaming'),
        value: MissionTab.GAMING
      }
    ];
  }, [t]);

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
      if (selectedFilterTab === MissionTab.ALL) {
        return true;
      }

      return item.categories?.some((category) => category.slug === selectedFilterTab) ?? false;
    };

    const sortFunction = (itemA: MissionInfo, itemB: MissionInfo) => {
      const statusOrder: Record<string, number> = {
        live: 0,
        upcoming: 1,
        archived: 2
      };

      const getStatusOrderValue = (status: string | undefined | null): number => {
        if (status && status in statusOrder) {
          return statusOrder[status];
        } else {
          return statusOrder.archived;
        }
      };

      const statusA = getStatusOrderValue(itemA.status);
      const statusB = getStatusOrderValue(itemB.status);

      if (statusA !== statusB) {
        return statusA - statusB;
      }

      return (itemA.ordinal || 0) - (itemB.ordinal || 0);
    };

    const _filterFunction = (_item: MissionInfo) => {
      return filterTabFunction(_item) && filterFunction(_item) && searchFunction(_item, searchInput);
    };

    return computedMission.filter(_filterFunction).sort(sortFunction);
  }, [computedMission, filterFunction, searchFunction, searchInput, selectedFilterTab]);

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
    <Layout.Base
      className={CN(className)}
      showSubHeader={true}
      subHeaderBackground={'transparent'}
      subHeaderCenter={false}
      subHeaderPaddingVertical={true}
      title={t<string>('Mission Pools')}
    >
      <div className={'__tool-area'}>
        <Search
          actionBtnIcon={(
            <Icon
              phosphorIcon={FadersHorizontal}
              size='sm'
            />
          )}
          className={'__search-item'}
          onClickActionBtn={onClickActionBtn}
          onSearch={handleSearch}
          placeholder={t('Campaign name...')}
          searchValue={searchInput}
          showActionBtn
        />
        <FilterTabs
          className={'filter-tabs-container'}
          items={filterTabItems}
          onSelect={onSelectFilterTab}
          selectedItem={selectedFilterTab}
        />
      </div>
      <div className={'__content-wrapper'}>
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
      <MissionDetailModal
        data={currentSelectItem}
      />
    </Layout.Base>
  );
};

const MissionPool = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    '.__tab-item-label': {
      fontSize: token.fontSize,
      lineHeight: token.lineHeight
    },
    '.__section-list-container': {
      paddingLeft: token.padding,
      paddingRight: token.padding,
      overflowX: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: token.sizeXS
    },
    '.ant-sw-screen-layout-body': {
      display: 'flex',
      flexDirection: 'column'
    },
    '.filter-tabs-container': {
      paddingLeft: token.padding,
      paddingRight: token.padding
    },
    '.__search-item': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: token.paddingXS
    },
    '.__tool-area': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.sizeXS,
      marginBottom: token.marginXS
    },
    '.__content-wrapper': {
      overflowX: 'auto'
    },
    '.ant-sw-header-container-padding-vertical': {
      paddingTop: 0,
      paddingBottom: 0,
      marginTop: '8px !important',
      marginBottom: '8px !important'
    }

  };
});

export default MissionPool;
