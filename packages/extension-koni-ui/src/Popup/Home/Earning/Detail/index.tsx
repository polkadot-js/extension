// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolInfo, YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/background/KoniTypes';
import { EarningCalculatorModal, HorizontalEarningItem, Layout } from '@subwallet/extension-koni-ui/components';
import { EARNING_MANAGEMENT_DETAIL_MODAL, STAKING_CALCULATOR_MODAL } from '@subwallet/extension-koni-ui/constants';
import { useFilterModal, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ModalContext, SwList } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import EarningToolbar from '../Overview/EarningToolBar';
import EarningManagementDetailModal from './EarningManagementDetailModal';

type Props = ThemeProps;

const FILTER_MODAL_ID = 'earning-filter-modal';

enum SortKey {
  TOTAL_VALUE = 'total-value',
}

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;
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
    return () => {
      const poolInfo = poolInfoMap[item.slug];

      setSelectedItem({ selectedYieldPosition: item, selectedYieldPoolInfo: poolInfo });
      activeModal(STAKING_CALCULATOR_MODAL);
    };
  }, [activeModal, poolInfoMap]);

  const onClickStakeBtn = useCallback((item: YieldPositionInfo) => {
    return () => {
      const poolInfo = poolInfoMap[item.slug];

      setSelectedItem({ selectedYieldPosition: item, selectedYieldPoolInfo: poolInfo });
      navigate(`/transaction/earn/${item.slug}`);
    };
  }, [navigate, poolInfoMap]);

  const onClickItem = useCallback((item: YieldPositionInfo) => {
    return () => {
      const poolInfo = poolInfoMap[item.slug];

      setSelectedItem({ selectedYieldPosition: item, selectedYieldPoolInfo: poolInfo });
      activeModal(EARNING_MANAGEMENT_DETAIL_MODAL);
    };
  }, [activeModal, poolInfoMap]);

  const renderEarningItem = useCallback((item: YieldPositionInfo) => {
    const poolInfo = poolInfoMap[item.slug];

    return (
      <HorizontalEarningItem
        key={item.slug}
        onClickCalculatorBtn={onClickCalculatorBtn(item)}
        onClickItem={onClickItem(item)}
        onClickStakeBtn={onClickStakeBtn(item)}
        yieldPoolInfo={poolInfo}
        yieldPositionInfo={item}
      />
    );
  }, [onClickCalculatorBtn, onClickItem, onClickStakeBtn, poolInfoMap]);

  const resultList = useMemo((): YieldPositionInfo[] => {
    return [...yieldPositionList]
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
  }, [yieldPositionList, poolInfoMap, sortSelection]);

  return (
    <Layout.Base
      className={className}
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
        showAdd={true}
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

      {selectedYieldPoolInfo && <EarningCalculatorModal defaultItem={selectedYieldPoolInfo} />}

      {
        selectedYieldPosition && selectedYieldPoolInfo && (
          <EarningManagementDetailModal
            yieldPoolInfo={selectedYieldPoolInfo}
            yieldPositionMetadata={selectedYieldPosition.metadata}
          />
        )
      }
    </Layout.Base>
  );
};

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
