// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _getAssetDecimals } from '@subwallet/extension-base/services/chain-service/utils';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/earning-service/constants';
import { isLendingPool, isLiquidPool } from '@subwallet/extension-base/services/earning-service/utils';
import { YieldPoolInfo, YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/types';
import { BN_ZERO } from '@subwallet/extension-base/utils';
import { EarningInstructionModal, EarningOptionDesktopItem, EmptyList, FilterModal, Layout } from '@subwallet/extension-web-ui/components';
import { EarningOptionItem } from '@subwallet/extension-web-ui/components/Earning';
import { ASTAR_PORTAL_URL, DEFAULT_EARN_PARAMS, EARN_TRANSACTION, EARNING_INSTRUCTION_MODAL } from '@subwallet/extension-web-ui/constants';
import { HomeContext } from '@subwallet/extension-web-ui/contexts/screen/HomeContext';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { useFilterModal, useHandleChainConnection, useSelector, useTranslation, useYieldGroupInfo } from '@subwallet/extension-web-ui/hooks';
import { getBalanceValue } from '@subwallet/extension-web-ui/hooks/screen/home/useAccountBalance';
import { ChainConnectionWrapper } from '@subwallet/extension-web-ui/Popup/Home/Earning/shared/ChainConnectionWrapper';
import { Toolbar } from '@subwallet/extension-web-ui/Popup/Home/Earning/shared/desktop/Toolbar';
import { EarningEntryView, EarningPoolsParam, NetworkType, ThemeProps, YieldGroupInfo } from '@subwallet/extension-web-ui/types';
import { isAccountAll, isRelatedToAstar, openInNewTab } from '@subwallet/extension-web-ui/utils';
import { Icon, ModalContext, SwList } from '@subwallet/react-ui';
import CN from 'classnames';
import { FadersHorizontal, Vault } from 'phosphor-react';
import React, { SyntheticEvent, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

type Props = ThemeProps & {
  earningPositions: YieldPositionInfo[];
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

const instructionModalId = EARNING_INSTRUCTION_MODAL;

function Component ({ className, earningPositions, setEntryView }: Props) {
  const { t } = useTranslation();
  const { isWebUI } = useContext(ScreenContext);
  const navigate = useNavigate();

  const hasEarningPositions = !!earningPositions.length;

  const data = useYieldGroupInfo();
  const poolInfoMap = useSelector((state) => state.earning.poolInfoMap);
  const assetRegistry = useSelector((state) => state.assetRegistry.assetRegistry);
  const chainInfoMap = useSelector((state) => state.chainStore.chainInfoMap);
  const currentAccount = useSelector((state) => state.accountState.currentAccount);

  const isShowBalance = useSelector((state) => state.settings.isShowBalance);
  const { accountBalance: { tokenBalanceMap } } = useContext(HomeContext);

  const [, setEarnStorage] = useLocalStorage(EARN_TRANSACTION, DEFAULT_EARN_PARAMS);
  const [selectedPoolGroup, setSelectedPoolGroup] = React.useState<YieldGroupInfo | undefined>(undefined);
  const [searchInput, setSearchInput] = useState<string>('');
  const [poolSlug, setPoolSlug] = useState<string>('');

  const { filterSelectionMap, onApplyFilter, onChangeFilterOption, onCloseFilterModal, selectedFilters } = useFilterModal(FILTER_MODAL_ID);

  const { activeModal } = useContext(ModalContext);

  const positionSlugs = useMemo(() => {
    return earningPositions.map((p) => p.slug);
  }, [earningPositions]);

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
    { label: t('Mainnet'), value: NetworkType.MAIN_NETWORK },
    { label: t('Testnet'), value: NetworkType.TEST_NETWORK }
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
        if (selectedFilters.includes(NetworkType.MAIN_NETWORK)) {
          return !item.isTestnet;
        }

        if (selectedFilters.includes(NetworkType.TEST_NETWORK)) {
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
    if (selectedPoolGroup && selectedPoolGroup.poolSlugs[0]) {
      if (positionSlugs.includes(selectedPoolGroup.poolSlugs[0])) {
        navigateToEarnTransaction(selectedPoolGroup.poolSlugs[0], selectedPoolGroup.chain);
      } else {
        activeModal(instructionModalId);
      }
    }
  }, [activeModal, navigateToEarnTransaction, positionSlugs, selectedPoolGroup]);

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

  const onClickItem = useCallback((item: YieldGroupInfo) => {
    return () => {
      setCurrentAltChain(undefined);

      if (isRelatedToAstar(item.group)) {
        openAlert({
          title: t('Enter Astar portal'),
          content: t('You are navigating to Astar portal to view and manage your stake in Astar dApp staking v3. SubWallet will offer support for Astar dApp staking v3 soon.'),
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

        setPoolSlug(poolInfo.slug);

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

        if (positionSlugs.includes(poolInfo.slug)) {
          navigateToEarnTransaction(poolInfo.slug, item.chain);
        } else {
          activeModal(instructionModalId);
        }
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
          navigate('/home/earning/pools', {
            state: {
              poolGroup: item.group,
              symbol: item.symbol
            } as EarningPoolsParam
          });
        }
      } else {
        const poolInfo = poolInfoMap[item.poolSlugs[0]];

        processPoolOptions(poolInfo, item);
      }
    };
  }, [activeModal, assetRegistry, checkChainConnected, closeAlert, getAltChain, navigate, navigateToEarnTransaction, onConnectChain, openAlert, openConnectChainModal, poolInfoMap, positionSlugs, t, tokenBalanceMap]);

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
      if (isWebUI) {
        return (
          <EarningOptionDesktopItem
            chain={chainInfoMap[item.chain]}
            className={'earning-option-desktop-item'}
            isShowBalance={isShowBalance}
            key={item.group}
            onClick={onClickItem(item)}
            poolGroup={item}
          />
        );
      }

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
    [chainInfoMap, isShowBalance, isWebUI, onClickItem]
  );

  const emptyList = useCallback(() => {
    return (
      <EmptyList
        className={'__empty-list-earning-options'}
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
        {
          isWebUI
            ? (
              <>
                <Toolbar
                  className={'__desktop-toolbar'}
                  inputPlaceholder={t<string>('Search token')}
                  onClickFilter={onClickFilterButton}
                  onSearch={setSearchInput}
                  searchValue={searchInput}
                />
                <SwList
                  className={'__desktop-list-container'}
                  displayGrid={true}
                  filterBy={filterFunction}
                  gridGap={'16px'}
                  list={items}
                  minColumnWidth={'360px'}
                  renderItem={renderItem}
                  renderWhenEmpty={emptyList}
                  searchBy={searchFunction}
                  searchMinCharactersCount={1}
                  searchTerm={searchInput}
                />
              </>
            )
            : (
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
                searchMinCharactersCount={1}
                searchPlaceholder={t<string>('Search token')}
                showActionBtn
              />
            )
        }

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

      {
        selectedPoolGroup && selectedPoolGroup.poolSlugs.length && (
          <EarningInstructionModal
            address={currentAccount?.address}
            assetRegistry={assetRegistry}
            closeAlert={closeAlert}
            isShowStakeMoreButton={true}
            onStakeMore={navigateToEarnTransaction}
            openAlert={openAlert}
            poolInfo={poolInfoMap[poolSlug]}
          />
        )
      }
    </ChainConnectionWrapper>
  );
}

const EarningOptions = styled(Component)<Props>(({ theme: { token } }: Props) => ({

  '.ant-sw-sub-header-container': {
    marginBottom: token.marginXS
  },

  '.__empty-list-earning-options': {
    height: '100%',
    marginBottom: 0,
    marginTop: 0
  },

  '.__desktop-list-container': {
    overflowY: 'auto',
    height: '100%',
    gridTemplateRows: 'min-content'
  },

  '.__section-list-container': {
    height: '100%',
    flex: 1
  },

  '.earning-option-item': {
    '+ .earning-option-item': {
      marginTop: token.marginXS
    }
  },

  // desktop

  '.__desktop-toolbar': {
    marginBottom: 20
  },

  '@media (min-width: 992px)': {
    '.__empty-list-earning-options': {
      paddingBottom: 62,
      paddingTop: 32
    }
  }

}));

export default EarningOptions;
