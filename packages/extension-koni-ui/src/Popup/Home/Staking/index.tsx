// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakingType } from '@subwallet/extension-base/background/KoniTypes';
import EmptyList from '@subwallet/extension-koni-ui/components/EmptyList';
import Layout from '@subwallet/extension-koni-ui/components/Layout';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { FilterModal } from '@subwallet/extension-koni-ui/components/Modal/FilterModal';
import SwStakingItem from '@subwallet/extension-koni-ui/components/StakingItem';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { useFilterModal } from '@subwallet/extension-koni-ui/hooks/modal/useFilterModal';
import { useLazyList } from '@subwallet/extension-koni-ui/hooks/modal/useLazyList';
import useGetStakingList from '@subwallet/extension-koni-ui/hooks/screen/staking/useGetStakingList';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import MoreActionModal, { MORE_ACTION_MODAL } from '@subwallet/extension-koni-ui/Popup/Home/Staking/MoreActionModal';
import StakingDetailModal, { STAKING_DETAIL_MODAL_ID } from '@subwallet/extension-koni-ui/Popup/Home/Staking/StakingDetailModal';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { StakingDataType } from '@subwallet/extension-koni-ui/types/staking';
import { ButtonProps, Icon, SwList } from '@subwallet/react-ui';
import { ModalContext } from '@subwallet/react-ui/es/sw-modal/provider';
import { FadersHorizontal, Plus, Trophy } from 'phosphor-react';
import React, { SyntheticEvent, useCallback, useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps

const FILTER_MODAL_ID = 'staking-filter-modal';

enum FilterValue {
  NOMINATED = 'nominated',
  POOLED = 'pooled'
}

const FILTER_OPTIONS = [
  { label: 'Nominated', value: FilterValue.NOMINATED },
  { label: 'Pooled', value: FilterValue.POOLED }
];

const rightIcon = <Icon
  phosphorIcon={Plus}
  size='sm'
  type='phosphor'
/>;

function getFilteredList (items: StakingDataType[], filters: string[]) {
  const filteredList: StakingDataType[] = [];

  items.forEach((item) => {
    let isValidationPassed = filters.length <= 0;

    for (const filter of filters) {
      switch (filter) {
        case FilterValue.NOMINATED:
          isValidationPassed = item.staking.type === 'nominated';
          break;
        case FilterValue.POOLED:
          isValidationPassed = item.staking.type === 'pooled';
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
      filteredList.push(item);
    }
  });

  return filteredList;
}

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const dataContext = useContext(DataContext);
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { data, priceMap } = useGetStakingList();
  const [{ chain, stakingType }, setSelectedItem] = useState<{ chain: string | undefined, stakingType: StakingType | undefined }>({ chain: undefined, stakingType: undefined });
  const { changeFilters, onApplyFilter, onChangeFilterOpt, selectedFilters } = useFilterModal(data, FILTER_MODAL_ID);
  const filteredList = useMemo(() => {
    return getFilteredList(data, selectedFilters);
  }, [data, selectedFilters]);
  const { hasMore, lazyItems, loadMoreItems } = useLazyList(filteredList);

  const onClickActionBtn = useCallback(() => {
    activeModal(FILTER_MODAL_ID);
  }, [activeModal]);

  const closeFilterModal = useCallback(() => {
    inactiveModal(FILTER_MODAL_ID);
  }, [inactiveModal]);

  const onClickRightIcon = useCallback((e?: SyntheticEvent) => {
    e && e.stopPropagation();
    activeModal(MORE_ACTION_MODAL);
  }, [activeModal]);

  const onClickItem = useCallback((chain: string, stakingType: StakingType) => {
    setSelectedItem({
      chain,
      stakingType
    });

    activeModal(STAKING_DETAIL_MODAL_ID);
  }, [activeModal]);

  const subHeaderButton: ButtonProps[] = [
    {
      icon: rightIcon,
      onClick: () => {
        navigate('/transaction/stake');
      }
    }
  ];

  const renderItem = useCallback((item: StakingDataType) => {
    return (
      <SwStakingItem
        className='staking-item'
        decimals={item.decimals}
        key={`${item.staking.chain}-${item.staking.type}`}
        onClickItem={onClickItem}
        onClickRightIcon={onClickRightIcon}
        priceMap={priceMap}
        stakingData={item}
      />
    );
  }, [onClickItem, onClickRightIcon, priceMap]);

  const searchFunction = useCallback((item: StakingDataType, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      item.staking.name.toLowerCase().includes(searchTextLowerCase)
    );
  }, []);

  const emptyStakingList = useCallback(() => {
    return (
      <EmptyList
        emptyMessage={t('Your staking accounts will appear here!')}
        emptyTitle={t('No staking')}
        phosphorIcon={Trophy}
      />
    );
  }, [t]);

  return (
    <PageWrapper
      className={`staking ${className}`}
      resolve={dataContext.awaitStores(['staking', 'price'])}
    >
      <Layout.Base
        showSubHeader={true}
        subHeaderBackground={'transparent'}
        subHeaderCenter={false}
        subHeaderIcons={subHeaderButton}
        subHeaderPaddingVertical={true}
        title={t('Staking')}
      >
        <SwList.Section
          actionBtnIcon={<Icon phosphorIcon={FadersHorizontal} />}
          enableSearchInput={true}
          ignoreScrollbar={lazyItems.length > 3}
          list={lazyItems}
          onClickActionBtn={onClickActionBtn}
          pagination={{
            hasMore,
            loadMore: loadMoreItems
          }}
          renderItem={renderItem}
          renderOnScoll={true}
          renderWhenEmpty={emptyStakingList}
          searchFunction={searchFunction}
          searchMinCharactersCount={2}
          searchPlaceholder={t('Search project')}
          showActionBtn
        />

        <FilterModal
          id={FILTER_MODAL_ID}
          onApplyFilter={onApplyFilter}
          onCancel={closeFilterModal}
          onChangeOption={onChangeFilterOpt}
          optionSelection={changeFilters}
          options={FILTER_OPTIONS}
        />

        <StakingDetailModal
          chain={chain}
          stakingType={stakingType}
        />

        <MoreActionModal />
      </Layout.Base>
    </PageWrapper>
  );
}

export const Staking = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    color: token.colorTextLight1,
    fontSize: token.fontSizeLG,

    '.staking__filter_option': {
      width: '100%'
    },

    '.staking__filter_option_wrapper': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.marginLG
    },

    '.staking-item': {
      marginBottom: token.marginXS
    },

    '.ant-sw-list-section': {
      height: '100%'
    },

    '.ant-sw-list': {
      overflow: 'auto'
    }
  });
});

export default Staking;
