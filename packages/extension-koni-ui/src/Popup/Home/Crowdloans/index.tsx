// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CrowdloanParaState } from '@subwallet/extension-base/background/KoniTypes';
import EmptyList from '@subwallet/extension-koni-ui/components/EmptyList';
import Layout from '@subwallet/extension-koni-ui/components/Layout';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import useTranslation from '@subwallet/extension-koni-ui/hooks/common/useTranslation';
import useGetCrowdloanList from '@subwallet/extension-koni-ui/hooks/screen/crowdloan/useGetCrowdloanList';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { CrowdloanItemType } from '@subwallet/extension-koni-ui/types/crowdloan';
import { Button, Checkbox, CrowdloanItem, Icon, SwList, SwModal, Tag } from '@subwallet/react-ui';
import { CheckboxChangeEvent } from '@subwallet/react-ui/es/checkbox';
import { ModalContext } from '@subwallet/react-ui/es/sw-modal/provider';
import { FadersHorizontal, Rocket } from 'phosphor-react';
import React, { SyntheticEvent, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

type Props = ThemeProps

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

function getTagColor (paraState?: CrowdloanParaState) {
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

function getRelayParentKey (groupDisplayName: string) {
  if (groupDisplayName === 'Polkadot parachain') {
    return 'polkadot';
  } else {
    return 'kusama';
  }
}

function getFilteredList (items: CrowdloanItemType[], filters: FilterValue[]) {
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
  });

  return filteredList;
}

const FILTER_MODAL_ID = 'crowdloan-filter-modal';

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const dataContext = useContext(DataContext);
  const items: CrowdloanItemType[] = useGetCrowdloanList();
  const { activeModal, inactiveModal } = useContext(ModalContext);
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
  }, [allCrowdloanList]);

  // load more
  const hasMore = useMemo(() => {
    return allCrowdloanList.length > filteredList.length;
  }, [allCrowdloanList.length, filteredList.length]);

  const loadMoreItems = useCallback(() => {
    setTimeout(() => {
      if (hasMore) {
        const nextPaging = paging + TOKENS_PER_PAGE;
        const to = nextPaging > allCrowdloanList.length ? allCrowdloanList.length : nextPaging;

        setFilteredList(allCrowdloanList.slice(0, to));
        setPaging(nextPaging);
      }
    }, 50);
  }, [allCrowdloanList, hasMore, paging]);

  // filter
  const onClickActionBtn = useCallback(
    (e?: SyntheticEvent) => {
      e && e.stopPropagation();
      activeModal(FILTER_MODAL_ID);
    },
    [activeModal]
  );

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

  // render item
  const getParaStateLabel = useCallback((paraState?: CrowdloanParaState) => {
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
  }, [t]);

  const renderItem = useCallback(
    (item: CrowdloanItemType) => {
      return (
        <CrowdloanItem
          balanceValue={item.contribute}
          className={'crowdloan-item'}
          convertedBalanceValue={item.convertedContribute}
          crowdloanStatusTag={
            <Tag color={getTagColor(item.paraState)}>{getParaStateLabel(item.paraState)}</Tag>
          }
          decimal={0}
          displayNetwork={item.chainDisplayName}
          displayToken={item.symbol}
          isShowSubLogo={true}
          key={`${item.symbol}_${item.slug}`}
          networkKey={item.slug}
          paraChain={item.relayParentDisplayName}
          subNetworkKey={getRelayParentKey(item.relayParentDisplayName)}
        />
      );
    },
    [getParaStateLabel]
  );

  // empty list
  const emptyCrowdloanList = useCallback(
    () => {
      return (
        <EmptyList
          emptyMessage={t('Your crowdloan will appear here!')}
          emptyTitle={t('No crowdloan')}
          phosphorIcon={Rocket}
        />
      );
    },
    [t]
  );

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
          actionBtnIcon={<Icon phosphorIcon={FadersHorizontal} />}
          enableSearchInput={true}
          ignoreScrollbar={items.length > 4}
          list={filteredList}
          onClickActionBtn={onClickActionBtn}
          pagination={{
            hasMore,
            loadMore: loadMoreItems
          }}
          renderItem={renderItem}
          renderOnScroll={false}
          renderWhenEmpty={emptyCrowdloanList}
          searchFunction={searchFunction}
          searchMinCharactersCount={2}
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
                );
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
      height: '100%'
    },

    '.ant-sw-list-wrapper': {
      overflow: 'auto'
    }
  });
});

export default Crowdloans;
