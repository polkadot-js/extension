// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _getAssetDecimals } from '@subwallet/extension-base/services/chain-service/utils';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/earning-service/constants';
import { isLendingPool, isLiquidPool } from '@subwallet/extension-base/services/earning-service/utils';
import { YieldPoolInfo, YieldPoolType } from '@subwallet/extension-base/types';
import { BN_ZERO } from '@subwallet/extension-base/utils';
import { EmptyList, FilterModal, Layout } from '@subwallet/extension-koni-ui/components';
import { EarningOptionItem } from '@subwallet/extension-koni-ui/components/Earning';
import { ASTAR_PORTAL_URL, DEFAULT_EARN_PARAMS, EARN_TRANSACTION } from '@subwallet/extension-koni-ui/constants';
import { HomeContext } from '@subwallet/extension-koni-ui/contexts/screen/HomeContext';
import { useFilterModal, useGroupYieldPosition, useHandleChainConnection, useSelector, useTranslation, useYieldGroupInfo } from '@subwallet/extension-koni-ui/hooks';
import { getBalanceValue } from '@subwallet/extension-koni-ui/hooks/screen/home/useAccountBalance';
import { ChainConnectionWrapper } from '@subwallet/extension-koni-ui/Popup/Home/Earning/shared/ChainConnectionWrapper';
import { EarningEntryView, EarningPoolsParam, ThemeProps, YieldGroupInfo } from '@subwallet/extension-koni-ui/types';
import { isAccountAll, isRelatedToAstar, openInNewTab } from '@subwallet/extension-koni-ui/utils';
import { Icon, ModalContext, SwList } from '@subwallet/react-ui';
import CN from 'classnames';
import { FadersHorizontal, Vault } from 'phosphor-react';
import React, { SyntheticEvent, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

type Props = ThemeProps & {
  hasEarningPositions: boolean;
  setEntryView: React.Dispatch<React.SetStateAction<EarningEntryView>>;
}

const groupOrdinal = (group: YieldGroupInfo): number => {
  if (group.group === 'DOT-Polkadot') {
    return 2;
  } else if (group.group === 'KSM-Kusama') {
    return 1;
  } else {
    return 0;
  }
};

const testnetOrdinal = (group: YieldGroupInfo): number => {
  return group.isTestnet ? 0 : 1;
};

const balanceOrdinal = (group: YieldGroupInfo): number => {
  return group.balance.value.toNumber();
};

const apyOrdinal = (group: YieldGroupInfo): number => {
  return !group.maxApy ? -1 : group.maxApy;
};

const connectChainModalId = 'earning-options-connect-chain-modal';
const chainConnectionLoadingModalId = 'earning-options-chain-connection-loading-modalId';
const alertModalId = 'earning-options-alert-modal';

const FILTER_MODAL_ID = 'earning-options-filter-modal';

enum FilterOptionType {
  MAIN_NETWORK = 'MAIN_NETWORK',
  TEST_NETWORK = 'TEST_NETWORK',
}

function Component ({ className, hasEarningPositions, setEntryView }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const data = useYieldGroupInfo();
  const { poolInfoMap } = useSelector((state) => state.earning);
  const assetRegistry = useSelector((state) => state.assetRegistry.assetRegistry);
  const chainInfoMap = useSelector((state) => state.chainStore.chainInfoMap);
  const { currentAccount } = useSelector((state) => state.accountState);
  const { accountBalance: { tokenBalanceMap } } = useContext(HomeContext);

  const isShowBalance = useSelector((state) => state.settings.isShowBalance);

  const [, setEarnStorage] = useLocalStorage(EARN_TRANSACTION, DEFAULT_EARN_PARAMS);
  const yieldPositions = useGroupYieldPosition();

  const [selectedPoolGroup, setSelectedPoolGroup] = React.useState<YieldGroupInfo | undefined>(undefined);

  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, selectedFilters } = useFilterModal(FILTER_MODAL_ID);

  const { activeModal } = useContext(ModalContext);

  const items = useMemo(() => {
    return [...data].sort((a, b) => {
      return (
        groupOrdinal(b) - groupOrdinal(a) ||
        testnetOrdinal(b) - testnetOrdinal(a) ||
        balanceOrdinal(b) - balanceOrdinal(a) ||
        apyOrdinal(b) - apyOrdinal(a)
      );
    });
  }, [data]);

  const filterOptions = useMemo(() => [
    { label: t('Mainnet'), value: FilterOptionType.MAIN_NETWORK },
    { label: t('Testnet'), value: FilterOptionType.TEST_NETWORK }
  ], [t]);

  const filterFunction = useMemo<(item: YieldGroupInfo) => boolean>(() => {
    return (item) => {
      if (!selectedFilters.length) {
        return true;
      }

      if (selectedFilters.length === filterOptions.length) {
        return true;
      }

      if (selectedFilters.length === 1) {
        if (selectedFilters.includes(FilterOptionType.MAIN_NETWORK)) {
          return !item.isTestnet;
        }

        if (selectedFilters.includes(FilterOptionType.TEST_NETWORK)) {
          return item.isTestnet;
        }
      }

      return false;
    };
  }, [filterOptions.length, selectedFilters]);

  const navigateToEarnTransaction = useCallback(
    (slug: string, chain: string) => {
      setEarnStorage({
        ...DEFAULT_EARN_PARAMS,
        slug,
        chain,
        from: currentAccount?.address ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : ''
      });
      navigate('/transaction/earn');
    },
    [currentAccount?.address, navigate, setEarnStorage]
  );

  const onConnectChainSuccess = useCallback(() => {
    if (selectedPoolGroup) {
      navigateToEarnTransaction(selectedPoolGroup.poolSlugs[0], selectedPoolGroup.chain);
    }
  }, [navigateToEarnTransaction, selectedPoolGroup]);

  const { alertProps,
    checkChainConnected,
    closeAlert,
    closeConnectChainModal,
    connectingChain,
    onConnectChain, openAlert,
    openConnectChainModal, setExtraSuccessFlag, turnOnChain } = useHandleChainConnection({
    alertModalId,
    chainConnectionLoadingModalId,
    connectChainModalId
  }, onConnectChainSuccess);

  const [currentAltChain, setCurrentAltChain] = useState<string | undefined>();

  const getAltChain = useCallback((poolInfo: YieldPoolInfo) => {
    if (isLiquidPool(poolInfo) || isLendingPool(poolInfo)) {
      const asset = assetRegistry[poolInfo.metadata.altInputAssets || ''];

      return asset ? asset.originChain : '';
    }

    return '';
  }, [assetRegistry]);

  const positionSlugs = useMemo(() => {
    return yieldPositions.map((p) => p.slug);
  }, [yieldPositions]);

  const onClickItem = useCallback((item: YieldGroupInfo) => {
    return () => {
      if (isRelatedToAstar(item.group)) {
        openAlert({
          title: t('Enter Astar portal'),
          content: t('Navigate to Astar portal to view and manage your stake in Astar dApp staking v3'),
          cancelButton: {
            text: t('Cancel'),
            schema: 'secondary',
            onClick: closeAlert
          },
          okButton: {
            text: t('Enter Astar portal'),
            onClick: () => {
              openInNewTab(ASTAR_PORTAL_URL)();
              closeAlert();
            }
          }
        });

        return;
      }

      setSelectedPoolGroup(item);

      const processPoolOptions = (poolInfo: YieldPoolInfo, item: YieldGroupInfo) => {
        if (!poolInfo) {
          // will not happen

          return;
        }

        const altChain = getAltChain(poolInfo);

        if (!checkChainConnected(item.chain)) {
          if (altChain) {
            setCurrentAltChain(altChain);
          }

          openConnectChainModal(item.chain);

          return;
        }

        if (altChain && !checkChainConnected(altChain)) {
          onConnectChain(altChain);

          return;
        }

        navigateToEarnTransaction(poolInfo.slug, item.chain);
      };

      if (item.poolListLength > 1) {
        let isHiddenPool = false;

        if (item.poolListLength === 2) {
          item.poolSlugs.forEach((poolSlug) => {
            const poolInfo = poolInfoMap[poolSlug];

            if (poolInfo.type === YieldPoolType.NATIVE_STAKING) {
              let minJoinPool: string;

              if (poolInfo.statistic && !positionSlugs.includes(poolSlug)) {
                minJoinPool = poolInfo.statistic.earningThreshold.join;
              } else {
                minJoinPool = '0';
              }

              let nativeSlug: string | undefined;

              const nativeAsset = poolInfo && poolInfo?.statistic?.assetEarning.find((item) => item.slug.toLowerCase().includes('native'));

              if (nativeAsset) {
                nativeSlug = nativeAsset.slug;
              }

              const assetInfo = nativeSlug && assetRegistry[nativeSlug];
              const minJoinPoolBalanceValue = (assetInfo && getBalanceValue(minJoinPool, _getAssetDecimals(assetInfo))) || BN_ZERO;

              const availableBalance = (nativeSlug && tokenBalanceMap[nativeSlug] && tokenBalanceMap[nativeSlug].free.value) || BN_ZERO;

              if (_STAKING_CHAIN_GROUP.relay.includes(poolInfo.chain) && minJoinPoolBalanceValue.isGreaterThan(availableBalance)) {
                isHiddenPool = true;
              }
            }
          });
        }

        if (isHiddenPool && item.poolListLength === 2) {
          const index = item.poolSlugs.findIndex((item) => item.includes(YieldPoolType.NOMINATION_POOL.toLowerCase()));

          const poolInfo = poolInfoMap[item.poolSlugs[index]];

          processPoolOptions(poolInfo, item);
        } else {
          navigate('/home/earning/pools', { state: {
            poolGroup: item.group,
            symbol: item.symbol
          } as EarningPoolsParam });
        }
      } else {
        const poolInfo = poolInfoMap[item.poolSlugs[0]];

        processPoolOptions(poolInfo, item);
      }
    };
  }, [assetRegistry, checkChainConnected, closeAlert, getAltChain, navigate, navigateToEarnTransaction, onConnectChain, openAlert, openConnectChainModal, poolInfoMap, positionSlugs, t, tokenBalanceMap]);

  const _onConnectChain = useCallback((chain: string) => {
    if (currentAltChain) {
      turnOnChain(currentAltChain);
    }

    onConnectChain(chain);
  }, [currentAltChain, onConnectChain, turnOnChain]);

  useEffect(() => {
    if (currentAltChain) {
      setExtraSuccessFlag(checkChainConnected(currentAltChain));
    } else {
      setExtraSuccessFlag(true);
    }
  }, [checkChainConnected, currentAltChain, setExtraSuccessFlag]);

  const renderItem = useCallback(
    (item: YieldGroupInfo) => {
      return (
        <EarningOptionItem
          chain={chainInfoMap[item.chain]}
          className={'earning-option-item'}
          isShowBalance={isShowBalance}
          key={item.group}
          onClick={onClickItem(item)}
          poolGroup={item}
        />
      );
    },
    [chainInfoMap, isShowBalance, onClickItem]
  );

  const emptyList = useCallback(() => {
    return (
      <EmptyList
        emptyMessage={t('No earning option found')}
        emptyTitle={t('Change your search and try again')}
        phosphorIcon={Vault}
      />
    );
  }, [t]);

  const onBack = useCallback(() => {
    setEntryView(EarningEntryView.POSITIONS);
  }, [setEntryView]);

  const searchFunction = useCallback(({ name, symbol }: YieldGroupInfo, searchText: string) => {
    return (
      name?.toLowerCase().includes(searchText.toLowerCase()) ||
      symbol?.toLowerCase().includes(searchText.toLowerCase())
    );
  }, []);

  const onClickFilterButton = useCallback(
    (e?: SyntheticEvent) => {
      e && e.stopPropagation();
      activeModal(FILTER_MODAL_ID);
    },
    [activeModal]
  );

  return (
    <ChainConnectionWrapper
      alertModalId={alertModalId}
      alertProps={alertProps}
      chainConnectionLoadingModalId={chainConnectionLoadingModalId}
      closeConnectChainModal={closeConnectChainModal}
      connectChainModalId={connectChainModalId}
      connectingChain={connectingChain}
      onConnectChain={_onConnectChain}
    >
      <Layout.Base
        className={CN(className)}
        onBack={onBack}
        showBackButton={hasEarningPositions}
        showSubHeader={true}
        subHeaderBackground={'transparent'}
        subHeaderCenter={false}
        subHeaderPaddingVertical={true}
        title={t<string>('Earning options')}
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

const EarningOptions = styled(Component)<Props>(({ theme: { token } }: Props) => ({
  '.ant-sw-sub-header-container': {
    marginBottom: token.marginXS
  },

  '.__section-list-container': {
    height: '100%',
    flex: 1
  },

  '.earning-option-item': {
    '+ .earning-option-item': {
      marginTop: token.marginXS
    }
  }
}));

export default EarningOptions;
