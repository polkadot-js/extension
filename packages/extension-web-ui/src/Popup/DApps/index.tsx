// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { FilterModal } from '@subwallet/extension-web-ui/components';
import { FilterTabItemType, FilterTabs } from '@subwallet/extension-web-ui/components/FilterTabs';
import NoContent, { PAGE_TYPE } from '@subwallet/extension-web-ui/components/NoContent';
import Search from '@subwallet/extension-web-ui/components/Search';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { WebUIContext } from '@subwallet/extension-web-ui/contexts/WebUIContext';
import { useFilterModal, useSelector } from '@subwallet/extension-web-ui/hooks';
import DAppItem from '@subwallet/extension-web-ui/Popup/DApps/DAppItem';
import FeatureDAppItem from '@subwallet/extension-web-ui/Popup/DApps/FeatureDAppItem';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { DAppCategory, DAppCategoryType, DAppInfo } from '@subwallet/extension-web-ui/types/dapp';
import { Icon, ModalContext, SwSubHeader } from '@subwallet/react-ui';
import { ArrowCircleLeft, ArrowCircleRight, FadersHorizontal } from 'phosphor-react';
import React, { SyntheticEvent, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';
import Slider, { Settings } from 'react-slick';
import styled from 'styled-components';

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
  const { categories, dApps, featureDApps } = useSelector((state: RootState) => state.dApp);
  const [sliderDisplayCount, setSliderDisplayCount] = useState<number>(0);

  const sliderSettings: Settings = useMemo(() => {
    return {
      dots: true,
      infinite: sliderDisplayCount <= featureDApps.length,
      speed: 500,
      slidesToShow: sliderDisplayCount,
      slidesToScroll: 1,
      swipeToSlide: true,
      waitForAnimate: true,
      autoplay: true,
      nextArrow: (
        <div>
          <div className={'__right-arrow'}>
            <Icon
              customSize={'28px'}
              phosphorIcon={ArrowCircleRight}
              weight={'fill'}
            />
          </div>
        </div>
      ),
      prevArrow: (
        <div>
          <div className={'__left-arrow'}>
            <Icon
              customSize={'28px'}
              phosphorIcon={ArrowCircleLeft}
              weight={'fill'}
            />
          </div>
        </div>
      )
    };
  }, [featureDApps.length, sliderDisplayCount]);

  useEffect(() => {
    if (location.pathname === '/home/dapps') {
      setTitle(t('DApps'));
    }
  }, [location.pathname, setTitle, t]);

  const filterOptions = useMemo(() => [
    ...categories.map((c) => ({
      label: t(c.name),
      value: c.slug
    }))
  ], [categories, t]);

  const categoryMap = useMemo<Record<string, DAppCategory>>(() => (Object.fromEntries(categories.map((c) => [c.slug, c]))), [categories]);

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
      {
        !isWebUI && (
          <SwSubHeader
            background={'transparent'}
            className={'__header-area'}
            paddingVertical
            showBackButton={false}
            title={t('DApps')}
          />
        )
      }

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
                <Slider
                  className={'__carousel-container'}
                  {...sliderSettings}
                >
                  {featureDApps.map((i, index) => (
                    <FeatureDAppItem
                      className={'__feature-dapp-item'}
                      compactMode={!isWebUI}
                      key={`${i.id}-${index}`}
                      {...i}
                    />
                  ))}
                </Slider>
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
            placeholder={t('DApp name')}
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
                    compactMode={!isWebUI}
                    key={i.id}
                    {...i}
                    categoryMap={categoryMap}
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
    display: 'flex',
    flexDirection: 'column',

    '.__header-area': {
      '.ant-sw-header-center-part': {
        marginLeft: 0
      },

      '.ant-sw-sub-header-center-part-pl': {
        textAlign: 'left'
      }
    },

    '.slick-dots': {
      display: 'flex !important',
      listStyle: 'none',
      gap: 6,
      marginBottom: 0,
      paddingLeft: 0,
      position: 'absolute',
      right: 28,
      bottom: 8,
      pointerEvents: 'none',
      opacity: 0,

      li: {
        width: 4,
        height: 4,
        backgroundColor: 'rgba(255, 255, 255, 0.30)',
        borderRadius: 4
      },

      'li.slick-active': {
        width: 16,
        height: 4,
        backgroundColor: token.colorWhite
      },

      button: {
        display: 'none'
      }
    },

    '.__scroll-container': {
      flex: 1,
      overflowY: 'auto',
      overflowX: 'hidden',
      display: 'flex',
      flexDirection: 'column'
    },

    '.__feature-area': {
      position: 'relative',

      '&:after': {
        position: 'absolute',
        right: -16,
        top: 0,
        width: 16,
        bottom: 0,
        display: 'block',
        content: '""',
        backgroundColor: token.colorBgDefault
      }
    },

    '.__feature-area-inner': {
      marginRight: -token.size
    },

    '.__tool-area': {
      display: 'flex',
      gap: token.size,
      alignItems: 'center',
      position: 'sticky',
      top: -10,
      paddingTop: 10,
      backgroundColor: token.colorBgDefault,
      zIndex: 30,
      paddingBottom: token.paddingXS,
      flexWrap: 'wrap',
      justifyContent: 'flex-end',

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

    '.__feature-dapp-item': {
      marginRight: token.size,
      display: 'flex',
      flexDirection: 'column',

      '.__item-meta-area': {
        flex: 1
      }
    },

    '.__dapp-list-area': {
      flex: 1,
      marginTop: 32,
      marginBottom: 40
    },

    '.__dapp-list-container': {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      alignItems: 'stretch',
      gap: token.size
    },

    '.__dapp-item.-is-stared': {
      order: -1
    },

    '.__carousel-container': {
      position: 'relative',
      marginBottom: 40,

      '.slick-prev, .slick-next': {
        width: 40,
        position: 'absolute',
        top: 0,
        bottom: 0,
        cursor: 'pointer',
        zIndex: 20
      },

      '.slick-prev': {
        left: 0
      },

      '.slick-next': {
        right: token.size
      },

      '.__left-arrow, .__right-arrow': {
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }
    },

    '@media (max-width: 991px)': {
      '.__scroll-container': {
        marginLeft: 0,
        marginRight: 0,
        paddingLeft: token.padding,
        paddingRight: token.padding
      }
    },

    '@media (max-width: 767px)': {
      '.__carousel-container': {
        marginBottom: 24
      },

      '.__dapp-list-area': {
        marginTop: 14
      },

      '.slick-arrow': {
        opacity: 0
      },

      '.slick-dots': {
        opacity: 1
      },

      '.__tool-area': {
        '.filter-tabs-container': {
          order: 1
        },

        '.search-container': {
          maxWidth: 'none',
          order: -1,
          flexBasis: '100%'
        }
      }
    }
  };
});

export default DApps;
