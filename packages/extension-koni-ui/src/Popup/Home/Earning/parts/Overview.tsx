// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolInfo, YieldPoolType } from '@subwallet/extension-base/background/KoniTypes';
import { _getSubstrateGenesisHash } from '@subwallet/extension-base/services/chain-service/utils';
import { EarningCalculatorModal, EarningItem, EarningToolbar, EmptyList } from '@subwallet/extension-koni-ui/components';
import EarningInfoModal from '@subwallet/extension-koni-ui/components/Modal/Earning/EarningInfoModal';
import { CREATE_RETURN, DEFAULT_ROUTER_PATH, DEFAULT_YIELD_PARAMS, EARNING_INFO_MODAL, STAKING_CALCULATOR_MODAL, YIELD_TRANSACTION } from '@subwallet/extension-koni-ui/constants';
import { useFilterModal, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isAccountAll } from '@subwallet/extension-koni-ui/utils';
import { ModalContext, SwList } from '@subwallet/react-ui';
import CN from 'classnames';
import { Vault } from 'phosphor-react';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

import { isEthereumAddress } from '@polkadot/util-crypto';

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
  const { currentAccount, isNoAccount } = useSelector((state: RootState) => state.accountState);
  const { chainInfoMap, chainStateMap } = useSelector((state: RootState) => state.chainStore);

  const { activeModal } = useContext(ModalContext);

  const [selectedItem, setSelectedItem] = useState<YieldPoolInfo | undefined>(undefined);
  const [sortSelection, setSortSelection] = useState<SortKey>(SortKey.TOTAL_VALUE);
  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, selectedFilters } = useFilterModal(FILTER_MODAL_ID);
  const [, setYieldStorage] = useLocalStorage(YIELD_TRANSACTION, DEFAULT_YIELD_PARAMS);
  const [, setReturnStorage] = useLocalStorage(CREATE_RETURN, DEFAULT_ROUTER_PATH);

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

  const onClickInfoBtn = useCallback((item: YieldPoolInfo) => {
    return () => {
      setSelectedItem(item);
      activeModal(EARNING_INFO_MODAL);
    };
  }, [activeModal]);

  const onClickStakeBtn = useCallback((item: YieldPoolInfo) => {
    return () => {
      if (isNoAccount) {
        setReturnStorage('/home/earning/');
        navigate('/welcome');
      } else {
        setSelectedItem(item);
        const address = currentAccount ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : '';

        setYieldStorage({
          ...DEFAULT_YIELD_PARAMS,
          method: item.slug,
          from: address,
          chain: item.chain,
          asset: item.inputAssets[0]
        });

        navigate('/transaction/earn');
      }
    };
  }, [currentAccount, isNoAccount, navigate, setReturnStorage, setYieldStorage]);

  const renderEarningItem = useCallback((item: YieldPoolInfo) => {
    return (
      <EarningItem
        item={item}
        key={item.slug}
        onClickCalculatorBtn={onClickCalculatorBtn(item)}
        onClickInfoBtn={onClickInfoBtn(item)}
        onClickStakeBtn={onClickStakeBtn(item)}
      />
    );
  }, [onClickCalculatorBtn, onClickInfoBtn, onClickStakeBtn]);

  const resultList = useMemo((): YieldPoolInfo[] => {
    return [...Object.values(poolInfo)]
      .filter((value) => {
        if (!chainStateMap[value.chain].active) {
          return false;
        }

        if (!currentAccount) {
          return true;
        }

        const availableGen: string[] = currentAccount.availableGenesisHashes || [];
        const isEvmAddress = isEthereumAddress(currentAccount.address);

        if (currentAccount?.isHardware) {
          if (isEvmAddress) {
            return false;
          } else {
            const chain = chainInfoMap[value.chain];

            if (chain && !availableGen.includes(_getSubstrateGenesisHash(chain))) {
              return false;
            }
          }
        }

        return true;
      })
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
  }, [chainInfoMap, chainStateMap, currentAccount, poolInfo, sortSelection]);

  const renderWhenEmpty = useCallback(() => {
    return (
      <EmptyList
        emptyMessage={t('Need message')}
        emptyTitle={t('Need message')}
        phosphorIcon={Vault}
      />
    );
  }, [t]);

  return (
    <div className={className}>
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
      {selectedItem && <EarningInfoModal defaultItem={selectedItem} />}
    </div>
  );
};

const EarningOverviewContent = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    '.ant-sw-list-wrapper': {
      marginLeft: -token.margin,
      marginRight: -token.margin,
      flexBasis: 'auto'
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

export default EarningOverviewContent;
