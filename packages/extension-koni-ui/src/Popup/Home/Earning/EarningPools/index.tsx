// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolInfo, YieldPoolType } from '@subwallet/extension-base/types';
import { EmptyList, FilterModal, Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import { EarningPoolItem } from '@subwallet/extension-koni-ui/components/Earning';
import { DEFAULT_EARN_PARAMS, EARN_TRANSACTION } from '@subwallet/extension-koni-ui/constants';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { useFilterModal, useHandleChainConnection, useSelector, useTranslation, useYieldPoolInfoByGroup } from '@subwallet/extension-koni-ui/hooks';
import { ChainConnectionWrapper } from '@subwallet/extension-koni-ui/Popup/Home/Earning/shared/ChainConnectionWrapper';
import { EarningEntryParam, EarningEntryView, EarningPoolsParam, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isAccountAll } from '@subwallet/extension-koni-ui/utils';
import { Icon, ModalContext, SwList } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { Database, FadersHorizontal } from 'phosphor-react';
import React, { SyntheticEvent, useCallback, useContext, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

type Props = ThemeProps;
type ComponentProps = {
  poolGroup: string,
  symbol: string,
};

const connectChainModalId = 'earning-pools-connect-chain-modal';
const chainConnectionLoadingModalId = 'earning-pools-chain-connection-loading-modalId';
const alertModalId = 'earning-pools-alert-modal';

const FILTER_MODAL_ID = 'earning-pool-filter-modal';

function Component ({ poolGroup, symbol }: ComponentProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const pools = useYieldPoolInfoByGroup(poolGroup);

  const chainInfoMap = useSelector((state) => state.chainStore.chainInfoMap);
  const { currentAccount } = useSelector((state) => state.accountState);

  const [, setEarnStorage] = useLocalStorage(EARN_TRANSACTION, DEFAULT_EARN_PARAMS);

  const [selectedPool, setSelectedPool] = React.useState<YieldPoolInfo | undefined>(undefined);

  const { activeModal } = useContext(ModalContext);

  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, selectedFilters } = useFilterModal(FILTER_MODAL_ID);

  const filterOptions = [
    { label: t('Nomination pool'), value: YieldPoolType.NOMINATION_POOL },
    { label: t('Direct nomination'), value: YieldPoolType.NATIVE_STAKING },
    { label: t('Liquid staking'), value: YieldPoolType.LIQUID_STAKING },
    { label: t('Lending'), value: YieldPoolType.LENDING },
    { label: t('Parachain staking'), value: YieldPoolType.PARACHAIN_STAKING },
    { label: t('Single farming'), value: YieldPoolType.SINGLE_FARMING }
  ];
  const items: YieldPoolInfo[] = useMemo(() => {
    if (!pools.length) {
      return [];
    }

    const result = [...pools];

    result.sort((a, b) => {
      const getType = (pool: YieldPoolInfo) => {
        if (pool.type === YieldPoolType.NOMINATION_POOL) {
          return 1;
        } else {
          return -1;
        }
      };

      const getTotal = (pool: YieldPoolInfo) => {
        const tvl = pool.statistic?.tvl;

        return tvl ? new BigN(tvl).toNumber() : -1;
      };

      return getTotal(b) - getTotal(a) || getType(b) - getType(a);
    });

    return result;
  }, [pools]);

  const filterFunction = useMemo<(item: YieldPoolInfo) => boolean>(() => {
    return (item) => {
      if (!selectedFilters.length) {
        return true;
      }

      for (const filter of selectedFilters) {
        if (filter === '') {
          return true;
        }

        if (filter === YieldPoolType.NOMINATION_POOL && item.type === YieldPoolType.NOMINATION_POOL) {
          return true;
        } else if (filter === YieldPoolType.NATIVE_STAKING && item.type === YieldPoolType.NATIVE_STAKING) {
          return true;
        } else if (filter === YieldPoolType.LIQUID_STAKING && item.type === YieldPoolType.LIQUID_STAKING) {
          return true;
        } else if (filter === YieldPoolType.LENDING && item.type === YieldPoolType.LENDING) {
          return true;
        }
        // Uncomment the following code block if needed
        // else if (filter === YieldPoolType.PARACHAIN_STAKING && item.type === YieldPoolType.PARACHAIN_STAKING) {
        //   return true;
        // } else if (filter === YieldPoolType.SINGLE_FARMING && item.type === YieldPoolType.SINGLE_FARMING) {
        //   return true;
        // }
      }

      return false;
    };
  }, [selectedFilters]);

  const navigateToEarnTransaction = useCallback(
    (item: YieldPoolInfo) => {
      setEarnStorage({
        ...DEFAULT_EARN_PARAMS,
        slug: item.slug,
        chain: item.chain,
        from: currentAccount?.address ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : ''
      });
      navigate('/transaction/earn');
    },
    [currentAccount?.address, navigate, setEarnStorage]
  );

  const onConnectChainSuccess = useCallback(() => {
    if (selectedPool) {
      navigateToEarnTransaction(selectedPool);
    }
  }, [navigateToEarnTransaction, selectedPool]);

  const { alertProps,
    checkChainConnected,
    closeConnectChainModal,
    connectingChain,
    onConnectChain,
    openConnectChainModal } = useHandleChainConnection({
    alertModalId,
    chainConnectionLoadingModalId,
    connectChainModalId
  }, onConnectChainSuccess);

  const onClickItem = useCallback((item: YieldPoolInfo) => {
    return () => {
      setSelectedPool(item);

      if (!checkChainConnected(item.chain)) {
        openConnectChainModal(item.chain);
      } else {
        navigateToEarnTransaction(item);
      }
    };
  }, [checkChainConnected, navigateToEarnTransaction, openConnectChainModal]);

  const renderItem = useCallback(
    (item: YieldPoolInfo) => {
      return (
        <EarningPoolItem
          className={'earning-pool-item'}
          key={item.slug}
          onClick={onClickItem(item)}
          poolInfo={item}
        />
      );
    },
    [onClickItem]
  );

  const emptyList = useCallback(() => {
    return (
      <EmptyList
        emptyMessage={t('Change your search and try again')}
        emptyTitle={t('No earning option found')}
        phosphorIcon={Database}
      />
    );
  }, [t]);

  const searchFunction = useCallback(
    ({ chain, metadata: { shortName } }: YieldPoolInfo, searchText: string) => {
      const chainInfo = chainInfoMap[chain];

      return (
        chainInfo?.name.replace(' Relay Chain', '').toLowerCase().includes(searchText.toLowerCase()) ||
        shortName.toLowerCase().includes(searchText.toLowerCase())
      );
    },
    [chainInfoMap]
  );
  const onClickFilterButton = useCallback(
    (e?: SyntheticEvent) => {
      e && e.stopPropagation();
      activeModal(FILTER_MODAL_ID);
    },
    [activeModal]
  );

  const onBack = useCallback(() => {
    navigate('/home/earning', { state: {
      view: EarningEntryView.OPTIONS
    } as EarningEntryParam });
  }, [navigate]);

  return (
    <ChainConnectionWrapper
      alertModalId={alertModalId}
      alertProps={alertProps}
      chainConnectionLoadingModalId={chainConnectionLoadingModalId}
      closeConnectChainModal={closeConnectChainModal}
      connectChainModalId={connectChainModalId}
      connectingChain={connectingChain}
      onConnectChain={onConnectChain}
    >
      <Layout.Base
        className={'__screen-container'}
        onBack={onBack}
        showBackButton={true}
        showSubHeader={true}
        subHeaderBackground={'transparent'}
        subHeaderCenter={false}
        subHeaderPaddingVertical={true}
        title={t<string>('{{symbol}} earning options', { replace: { symbol: symbol } })}
      >
        <SwList.Section
          actionBtnIcon={<Icon phosphorIcon={FadersHorizontal} />}
          className={'__section-list-container'}
          enableSearchInput
          filterBy={filterFunction}
          list={items}
          onClickActionBtn={onClickFilterButton}
          renderItem={renderItem}
          renderWhenEmpty={emptyList}
          searchFunction={searchFunction}
          searchMinCharactersCount={2}
          searchPlaceholder={t<string>('Search token')}
          showActionBtn
        />
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
      </Layout.Base>
    </ChainConnectionWrapper>
  );
}

const ComponentGate = () => {
  const locationState = useLocation().state as EarningPoolsParam;

  if (!locationState?.poolGroup || !locationState?.symbol) {
    // todo: will handle this with useEffect
    return (
      <div style={{
        display: 'flex',
        height: '100%',
        alignItems: 'center',
        justifyContent: 'center'
      }}
      >
        Missing param
      </div>
    );
  }

  return (
    <Component
      poolGroup={locationState.poolGroup}
      symbol={locationState.symbol}
    />
  );
};

const Wrapper = ({ className }: Props) => {
  const dataContext = useContext(DataContext);

  return (
    <PageWrapper
      className={CN(className)}
      resolve={dataContext.awaitStores(['earning', 'price'])}
    >
      <ComponentGate />
    </PageWrapper>
  );
};

const EarningPools = styled(Wrapper)<Props>(({ theme: { token } }: Props) => ({
  '.__section-list-container': {
    height: '100%',
    flex: 1
  },

  '.earning-pool-item': {
    '+ .earning-pool-item': {
      marginTop: token.marginXS
    }
  }
}));

export default EarningPools;
