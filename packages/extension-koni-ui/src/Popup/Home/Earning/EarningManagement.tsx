// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolInfo, YieldPoolType } from '@subwallet/extension-base/background/KoniTypes';
import { FilterModal, Layout, PageWrapper, SortingModal } from '@subwallet/extension-koni-ui/components';
import EarningBtn from '@subwallet/extension-koni-ui/components/EarningBtn';
import HorizontalEarningItem from '@subwallet/extension-koni-ui/components/HorizontalEarningItem';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { useFilterModal, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import EarningCalculatorModal, { STAKING_CALCULATOR_MODAL_ID } from '@subwallet/extension-koni-ui/Popup/Home/Earning/EarningCalculatorModal';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { BackgroundIcon, Button, Icon, ModalContext, SwList, Typography } from '@subwallet/react-ui';
import CN from 'classnames';
import { CaretDown, FadersHorizontal, Question, SortAscending } from 'phosphor-react';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled, { useTheme } from 'styled-components';

type Props = ThemeProps;

const FILTER_MODAL_ID = 'earning-filter-modal';
const SORTING_MODAL_ID = 'earning-sorting-modal';

enum SortKey {
  TOTAL_VALUE = 'total-value',
}

interface SortOption {
  label: string;
  value: SortKey;
  desc: boolean;
}

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { token } = useTheme() as Theme;
  const navigate = useNavigate();
  const dataContext = useContext(DataContext);
  const { poolInfo, yieldPosition } = useSelector((state: RootState) => state.yieldPool);
  const { activeModal } = useContext(ModalContext);
  const [selectedItem, setSelectedItem] = useState<YieldPoolInfo | undefined>(undefined);
  const [sortSelection, setSortSelection] = useState<SortKey>(SortKey.TOTAL_VALUE);
  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, selectedFilters } = useFilterModal(FILTER_MODAL_ID);
  const filterOptions = useMemo(() => [
    { label: t('Nomination pool'), value: YieldPoolType.NOMINATION_POOL },
    { label: t('Native staking'), value: YieldPoolType.NATIVE_STAKING },
    { label: t('Liquid staking'), value: YieldPoolType.LIQUID_STAKING },
    { label: t('Lending'), value: YieldPoolType.LENDING },
    { label: t('Parachain staking'), value: YieldPoolType.PARACHAIN_STAKING },
    { label: t('Single farming'), value: YieldPoolType.SINGLE_FARMING }
  ], [t]);

  console.log('yieldPosition', yieldPosition);

  const sortingOptions: SortOption[] = useMemo(() => {
    return [
      {
        desc: true,
        label: t('Sort by total value'),
        value: SortKey.TOTAL_VALUE
      }
    ];
  }, [t]);

  const onChangeSortOpt = useCallback((value: string) => {
    setSortSelection(value as SortKey);
  }, []);

  const onResetSort = useCallback(() => {
    setSortSelection(SortKey.TOTAL_VALUE);
  }, []);

  const filterFunction = useMemo<(item: YieldPoolInfo) => boolean>(() => {
    return (item) => {
      if (!selectedFilters.length) {
        return true;
      }

      for (const filter of selectedFilters) {
        if (filter === '') {
          return true;
        }

        if (filter === YieldPoolType.NOMINATION_POOL) {
          if (item.type === YieldPoolType.NOMINATION_POOL) {
            return true;
          }
        } else if (filter === YieldPoolType.NATIVE_STAKING) {
          if (item.type === YieldPoolType.NATIVE_STAKING) {
            return true;
          }
        } else if (filter === YieldPoolType.LIQUID_STAKING) {
          if (item.type === YieldPoolType.LIQUID_STAKING) {
            return true;
          }
        } else if (filter === YieldPoolType.LENDING) {
          if (item.type === YieldPoolType.LENDING) {
            return true;
          }
        } else if (filter === YieldPoolType.PARACHAIN_STAKING) {
          if (item.type === YieldPoolType.PARACHAIN_STAKING) {
            return true;
          }
        } else if (filter === YieldPoolType.SINGLE_FARMING) {
          if (item.type === YieldPoolType.SINGLE_FARMING) {
            return true;
          }
        }
      }

      return false;
    };
  }, [selectedFilters]);

  const onClickCalculatorBtn = useCallback((item: YieldPoolInfo) => {
    setSelectedItem(item);
    activeModal(STAKING_CALCULATOR_MODAL_ID);
  }, [activeModal]);

  const onClickStakeBtn = useCallback((item: YieldPoolInfo) => {
    setSelectedItem(item);
    navigate(`/transaction/earn/${item.slug}`);
  }, [navigate]);

  const renderEarningItem = useCallback((item: YieldPoolInfo) => {
    return (
      <HorizontalEarningItem
        item={item}
        key={item.slug}
        onClickCalculatorBtn={() => onClickCalculatorBtn(item)}
        onClickStakeBtn={() => onClickStakeBtn(item)}
      />
    );
  }, [onClickCalculatorBtn, onClickStakeBtn]);

  const filterLabel = useMemo(() => {
    if (!selectedFilters.length) {
      return t('All type');
    } else {
      if (selectedFilters.length === 1) {
        return filterOptions.find((opt) => opt.value === selectedFilters[0])?.label;
      } else {
        return t(`${selectedFilters.length} selected`);
      }
    }
  }, [selectedFilters, filterOptions, t]);

  const resultList = useMemo((): YieldPoolInfo[] => {
    return [...Object.values(poolInfo)]
      .sort((a: YieldPoolInfo, b: YieldPoolInfo) => {
        switch (sortSelection) {
          case SortKey.TOTAL_VALUE:
            if (a.stats && b.stats && a.stats.tvl && b.stats.tvl) {
              return parseFloat(a.stats.tvl) - parseFloat(b.stats.tvl);
            } else {
              return 0;
            }

          default:
            return 0;
        }
      });
  }, [poolInfo, sortSelection]);

  const sortingLabel = useMemo(() => {
    return sortingOptions.find((item) => item.value === sortSelection)?.label || '';
  }, [selectedFilters, filterOptions, t]);

  return (
    <PageWrapper
      className={`earning ${className}`}
      resolve={dataContext.awaitStores(['yieldPool', 'price'])}
    >
      <Layout.Base
        showSubHeader={true}
        subHeaderBackground={'transparent'}
        subHeaderCenter={false}
        // subHeaderIcons={subHeaderButton}
        subHeaderPaddingVertical={true}
        title={t('Earning')}
      >

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: token.padding }}>
          <div>
            <EarningBtn
              network={'polkadot'}
              size={'xs'}
            >
              {'DOT'}
            </EarningBtn>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: token.paddingXS }}>
            <Button
              icon={<Icon
                iconColor={token.colorTextLight4}
                phosphorIcon={Question}
                weight={'duotone'}
              />}
              size={'xs'}
              type={'ghost'}
            >{t('Help')}</Button>
            <Button
              icon={<BackgroundIcon
                backgroundColor={token.colorTextLight4}
                iconColor={token.colorWhite}
                phosphorIcon={FadersHorizontal}
                size={'sm'}
              />}
              onClick={() => activeModal(FILTER_MODAL_ID)}
              schema='secondary'
              shape={'round'}
              size={'xs'}
            >
              <div style={{ display: 'flex', gap: token.paddingXS, alignItems: 'center', paddingLeft: token.paddingXS }}>
                <Typography.Text>{filterLabel}</Typography.Text>
                <Icon
                  className={'earning-filter-icon'}
                  customSize={'12px'}
                  iconColor={token.colorTextLight4}
                  phosphorIcon={CaretDown}
                  weight={'bold'}
                />
              </div>
            </Button>
            <Button
              icon={<BackgroundIcon
                backgroundColor={token.colorTextLight4}
                iconColor={token.colorWhite}
                phosphorIcon={SortAscending}
                size={'sm'}
              />}
              onClick={() => activeModal(SORTING_MODAL_ID)}
              schema='secondary'
              shape={'round'}
              size={'xs'}
            >
              <div style={{ display: 'flex', gap: token.paddingXS, alignItems: 'center', paddingLeft: token.paddingXS }}>
                <Typography.Text>{sortingLabel}</Typography.Text>
                <Icon
                  className={'earning-filter-icon'}
                  customSize={'12px'}
                  iconColor={token.colorTextLight4}
                  phosphorIcon={CaretDown}
                  weight={'bold'}
                />
              </div>
            </Button>
          </div>
        </div>
        <SwList.Section
          className={CN('earning-management__container')}
          enableSearchInput={false}
          filterBy={filterFunction}
          list={resultList}
          renderItem={renderEarningItem}
          renderOnScroll={true}
          renderWhenEmpty={<></>}
          searchMinCharactersCount={2}
        />

        {selectedItem && <EarningCalculatorModal item={selectedItem} />}

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

        <SortingModal
          id={SORTING_MODAL_ID}
          onChangeOption={onChangeSortOpt}
          onReset={onResetSort}
          optionSelection={sortSelection}
          options={sortingOptions}
        />
      </Layout.Base>
    </PageWrapper>

  );
}

const EarningManagement = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    display: 'flex',

    '.earning-management__container .ant-sw-list': {
      paddingLeft: 0,
      paddingRight: 0,
      display: 'flex',
      flexDirection: 'column',
      gap: token.padding
    },

    '.earning-filter-icon': {
      width: '12px',
      height: '12px'
    }
  });
});

export default EarningManagement;
