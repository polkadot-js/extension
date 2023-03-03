// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakingType } from '@subwallet/extension-base/background/KoniTypes';
import EmptyList from '@subwallet/extension-koni-ui/components/EmptyList';
import Layout from '@subwallet/extension-koni-ui/components/Layout';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import SwStakingItem from '@subwallet/extension-koni-ui/components/StakingItem';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import useGetStakingList from '@subwallet/extension-koni-ui/hooks/screen/staking/useGetStakingList';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import MoreActionModal, { MORE_ACTION_MODAL } from '@subwallet/extension-koni-ui/Popup/Home/Staking/MoreActionModal';
import StakingDetailModal, { STAKING_DETAIL_MODAL_ID } from '@subwallet/extension-koni-ui/Popup/Home/Staking/StakingDetailModal';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { StakingDataType } from '@subwallet/extension-koni-ui/types/staking';
import { Button, Checkbox, Icon, SwList, SwModal } from '@subwallet/react-ui';
import { CheckboxChangeEvent } from '@subwallet/react-ui/es/checkbox';
import { ModalContext } from '@subwallet/react-ui/es/sw-modal/provider';
import { FadersHorizontal, Trophy } from 'phosphor-react';
import React, { SyntheticEvent, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

type Props = ThemeProps

const FILTER_MODAL_ID = 'staking-filter-modal';

const TOKENS_PER_PAGE = 10;

enum FilterValue {
  NOMINATED = 'nominated',
  POOLED = 'pooled'
}

const FILTER_OPTIONS = [
  { label: 'Nominated', value: FilterValue.NOMINATED },
  { label: 'Pooled', value: FilterValue.POOLED }
];

function getFilteredList (items: StakingDataType[], filters: FilterValue[]) {
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
  const { t } = useTranslation();
  const { data, priceMap } = useGetStakingList();
  const [selectedFilters, setSelectedFilters] = useState<FilterValue[]>([]);
  const [changeFilters, setChangeFilters] = useState<FilterValue[]>(selectedFilters);
  const [filteredList, setFilteredList] = useState<StakingDataType[]>([]);
  const [{ chain, stakingType }, setSelectedItem] = useState<{ chain: string | undefined, stakingType: StakingType | undefined }>({ chain: undefined, stakingType: undefined });
  const [paging, setPaging] = useState(TOKENS_PER_PAGE);
  const allStakingList = useMemo(() => {
    return getFilteredList(data, selectedFilters);
  }, [data, selectedFilters]);

  useEffect(() => {
    setFilteredList(allStakingList.slice(0, TOKENS_PER_PAGE));
    setPaging(TOKENS_PER_PAGE);
  }, [allStakingList]);

  const hasMore = useMemo(() => {
    return allStakingList.length > filteredList.length;
  }, [allStakingList.length, filteredList.length]);

  const loadMoreItems = useCallback(() => {
    setTimeout(() => {
      if (hasMore) {
        const nextPaging = paging + TOKENS_PER_PAGE;
        const to = nextPaging > allStakingList.length ? allStakingList.length : nextPaging;

        setFilteredList(allStakingList.slice(0, to));
        setPaging(nextPaging);
      }
    }, 50);
  }, [allStakingList, hasMore, paging]);

  const onClickActionBtn = () => {
    activeModal(FILTER_MODAL_ID);
  };

  const onChangeFilterOpt = useCallback((e: CheckboxChangeEvent) => {
    const changedValue = e.target.value as FilterValue;

    if (e.target.checked) {
      setChangeFilters([...changeFilters, changedValue]);
    } else {
      const newSelectedFilters: FilterValue[] = [];

      changeFilters.forEach((filterVal) => {
        if (filterVal !== changedValue) {
          newSelectedFilters.push(filterVal);
        }
      });
      setChangeFilters(newSelectedFilters);
    }
  }, [changeFilters]);

  const closeFilterModal = useCallback(() => {
    inactiveModal(FILTER_MODAL_ID);
  }, [inactiveModal]);

  const onApplyFilter = useCallback(() => {
    inactiveModal(FILTER_MODAL_ID);
    setSelectedFilters(changeFilters);
  }, [changeFilters, inactiveModal]);

  const filterModalFooter = useCallback(() => {
    return (
      <Button
        block={true}
        icon={<Icon
          phosphorIcon={FadersHorizontal}
          type='phosphor'
          weight={'bold'}
        />}
        onClick={onApplyFilter}
      >
        <span className={'staking__token_filter_button'}>{t('Apply filter')}</span>
      </Button>
    );
  }, [t, onApplyFilter]);

  const onClickRightIcon = useCallback((e?: SyntheticEvent) => {
    e && e.stopPropagation();
    activeModal(MORE_ACTION_MODAL);
  }, [activeModal]);

  const onClickItem = useCallback((chain: string, stakingType: StakingType) => {
    setSelectedItem({
      chain,
      stakingType
    });
    console.log('345345345345');
    activeModal(STAKING_DETAIL_MODAL_ID);
  }, [activeModal]);

  const renderItem = useCallback((item: StakingDataType) => {
    return (
      <SwStakingItem
        className='staking-item'
        decimals={item.decimals}
        key={item.staking.chain}
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

  const emptyStakingList = () => {
    return (
      <EmptyList
        emptyMessage={t('Your staking accounts will appear here!')}
        emptyTitle={t('No staking')}
        phosphorIcon={Trophy}
      />
    );
  };

  return (
    <PageWrapper
      className={`staking ${className}`}
      resolve={dataContext.awaitStores(['staking', 'price'])}
    >
      <Layout.Base
        showSubHeader={true}
        subHeaderBackground={'transparent'}
        subHeaderCenter={false}
        subHeaderPaddingVertical={true}
        title={t('Staking')}
      >
        <SwList.Section
          actionBtnIcon={<Icon phosphorIcon={FadersHorizontal} />}
          enableSearchInput={true}
          list={allStakingList}
          // eslint-disable-next-line react/jsx-no-bind
          onClickActionBtn={onClickActionBtn}
          pagination={{
            hasMore,
            loadMore: loadMoreItems
          }}
          renderItem={renderItem}
          renderOnScoll={true}
          // eslint-disable-next-line react/jsx-no-bind
          renderWhenEmpty={emptyStakingList}
          searchFunction={searchFunction}
          searchMinCharactersCount={1}
          searchPlaceholder={t('Search project')}
          showActionBtn
        />

        <SwModal
          className={className}
          footer={filterModalFooter()}
          id={FILTER_MODAL_ID}
          onCancel={closeFilterModal}
          title={t('Filter')}
        >
          <div className={'staking__filter_option_wrapper'}>
            {
              FILTER_OPTIONS.map((opt) => {
                return (
                  <div
                    className={'staking__filter_option'}
                    key={opt.label}
                  >
                    <Checkbox
                      checked={changeFilters.includes(opt.value)}
                      onChange={onChangeFilterOpt}
                      value={opt.value}
                    >
                      {opt.label}
                    </Checkbox>
                  </div>
                );
              })
            }
          </div>
        </SwModal>

        <StakingDetailModal chain={chain} stakingType={stakingType} />

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
    }
  });
});

export default Staking;
