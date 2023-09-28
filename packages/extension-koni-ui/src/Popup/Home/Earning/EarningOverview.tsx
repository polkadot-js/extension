// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolInfo, YieldPoolType } from '@subwallet/extension-base/background/KoniTypes';
import { EarningCalculatorModal, EarningItem, EarningToolbar, EmptyList, Layout } from '@subwallet/extension-koni-ui/components';
import { DEFAULT_YIELD_PARAMS, STAKING_CALCULATOR_MODAL, YIELD_TRANSACTION } from '@subwallet/extension-koni-ui/constants';
import { HeaderType, WebUIContext } from '@subwallet/extension-koni-ui/contexts/WebUIContext';
import { useFilterModal, useGetYieldPositions, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isAccountAll } from '@subwallet/extension-koni-ui/utils';
import { ModalContext, SwList } from '@subwallet/react-ui';
import CN from 'classnames';
import { Vault } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

type Props = ThemeProps;

const FILTER_MODAL_ID = 'earning-filter-modal';

enum SortKey {
  TOTAL_VALUE = 'total-value',
}

const Component: React.FC<Props> = (props: Props) => {
  const { className } = props;

  const { t } = useTranslation();
  const navigate = useNavigate();

  const { poolInfo } = useSelector((state: RootState) => state.yieldPool);
  const { currentAccount } = useSelector((state: RootState) => state.accountState);

  const { activeModal } = useContext(ModalContext);
  const { setHeaderType } = useContext(WebUIContext);

  const [selectedItem, setSelectedItem] = useState<YieldPoolInfo | undefined>(undefined);
  const [sortSelection, setSortSelection] = useState<SortKey>(SortKey.TOTAL_VALUE);
  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, selectedFilters } = useFilterModal(FILTER_MODAL_ID);
  const [, setStorage] = useLocalStorage(YIELD_TRANSACTION, DEFAULT_YIELD_PARAMS);
  const yieldPositions = useGetYieldPositions();

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
    return () => {
      setSelectedItem(item);
      activeModal(STAKING_CALCULATOR_MODAL);
    };
  }, [activeModal]);

  const onClickStakeBtn = useCallback((item: YieldPoolInfo) => {
    return () => {
      setSelectedItem(item);
      const address = currentAccount ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : '';

      setStorage({
        ...DEFAULT_YIELD_PARAMS,
        method: item.slug,
        from: address,
        chain: item.chain,
        asset: item.inputAssets[0]
      });

      navigate('/transaction/earn');
    };
  }, [currentAccount, navigate, setStorage]);

  const renderEarningItem = useCallback((item: YieldPoolInfo) => {
    return (
      <EarningItem
        item={item}
        key={item.slug}
        onClickCalculatorBtn={onClickCalculatorBtn(item)}
        onClickStakeBtn={onClickStakeBtn(item)}
      />
    );
  }, [onClickCalculatorBtn, onClickStakeBtn]);

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

  const renderWhenEmpty = useCallback(() => {
    return (
      <EmptyList
        emptyMessage={t('Need message')}
        emptyTitle={t('Need message')}
        phosphorIcon={Vault}
      />
    );
  }, [t]);

  const onBack = useCallback(() => {
    navigate('/home/earning/detail');
  }, [navigate]);

  useEffect(() => {
    if (yieldPositions.length) {
      setHeaderType(HeaderType.COMMON_BACK);
    }
  }, [setHeaderType, yieldPositions.length]);

  return (
    <Layout.Base
      className={className}
      onBack={onBack}
      showSubHeader={true}
      subHeaderBackground={'transparent'}
      subHeaderCenter={false}
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
        className={CN('nft_collection_list__container')}
        displayGrid={true}
        enableSearchInput={false}
        filterBy={filterFunction}
        gridGap={'14px'}
        list={resultList}
        minColumnWidth={'384px'}
        renderItem={renderEarningItem}
        renderOnScroll={true}
        renderWhenEmpty={renderWhenEmpty}
        searchMinCharactersCount={2}
      />

      {selectedItem && <EarningCalculatorModal defaultItem={selectedItem} />}
    </Layout.Base>
  );
};

const EarningOverview = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    display: 'flex',

    '.ant-sw-list-wrapper': {
      marginLeft: -token.margin,
      marginRight: -token.margin
    },

    '.earning-filter-icon': {
      width: '12px',
      height: '12px'
    },

    '.earning-wrapper': {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingBottom: token.padding
    }
  });
});

export default EarningOverview;
