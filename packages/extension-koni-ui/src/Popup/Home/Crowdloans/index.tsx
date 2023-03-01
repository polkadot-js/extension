// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import Layout from '@subwallet/extension-koni-ui/components/Layout';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { Button, Checkbox, CrowdloanItem, Icon, SwList, SwModal, Tag } from '@subwallet/react-ui';
import { CrowdloanItemType } from '@subwallet/extension-koni-ui/types/crowdloan';
import useGetCrowdloanList from '@subwallet/extension-koni-ui/hooks/screen/crowdloan/useGetCrowdloanList';
import { CrowdloanParaState } from '@subwallet/extension-base/background/KoniTypes';
import { Rocket, FadersHorizontal } from 'phosphor-react';
import { ModalContext } from '@subwallet/react-ui/es/sw-modal/provider';
import { CheckboxChangeEvent } from '@subwallet/react-ui/es/checkbox';
import EmptyList from '@subwallet/extension-koni-ui/components/EmptyList';

interface Props extends ThemeProps {

}

const TOKENS_PER_PAGE = 10;

enum FilterValue {
  POLKADOT_PARACHAIN = 'Polkadot parachain',
  KUSAMA_PARACHAIN = 'Kusama parachain',
  WINNER = 'completed',
  FAIL = 'failed'
}

const FILTER_OPTIONS = [
  { label: 'Polkadot parachain', value: FilterValue.POLKADOT_PARACHAIN },
  { label: 'Kusama parachain', value: FilterValue.KUSAMA_PARACHAIN },
  { label: 'Win', value: FilterValue.WINNER },
  { label: 'Fail', value: FilterValue.FAIL }
];

function getTagColor(paraState?: CrowdloanParaState) {
  if (!paraState) {
    return 'default';
  }

  if (paraState.valueOf() === CrowdloanParaState.COMPLETED.valueOf()) {
    return 'success';
  }

  if (paraState === CrowdloanParaState.FAILED.valueOf()) {
    return 'error';
  }

  if (paraState === CrowdloanParaState.ONGOING.valueOf()) {
    return 'warning';
  }

  return 'default';
}

function getRelayParentKey(groupDisplayName: string) {
  if (groupDisplayName === 'Polkadot parachain') {
    return 'polkadot';
  } else {
    return 'kusama';
  }
}

