// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { FilterModal } from '@subwallet/extension-web-ui/components';
import { FilterTabItemType, FilterTabs } from '@subwallet/extension-web-ui/components/FilterTabs';
import NoContent, { PAGE_TYPE } from '@subwallet/extension-web-ui/components/NoContent';
import Search from '@subwallet/extension-web-ui/components/Search';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { WebUIContext } from '@subwallet/extension-web-ui/contexts/WebUIContext';
import { useFilterModal, useSelector } from '@subwallet/extension-web-ui/hooks';
import { MissionDetailModal, PoolDetailModalId } from '@subwallet/extension-web-ui/Popup/MissionPool/MissionDetailModal';
import MissionItem from '@subwallet/extension-web-ui/Popup/MissionPool/MissionItem';
import { missionCategories, MissionCategoryType, MissionTab } from '@subwallet/extension-web-ui/Popup/MissionPool/predefined';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { MissionInfo } from '@subwallet/extension-web-ui/types/missionPool';
import { computeStatus } from '@subwallet/extension-web-ui/utils';
import { Icon, ModalContext, SwSubHeader } from '@subwallet/react-ui';
import { FadersHorizontal } from 'phosphor-react';
import React, { SyntheticEvent, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

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
  const [currentSelectItem, setCurrentSelectItem] = useState<MissionInfo | null>(null);
  const { missions } = useSelector((state: RootState) => state.missionPool);

  useEffect(() => {
    if (location.pathname === '/home/mission-pools') {
      setTitle(t('Mission Pools'));
    }
  }, [location.pathname, setTitle, t]);

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
        value: MissionCategoryType.ALL
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

  const filteredItems = useMemo(() => {
    const filterTabFunction = (item: MissionInfo) => {
      if (selectedFilterTab === MissionTab.ALL) {
        return true;
      }

      return item.categories?.some((category) => category.slug === selectedFilterTab) ?? false;
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

  return (
    <div className={className}>
      {
        !isWebUI && (
          <SwSubHeader
            background={'transparent'}
            className={'__header-area'}
            paddingVertical
            showBackButton={false}
            title={t('Mission Pools')}
          />)
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
        {!filteredItems.length && (
          <NoContent pageType={PAGE_TYPE.MISSION} />
        )}

        {
          !!filteredItems.length && (
            <div className='__mission-list-container'>
              {
                filteredItems.map((item) => (
                  <MissionItem
                    compactMode={!isWebUI}
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
      display: 'flex',
      gap: token.size,
      alignItems: 'center',
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
    },

    '@media (max-width: 991px)': {
      paddingLeft: token.size,
      paddingRight: token.size,

      '.__mission-list-container': {
        display: 'flex',
        flexDirection: 'column',
        marginBottom: token.margin,
        gap: token.sizeXS
      },

      '.__scroll-container': {
        marginLeft: -16,
        marginRight: -16,
        paddingLeft: 16,
        paddingRight: 16
      }
    },

    '@media (max-width: 767px)': {
      '.__tool-area': {
        gap: token.sizeXS,

        '.filter-tabs-container': {
          order: 2
        },

        '.search-container': {
          order: 1,
          minWidth: '100%',
          maxWidth: 'none'
        }
      }
    }
  };
});

export default MissionPool;
