// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainAsset } from '@subwallet/chain-list/types';
import { AssetSetting } from '@subwallet/extension-base/background/KoniTypes';
import { _isAssetFungibleToken, _isCustomAsset } from '@subwallet/extension-base/services/chain-service/utils';
import EmptyList from '@subwallet/extension-koni-ui/components/EmptyList';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { FilterModal } from '@subwallet/extension-koni-ui/components/Modal/FilterModal';
import TokenToggleItem from '@subwallet/extension-koni-ui/components/TokenItem/TokenToggleItem';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { useFilterModal } from '@subwallet/extension-koni-ui/hooks/modal/useFilterModal';
import { useLazyList } from '@subwallet/extension-koni-ui/hooks/modal/useLazyList';
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ButtonProps, SwList } from '@subwallet/react-ui';
import Icon from '@subwallet/react-ui/es/icon';
import { ModalContext } from '@subwallet/react-ui/es/sw-modal/provider';
import { Coin, FadersHorizontal, Plus } from 'phosphor-react';
import React, { SyntheticEvent, useCallback, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import Layout from '../../../components/Layout';

type Props = ThemeProps
enum FilterValue {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  CUSTOM = 'custom'
}

const FILTER_OPTIONS = [
  { label: 'Enabled tokens', value: FilterValue.ENABLED },
  { label: 'Disabled tokens', value: FilterValue.DISABLED },
  { label: 'Custom tokens', value: FilterValue.CUSTOM }
];

function filterFungibleTokens (assetRegistry: Record<string, _ChainAsset>, assetSettingMap: Record<string, AssetSetting>, filters: string[]): _ChainAsset[] {
  const filteredTokenList: _ChainAsset[] = [];

  Object.values(assetRegistry).forEach((chainAsset) => {
    let isValidationPassed = filters.length <= 0;

    for (const filter of filters) {
      switch (filter) {
        case FilterValue.CUSTOM:
          isValidationPassed = _isCustomAsset(chainAsset.slug);
          break;
        case FilterValue.ENABLED:
          isValidationPassed = assetSettingMap[chainAsset.slug] && assetSettingMap[chainAsset.slug].visible;
          break;
        case FilterValue.DISABLED:
          isValidationPassed = !assetSettingMap[chainAsset.slug] || !assetSettingMap[chainAsset.slug].visible;
          break;
        default:
          isValidationPassed = false;
          break;
      }

      if (isValidationPassed) {
        break; // only need to satisfy 1 filter (OR)
      }
    }

    if (_isAssetFungibleToken(chainAsset) && isValidationPassed) {
      filteredTokenList.push(chainAsset);
    }
  });

  return filteredTokenList;
}

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const goBack = useDefaultNavigate().goBack;
  const dataContext = useContext(DataContext);
  const { activeModal, inactiveModal } = useContext(ModalContext);

  const { assetRegistry, assetSettingMap } = useSelector((state: RootState) => state.assetRegistry);
  const { changeFilters, onApplyFilter, onChangeFilterOpt, selectedFilters } = useFilterModal(Object.values(assetRegistry), 'filterTokenModal');
  const allFungibleTokens = useMemo(() => {
    return filterFungibleTokens(assetRegistry, assetSettingMap, selectedFilters);
  }, [assetRegistry, assetSettingMap, selectedFilters]);
  const { hasMore, lazyItems, loadMoreItems } = useLazyList(allFungibleTokens);

  const searchToken = useCallback((token: _ChainAsset, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      token.name.toLowerCase().includes(searchTextLowerCase) ||
      token.symbol.toLowerCase().includes(searchTextLowerCase)
    );
  }, []);

  const renderTokenItem = useCallback((tokenInfo: _ChainAsset) => {
    return (
      <TokenToggleItem
        assetSettingMap={assetSettingMap}
        tokenInfo={tokenInfo}
      />
    );
  }, [assetSettingMap]);

  const emptyTokenList = useCallback(() => {
    return (
      <EmptyList
        emptyMessage={t<string>('Your token will appear here.')}
        emptyTitle={t<string>('No token')}
        phosphorIcon={Coin}
      />
    );
  }, [t]);

  const subHeaderButton: ButtonProps[] = useMemo(() => {
    return [
      {
        icon: <Icon
          phosphorIcon={Plus}
          size='sm'
          type='phosphor'
        />,
        onClick: () => {
          navigate('/settings/tokens/import-token', { state: { isExternalRequest: false } });
        }
      }
    ];
  }, [navigate]);

  const openFilterModal = useCallback((e?: SyntheticEvent) => {
    e && e.stopPropagation();
    activeModal('filterTokenModal');
  }, [activeModal]);

  const closeFilterModal = useCallback(() => {
    inactiveModal('filterTokenModal');
  }, [inactiveModal]);

  return (
    <PageWrapper
      className={`manage_tokens ${className}`}
      resolve={dataContext.awaitStores(['assetRegistry'])}
    >
      <Layout.Base
        onBack={goBack}
        showBackButton={true}
        showSubHeader={true}
        subHeaderBackground={'transparent'}
        subHeaderCenter={true}
        subHeaderIcons={subHeaderButton}
        subHeaderPaddingVertical={true}
        title={t<string>('Manage tokens')}
      >
        <SwList.Section
          actionBtnIcon={<Icon
            customSize={'20px'}
            phosphorIcon={FadersHorizontal}
            size='sm'
            type='phosphor'
            weight={'fill'}
          />}
          className={'manage_tokens__container'}
          enableSearchInput={true}
          gridGap={'14px'}
          ignoreScrollbar={lazyItems.length > 2}
          list={lazyItems}
          minColumnWidth={'172px'}
          mode={'boxed'}
          onClickActionBtn={openFilterModal}
          pagination={{
            hasMore,
            loadMore: loadMoreItems
          }}
          renderItem={renderTokenItem}
          renderOnScroll={false}
          renderWhenEmpty={emptyTokenList}
          searchFunction={searchToken}
          searchMinCharactersCount={2}
          searchPlaceholder={t<string>('Search token')}
          showActionBtn={true}
        />

        <FilterModal
          id={'filterTokenModal'}
          onApplyFilter={onApplyFilter}
          onCancel={closeFilterModal}
          onChangeOption={onChangeFilterOpt}
          optionSelection={changeFilters}
          options={FILTER_OPTIONS}
        />
      </Layout.Base>
    </PageWrapper>
  );
}

const ManageTokens = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.ant-sw-screen-layout-body': {
      display: 'flex'
    },

    '.ant-sw-list-wrapper.ant-sw-list-wrapper:before': {
      zIndex: 0,
      borderRadius: token.borderRadiusLG
    },

    '.ant-sw-list-section.-boxed-mode .ant-sw-list': {
      paddingLeft: token.padding,
      paddingTop: token.paddingXS,
      paddingBottom: token.paddingXS
    },

    '.ant-sw-list-section.-boxed-mode .ant-sw-list.-ignore-scrollbar': {
      paddingRight: token.padding + 6
    },

    '.ant-network-item.-with-divider': {
      position: 'relative',
      zIndex: 1
    },

    '&__inner': {
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden'
    },

    '.manage_tokens__container': {
      paddingTop: token.padding,
      paddingBottom: token.paddingSM,
      flex: 1
    }
  });
});

export default ManageTokens;
