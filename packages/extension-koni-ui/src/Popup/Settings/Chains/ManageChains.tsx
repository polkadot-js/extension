// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { _ChainState } from '@subwallet/extension-base/services/chain-service/types';
import { _isChainEvmCompatible, _isCustomChain, _isSubstrateChain } from '@subwallet/extension-base/services/chain-service/utils';
import EmptyList from '@subwallet/extension-koni-ui/components/EmptyList';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { FilterModal } from '@subwallet/extension-koni-ui/components/Modal/FilterModal';
import NetworkToggleItem from '@subwallet/extension-koni-ui/components/NetworkToggleItem';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { useFilterModal } from '@subwallet/extension-koni-ui/hooks/modal/useFilterModal';
import { useLazyList } from '@subwallet/extension-koni-ui/hooks/modal/useLazyList';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ButtonProps, SwList } from '@subwallet/react-ui';
import Icon from '@subwallet/react-ui/es/icon';
import { ModalContext } from '@subwallet/react-ui/es/sw-modal/provider';
import { FadersHorizontal, ListChecks, Plus } from 'phosphor-react';
import React, { SyntheticEvent, useCallback, useContext, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import Layout from '../../../components/Layout';

type Props = ThemeProps

enum FilterValue {
  ENABLED = 'enabled',
  DISABLED = 'disabled',
  CUSTOM = 'custom',
  SUBSTRATE = 'substrate',
  EVM = 'evm'
}

const FILTER_OPTIONS = [
  { label: 'EVM chains', value: FilterValue.EVM },
  { label: 'Substrate chains', value: FilterValue.SUBSTRATE },
  { label: 'Custom chains', value: FilterValue.CUSTOM },
  { label: 'Enabled chains', value: FilterValue.ENABLED },
  { label: 'Disabled chains', value: FilterValue.DISABLED }
];

function filterChains (chainInfoMap: Record<string, _ChainInfo>, chainStateMap: Record<string, _ChainState>, filters: string[]): _ChainInfo[] {
  const filteredChainList: _ChainInfo[] = [];

  Object.values(chainInfoMap).forEach((chainInfo) => {
    let isValidationPassed = filters.length <= 0;

    for (const filter of filters) {
      switch (filter) {
        case FilterValue.CUSTOM:
          isValidationPassed = _isCustomChain(chainInfo.slug);
          break;
        case FilterValue.ENABLED:
          isValidationPassed = chainStateMap[chainInfo.slug].active;
          break;
        case FilterValue.DISABLED:
          isValidationPassed = !chainStateMap[chainInfo.slug].active;
          break;
        case FilterValue.SUBSTRATE:
          isValidationPassed = _isSubstrateChain(chainInfo);
          break;
        case FilterValue.EVM:
          isValidationPassed = _isChainEvmCompatible(chainInfo);
          break;
        default:
          isValidationPassed = false;
          break;
      }

      if (isValidationPassed) {
        break; // only need to satisfy 1 filter (OR)
      }
    }

    if (isValidationPassed) {
      filteredChainList.push(chainInfo);
    }
  });

  return filteredChainList;
}

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const dataContext = useContext(DataContext);
  const { activeModal, inactiveModal } = useContext(ModalContext);

  const { chainInfoMap, chainStateMap } = useSelector((state: RootState) => state.chainStore);
  const { changeFilters, onApplyFilter, onChangeFilterOpt, selectedFilters } = useFilterModal(Object.values(chainInfoMap), 'filterTokenModal');
  const allChains = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return filterChains(chainInfoMap, chainStateMap, selectedFilters);
  }, [chainInfoMap, chainStateMap, selectedFilters]);
  const { hasMore, lazyItems, loadMoreItems } = useLazyList(allChains);

  const searchToken = useCallback((chainInfo: _ChainInfo, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      chainInfo.name.toLowerCase().includes(searchTextLowerCase)
    );
  }, []);

  const renderChainItem = useCallback((chainInfo: _ChainInfo) => {
    return (
      <NetworkToggleItem
        chainInfo={chainInfo}
        chainStateMap={chainStateMap}
      />
    );
  }, [chainStateMap]);

  const emptyTokenList = useCallback(() => {
    return (
      <EmptyList
        emptyMessage={t<string>('Your chain will appear here.')}
        emptyTitle={t<string>('No chain found')}
        phosphorIcon={ListChecks}
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
          navigate('/settings/chains/import', { state: { isExternalRequest: false } });
        }
      }
    ];
  }, [navigate]);

  const onBack = useCallback(() => {
    navigate(-1);
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
      className={`manage_chains ${className}`}
      resolve={dataContext.awaitStores(['chainStore'])}
    >
      <Layout.Base
        onBack={onBack}
        showBackButton={true}
        showSubHeader={true}
        subHeaderBackground={'transparent'}
        subHeaderCenter={true}
        subHeaderIcons={subHeaderButton}
        subHeaderPaddingVertical={true}
        title={t<string>('Manage chains')}
      >
        <SwList.Section
          actionBtnIcon={<Icon
            phosphorIcon={FadersHorizontal}
            size='sm'
            weight={'fill'}
          />}
          className={'manage_chains__container'}
          enableSearchInput={true}
          ignoreScrollbar={lazyItems.length > 2}
          list={lazyItems}
          mode={'boxed'}
          onClickActionBtn={openFilterModal}
          pagination={{
            hasMore,
            loadMore: loadMoreItems
          }}
          renderItem={renderChainItem}
          renderOnScroll={true}
          renderWhenEmpty={emptyTokenList}
          searchFunction={searchToken}
          searchMinCharactersCount={2}
          searchPlaceholder={t<string>('Search chain')}
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

const ManageChains = styled(Component)<Props>(({ theme: { token } }: Props) => {
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

    '.manage_chains__container': {
      paddingTop: token.padding,
      paddingBottom: token.paddingSM,
      flex: 1
    }
  });
});

export default ManageChains;
