// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _isChainEvmCompatible, _isCustomChain, _isSubstrateChain } from '@subwallet/extension-base/services/chain-service/utils';
import EmptyList from '@subwallet/extension-koni-ui/components/EmptyList';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { FilterModal } from '@subwallet/extension-koni-ui/components/Modal/FilterModal';
import NetworkToggleItem from '@subwallet/extension-koni-ui/components/NetworkToggleItem';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import useChainInfoWithState, { ChainInfoWithState } from '@subwallet/extension-koni-ui/hooks/chain/useChainInfoWithState';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import { useFilterModal } from '@subwallet/extension-koni-ui/hooks/modal/useFilterModal';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ButtonProps, Icon, ModalContext, SwList } from '@subwallet/react-ui';
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

function filterChains (chainInfoList: ChainInfoWithState[], filters: string[]): ChainInfoWithState[] {
  const filteredChainList: ChainInfoWithState[] = [];

  chainInfoList.forEach((chainInfo) => {
    let isValidationPassed = filters.length <= 0;

    for (const filter of filters) {
      switch (filter) {
        case FilterValue.CUSTOM:
          isValidationPassed = _isCustomChain(chainInfo.slug);
          break;
        case FilterValue.ENABLED:
          isValidationPassed = chainInfo.active;
          break;
        case FilterValue.DISABLED:
          isValidationPassed = !chainInfo.active;
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
  const { chainInfoMap } = useSelector((state: RootState) => state.chainStore);
  const chainInfoList = useChainInfoWithState();
  const { changeFilters, onApplyFilter, onChangeFilterOpt, selectedFilters } = useFilterModal(Object.values(chainInfoMap), 'filterTokenModal');
  const allChains = useMemo(() => {
    return filterChains(chainInfoList, selectedFilters);
  }, [chainInfoList, selectedFilters]);

  const searchToken = useCallback((chainInfo: ChainInfoWithState, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return chainInfo.name.toLowerCase().includes(searchTextLowerCase);
  }, []);

  const renderChainItem = useCallback((chainInfo: ChainInfoWithState) => {
    return <NetworkToggleItem chainInfo={chainInfo} />;
  }, []);

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
          ignoreScrollbar={allChains.length > 7}
          list={allChains}
          mode={'boxed'}
          onClickActionBtn={openFilterModal}
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
