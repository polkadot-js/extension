// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolInfo, YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/background/KoniTypes';
import { Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import HorizontalEarningItem from '@subwallet/extension-koni-ui/components/HorizontalEarningItem';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { useFilterModal, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import EarningCalculatorModal, { STAKING_CALCULATOR_MODAL_ID } from '@subwallet/extension-koni-ui/Popup/Home/Earning/EarningCalculatorModal';
import EarningManagementDetailModal, { EARNING_MANAGEMENT_DETAIL_MODAL_ID } from '@subwallet/extension-koni-ui/Popup/Home/Earning/EarningManagementDetailModal';
import EarningToolbar from '@subwallet/extension-koni-ui/Popup/Home/Earning/EarningToolBar';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ModalContext, SwList } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps;

const FILTER_MODAL_ID = 'earning-filter-modal';

enum SortKey {
  TOTAL_VALUE = 'total-value',
}

const Component = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { poolInfo: poolInfoMap, yieldPosition: yieldPositionList } = useSelector((state: RootState) => state.yieldPool);
  const { activeModal } = useContext(ModalContext);
  const [{ selectedYieldPoolInfo, selectedYieldPosition }, setSelectedItem] = useState<{ selectedYieldPosition: YieldPositionInfo | undefined, selectedYieldPoolInfo: YieldPoolInfo | undefined }>({ selectedYieldPosition: undefined, selectedYieldPoolInfo: undefined });
  const [sortSelection, setSortSelection] = useState<SortKey>(SortKey.TOTAL_VALUE);
  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, selectedFilters } = useFilterModal(FILTER_MODAL_ID);

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

  const onClickCalculatorBtn = useCallback((item: YieldPositionInfo) => {
    const poolInfo = poolInfoMap[item.slug];

    setSelectedItem({ selectedYieldPosition: item, selectedYieldPoolInfo: poolInfo });
    activeModal(STAKING_CALCULATOR_MODAL_ID);
  }, [activeModal]);

  const onClickStakeBtn = useCallback((item: YieldPositionInfo) => {
    const poolInfo = poolInfoMap[item.slug];

    setSelectedItem({ selectedYieldPosition: item, selectedYieldPoolInfo: poolInfo });
    navigate(`/transaction/earn/${item.slug}`);
  }, [navigate]);

  const onClickItem = useCallback((item: YieldPositionInfo) => {
    const poolInfo = poolInfoMap[item.slug];

    setSelectedItem({ selectedYieldPosition: item, selectedYieldPoolInfo: poolInfo });
    activeModal(EARNING_MANAGEMENT_DETAIL_MODAL_ID);
  }, [activeModal]);

  const renderEarningItem = useCallback((item: YieldPositionInfo) => {
    const poolInfo = poolInfoMap[item.slug];

    return (
      <HorizontalEarningItem
        key={item.slug}
        onClickCalculatorBtn={() => onClickCalculatorBtn(item)}
        onClickItem={() => onClickItem(item)}
        onClickStakeBtn={() => onClickStakeBtn(item)}
        yieldPoolInfo={poolInfo}
        yieldPositionInfo={item}
      />
    );
  }, [onClickCalculatorBtn, onClickStakeBtn, poolInfoMap]);

  const resultList = useMemo((): YieldPositionInfo[] => {
    return yieldPositionList
      .sort((a: YieldPositionInfo, b: YieldPositionInfo) => {
        const aPoolInfo = poolInfoMap[a.slug];
        const bPoolInfo = poolInfoMap[b.slug];

        switch (sortSelection) {
          case SortKey.TOTAL_VALUE:
            if (aPoolInfo.stats && bPoolInfo.stats && aPoolInfo.stats.tvl && bPoolInfo.stats.tvl) {
              return parseFloat(aPoolInfo.stats.tvl) - parseFloat(bPoolInfo.stats.tvl);
            } else {
              return 0;
            }

          default:
            return 0;
        }
      });
  }, [yieldPositionList, sortSelection]);

  return (
    <Layout.Base
      showSubHeader={true}
      subHeaderBackground={'transparent'}
      subHeaderCenter={false}
      // subHeaderIcons={subHeaderButton}
      subHeaderPaddingVertical={true}
      title={t('Earning')}
    >
      <EarningToolbar
        filterSelectionMap={filterSelectionMap}
        onApplyFilter={onApplyFilter}
        onChangeFilterOption={onChangeFilterOption}
        onChangeSortOpt={onChangeSortOpt}
        onCloseFilterModal={onCloseFilterModal}
        onResetSort={onResetSort}
        selectedFilters={selectedFilters}
      />
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

      {selectedYieldPoolInfo && <EarningCalculatorModal item={selectedYieldPoolInfo} />}

      {selectedYieldPosition && selectedYieldPoolInfo && <EarningManagementDetailModal
        yieldPoolInfo={selectedYieldPoolInfo}
        yieldPositionMetadata={selectedYieldPosition.metadata}
                                                         />}
    </Layout.Base>
  );
};

const Wrapper: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const dataContext = useContext(DataContext);

  return (
    <PageWrapper
      className={CN(className, 'page-wrapper')}
      resolve={dataContext.awaitStores(['yieldPool', 'price', 'chainStore', 'assetRegistry'])}
    >
      <Component />
    </PageWrapper>
  );
};

const EarningManagement = styled(Wrapper)<Props>(({ theme: { token } }: Props) => {
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
