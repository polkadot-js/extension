// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _FundStatus } from '@subwallet/chain-list/types';
import { CrowdloanItem, EmptyList, FilterModal, Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import BannerGenerator from '@subwallet/extension-koni-ui/components/StaticContent/BannerGenerator';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { useFilterModal, useGetBannerByScreen, useGetCrowdloanList, useSelector, useSetCurrentPage, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { _CrowdloanItemType, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { Icon, ModalContext, SwList } from '@subwallet/react-ui';
import CN from 'classnames';
import { FadersHorizontal, Rocket } from 'phosphor-react';
import React, { SyntheticEvent, useCallback, useContext, useMemo } from 'react';
import styled from 'styled-components';

type Props = ThemeProps;

enum FilterValue {
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

  const { activeModal } = useContext(ModalContext);

  const { isShowBalance } = useSelector((state) => state.settings);

  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, selectedFilters } = useFilterModal(FILTER_MODAL_ID);

  const { banners, dismissBanner, onClickBanner } = useGetBannerByScreen('crowdloan');

  const filterOptions = useMemo(() => [
    { label: t('Polkadot parachain'), value: FilterValue.POLKADOT_PARACHAIN },
    { label: t('Kusama parachain'), value: FilterValue.KUSAMA_PARACHAIN },
    { label: t('Won'), value: FilterValue.WON },
    { label: t('In auction'), value: FilterValue.IN_AUCTION }
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

  const renderItem = useCallback(
    (item: _CrowdloanItemType) => {
      return (
        <CrowdloanItem
          className={'__crowdloan-item'}
          hideBalance={!isShowBalance}
          item={item}
        />
      );
    },
    [isShowBalance]
  );

  // empty list
  const emptyCrowdloanList = useCallback(
    () => {
      return (
        <EmptyList
          emptyMessage={t('Your crowdloans will show up here')}
          emptyTitle={t('No crowdloans found')}
          phosphorIcon={Rocket}
        />
      );
    },
    [t]
  );

  return (
    <PageWrapper
      className={CN(`crowdloans ${className}`, {
        '-has-banner': !!banners.length
      })}
      resolve={dataContext.awaitStores(['crowdloan', 'price', 'chainStore', 'balance'])}
    >
      <Layout.Base
        showSubHeader={true}
        subHeaderBackground={'transparent'}
        subHeaderCenter={false}
        subHeaderPaddingVertical={true}
        title={t<string>('Crowdloans')}
      >
        <div className='content-container'>
          {!!banners.length && (
            <div className={'banner-container'}>
              <BannerGenerator
                banners={banners}
                dismissBanner={dismissBanner}
                onClickBanner={onClickBanner}
              />
            </div>
          )}

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
      </Layout.Base>
    </PageWrapper>
  );
}

const Crowdloans = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    color: token.colorTextLight1,
    fontSize: token.fontSizeLG,

    '.content-container': {
      display: 'flex',
      flexDirection: 'column',
      height: '100%'
    },

    '.ant-sw-screen-layout-body': {
      overflow: 'hidden'
    },

    '.ant-sw-sub-header-container': {
      paddingBottom: token.paddingXS,
      paddingTop: token.paddingXS,
      minHeight: 56,
      marginBottom: token.marginXS
    },

    '&.-has-banner': {
      '.ant-sw-sub-header-container': {
        marginBottom: 0
      }
    },

    '.empty-list': {
      marginTop: 36
    },

    '.banner-container': {
      marginLeft: token.margin,
      marginRight: token.margin,
      marginBottom: token.marginSM,
      display: 'flex',
      flexDirection: 'column',
      gap: token.sizeXS
    },

    '.image-container': {
      width: '100%'
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
      height: '100%',
      flex: 1,

      '.ant-sw-list-wrapper': {
        flexBasis: 'auto'
      }
    },

    '.banner-image': {
      cursor: 'pointer'
    },

    '.__crowdloan-item + .__crowdloan-item': {
      marginTop: token.marginXS
    }
  });
});

export default Crowdloans;
