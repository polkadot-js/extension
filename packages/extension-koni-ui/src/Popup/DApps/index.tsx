// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { FilterModal } from '@subwallet/extension-koni-ui/components';
import { FilterTabItemType, FilterTabs } from '@subwallet/extension-koni-ui/components/FilterTabs';
import NoContent, { PAGE_TYPE } from '@subwallet/extension-koni-ui/components/NoContent';
import Search from '@subwallet/extension-koni-ui/components/Search';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { WebUIContext } from '@subwallet/extension-koni-ui/contexts/WebUIContext';
import { useFilterModal, useSelector } from '@subwallet/extension-koni-ui/hooks';
import DAppItem from '@subwallet/extension-koni-ui/Popup/DApps/DAppItem';
import FeatureDAppItem from '@subwallet/extension-koni-ui/Popup/DApps/FeatureDAppItem';
import { dAppCategories } from '@subwallet/extension-koni-ui/Popup/DApps/predefined';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { DAppCategoryType, DAppInfo } from '@subwallet/extension-koni-ui/types/dapp';
import { ButtonProps, Icon, ModalContext, SwHeader } from '@subwallet/react-ui';
import { Carousel } from '@trendyol-js/react-carousel';
import { ArrowCircleLeft, ArrowCircleRight, FadersHorizontal, X } from 'phosphor-react';
import React, { SyntheticEvent, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';

import useDefaultNavigate from '../../hooks/router/useDefaultNavigate';

type Props = ThemeProps;

const FILTER_MODAL_ID = 'dapp-filter-modal';

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
  const { dApps, featureDApps } = useSelector((state: RootState) => state.dApp);
  const [sliderDisplayCount, setSliderDisplayCount] = useState<number>(0);

  useEffect(() => {
    if (location.pathname === '/dapps') {
      setTitle(t('DApps'));
    }
  }, [location.pathname, setTitle, t]);

  const filterOptions = useMemo(() => [
    ...dAppCategories.map((c) => ({
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
      item.title.toLowerCase().includes(searchTextLowerCase) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(searchTextLowerCase))
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

    return dApps.filter(_filterFunction);
  }, [dApps, filterFunction, searchFunction, searchInput, selectedFilterTab]);

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

  const updateSliderDisplayCount = () => {
    const element = document.getElementById('feature-dapp-slider-wrapper'); // Replace with your element's ID

    if (element) {
      const width = element.clientWidth;

      const count = Math.floor((width - 16 * 3) / 360) || 1;

      setSliderDisplayCount(count);
    }
  };

  useEffect(() => {
    updateSliderDisplayCount();

    window.addEventListener('resize', updateSliderDisplayCount);

    return () => {
      window.removeEventListener('resize', updateSliderDisplayCount);
    };
  }, []);

  return (
    <div className={className}>
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
          <div
            className={'__feature-area-inner'}
            id={'feature-dapp-slider-wrapper'}
          >
            {
              !!featureDApps.length && !!sliderDisplayCount && (
                <Carousel
                  className={'__carousel-container'}
                  infinite={false}
                  key={`feature-dapp-slider-${sliderDisplayCount}`}
                  leftArrow={(
                    <div className={'__left-arrow'}>
                      <Icon
                        customSize={'28px'}
                        phosphorIcon={ArrowCircleLeft}
                        weight={'fill'}
                      />
                    </div>
                  )}
                  responsive={true}
                  rightArrow={(
                    <div className={'__right-arrow'}>
                      <Icon
                        customSize={'28px'}
                        phosphorIcon={ArrowCircleRight}
                        weight={'fill'}
                      />
                    </div>
                  )}
                  show={sliderDisplayCount}
                  slide={1}
                >
                  {
                    // [featureDApps[0]].map((i, index) => (
                    featureDApps.map((i, index) => (
                      <FeatureDAppItem
                        className={'__feature-dapp-item'}
                        key={`${i.id}-${index}`}
                        {...i}
                      />
                    ))
                  }
                </Carousel>
              )
            }
          </div>
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
    </div>
  );
};

const DApps = styled(Component)<Props>(({ theme: { token } }: Props) => {
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

    '.__feature-dapp-item': {
      marginRight: token.size,
      height: '100%',
      display: 'flex',
      flexDirection: 'column',

      '.__item-meta-area': {
        flex: 1
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

    '.__carousel-container': {
      marginBottom: 40,

      '> div:first-of-type, > div:last-of-type': {
        '&:not(.styles-module_item-provider__YgMwz)': {
          position: 'relative',
          zIndex: 10
        }
      },

      '.styles-module_item-provider__YgMwz': {
        cursor: 'default'
      },

      '.styles-module_item-tracker__3bypy': {
        alignItems: 'stretch'
      },

      '.__left-arrow, .__right-arrow': {
        width: 40,
        display: 'flex',
        position: 'absolute',
        top: 0,
        bottom: 0,
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer'
      },

      '.__left-arrow': {
        left: 0
      },

      '.__right-arrow': {
        right: token.size
      }
    },

    '@media (min-width: 1600px)': {
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

      '.__dapp-list-container': {
        gridTemplateColumns: 'repeat(2, 1fr)'
      }
    },

    '@media (max-width: 767px)': {
      '.__dapp-list-container': {
        gridTemplateColumns: 'repeat(1, 1fr)'
      }
    }
  };
});

export default DApps;