function getFilteredList(items: CrowdloanItemType[], filters: FilterValue[]) {
  const filteredList: CrowdloanItemType[] = [];
  items.forEach((item) => {
    let isValidationPassed = filters.length <= 0;

    for (const filter of filters) {
      switch (filter) {
        case FilterValue.POLKADOT_PARACHAIN:
          isValidationPassed = item.relayParentDisplayName === 'Polkadot parachain';
          break;
        case FilterValue.KUSAMA_PARACHAIN:
          isValidationPassed = item.relayParentDisplayName === 'Kusama parachain';
          break;
        case FilterValue.WINNER:
          isValidationPassed = item.paraState === CrowdloanParaState.COMPLETED.valueOf();
          break;
        case FilterValue.FAIL:
          isValidationPassed = item.paraState === CrowdloanParaState.FAILED.valueOf();
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
  })

  return filteredList;
}

const FILTER_MODAL_ID = 'crowdloan-filter-modal';

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const dataContext = useContext(DataContext);
  const items: CrowdloanItemType[] = useGetCrowdloanList();
  const { inactiveModal, activeModal } = useContext(ModalContext);
  const [selectedFilters, setSelectedFilters] = useState<FilterValue[]>([]);
  const [changeFilters, setChangeFilters] = useState<FilterValue[]>(selectedFilters);
  const [filteredList, setFilteredList] = useState<CrowdloanItemType[]>([]);
  const [paging, setPaging] = useState(TOKENS_PER_PAGE);
  const allCrowdloanList = useMemo(() => {
    return getFilteredList(items, selectedFilters);
  }, [items, selectedFilters]);

  useEffect(() => {
    setFilteredList(allCrowdloanList.slice(0, TOKENS_PER_PAGE));
    setPaging(TOKENS_PER_PAGE);
  }, [allCrowdloanList])

  //load more
  const hasMore = useMemo(() => {
    return allCrowdloanList.length > filteredList.length;
  }, [allCrowdloanList.length, filteredList.length]);

  const loadMoreItems = useCallback(() => {
    setTimeout(() => {
      if (hasMore) {
        const nextPaging = paging + TOKENS_PER_PAGE;
        const to = nextPaging > allCrowdloanList.length? allCrowdloanList.length : nextPaging

        setFilteredList(allCrowdloanList.slice(0, to));
        setPaging(nextPaging);
      }
    }, 50)
  }, [allCrowdloanList, hasMore, paging]);

  //filter
  const onClickActionBtn = () => {
    activeModal(FILTER_MODAL_ID);
  }

  const onChangeFilterOpt = useCallback((e: CheckboxChangeEvent) => {
    const changedValue = e.target.value as FilterValue;

    if (e.target.checked) {
      setChangeFilters([...changeFilters, changedValue]);
    } else {
      const newSelectedFilters: FilterValue[] = [];
      changeFilters.forEach((filterVal) => {
        if (filterVal !== changedValue) {
          newSelectedFilters.push(filterVal)
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
  }, [changeFilters, inactiveModal])

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
        <span className={'crowdloan__token_filter_button'}>{t('Apply filter')}</span>
      </Button>
    );
  }, [t, onApplyFilter]);

  const searchFunction = useCallback((item: CrowdloanItemType, searchText: string) => {
    const searchTextLowerCase = searchText.toLowerCase();

    return (
      item.chainDisplayName.toLowerCase().includes(searchTextLowerCase)
    );
  }, []);

  //render item
  const getParaStateLabel = (paraState?: CrowdloanParaState) => {
    if (!paraState) {
      return '';
    }

    if (paraState.valueOf() === CrowdloanParaState.COMPLETED.valueOf()) {
      return t('Win');
    }

    if (paraState === CrowdloanParaState.FAILED.valueOf()) {
      return t('Fail');
    }

    if (paraState === CrowdloanParaState.ONGOING.valueOf()) {
      return t('Active');
    }

    return '';
  }

  const renderItem = (item: CrowdloanItemType) => {
    return (
      <CrowdloanItem
        className={'crowdloan-item'}
        decimal={0}
        key={`${item.symbol}_${item.slug}`}
        balanceValue={item.contribute}
        convertedBalanceValue={item.convertedContribute}
        displayNetwork={item.chainDisplayName}
        crowdloanStatusTag={
          <Tag color={getTagColor(item.paraState)}>{getParaStateLabel(item.paraState)}</Tag>
        }
        paraChain={item.relayParentDisplayName}
        displayToken={item.symbol}
        networkKey={item.slug}
        subNetworkKey={getRelayParentKey(item.relayParentDisplayName)}
        isShowSubLogo={true}
      />
    );
  }

  //empty list
  const emptyCrowdloanList = () => {
    return (
      <EmptyList
        phosphorIcon={Rocket}
        emptyTitle={t('No crowdloan')}
        emptyMessage={t('Your crowdloan will appear here!')}
      />
    );
  };

  return (
    <PageWrapper
      className={`crowdloans ${className}`}
      resolve={dataContext.awaitStores(['crowdloan', 'price', 'chainStore'])}
    >
      <Layout.Base
        showSubHeader={true}
        subHeaderBackground={'transparent'}
        subHeaderCenter={false}
        subHeaderPaddingVertical={true}
        title={t<string>('Crowdloans')}
      >
        <SwList.Section
          enableSearchInput={true}
          searchPlaceholder={t('Search project')}
          showActionBtn
          actionBtnIcon={<Icon phosphorIcon={FadersHorizontal} />}
          onClickActionBtn={onClickActionBtn}
          list={filteredList}
          pagination={{
            hasMore,
            loadMore: loadMoreItems
          }}
          renderOnScroll={false}
          renderWhenEmpty={emptyCrowdloanList}
          renderItem={renderItem}
          searchFunction={searchFunction}
          searchMinCharactersCount={1}
        />

        <SwModal
          className={className}
          id={FILTER_MODAL_ID}
          title={t('Filter')}
          onCancel={closeFilterModal}
          footer={filterModalFooter()}
        >
          <div className={'crowdloan__filter_option_wrapper'}>
            {
              FILTER_OPTIONS.map((opt) => {
                return (
                  <div
                    className={'crowdloan__filter_option'}
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
                )
              })
            }
          </div>
        </SwModal>
      </Layout.Base>
    </PageWrapper>
  );
}

const Crowdloans = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    color: token.colorTextLight1,
    fontSize: token.fontSizeLG,

    '.crowdloan-item': {
      marginBottom: token.marginXS,
    },

    '.crowdloan__filter_option': {
      width: '100%'
    },

    '.crowdloan__filter_option_wrapper': {
      display: 'flex',
      flexDirection: 'column',
      gap: token.marginLG
    },
  });
});

export default Crowdloans;
