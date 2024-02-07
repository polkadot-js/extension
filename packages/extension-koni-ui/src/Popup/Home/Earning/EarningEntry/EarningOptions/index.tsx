// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { isLendingPool, isLiquidPool } from '@subwallet/extension-base/services/earning-service/utils';
import { YieldPoolInfo } from '@subwallet/extension-base/types';
import { EmptyList, FilterModal, Layout } from '@subwallet/extension-koni-ui/components';
import { EarningOptionItem } from '@subwallet/extension-koni-ui/components/Earning';
import { ASTAR_PORTAL_URL, DEFAULT_EARN_PARAMS, EARN_TRANSACTION } from '@subwallet/extension-koni-ui/constants';
import { useFilterModal, useHandleChainConnection, useSelector, useTranslation, useYieldGroupInfo } from '@subwallet/extension-koni-ui/hooks';
import { ChainConnectionWrapper } from '@subwallet/extension-koni-ui/Popup/Home/Earning/shared/ChainConnectionWrapper';
import { EarningEntryView, EarningPoolsParam, ThemeProps, YieldGroupInfo } from '@subwallet/extension-koni-ui/types';
import { isAccountAll, isRelatedToAstar, openInNewTab } from '@subwallet/extension-koni-ui/utils';
import { Icon, ModalContext, SwList } from '@subwallet/react-ui';
import CN from 'classnames';
import { Database, FadersHorizontal } from 'phosphor-react';
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

  const isShowBalance = useSelector((state) => state.settings.isShowBalance);

  const [, setEarnStorage] = useLocalStorage(EARN_TRANSACTION, DEFAULT_EARN_PARAMS);

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

  const filterFunction = useMemo<(item: YieldGroupInfo) => boolean>(() => {
    return (item) => {
      if (!selectedFilters.length) {
        return true;
      }

      for (const filter of selectedFilters) {
        if (filter === '') {
          return true;
        }

        if (filter === FilterOptionType.MAIN_NETWORK) {
          return !item.isTestnet;
        } else if (filter === FilterOptionType.TEST_NETWORK) {
          return item.isTestnet;
        }
      }

      return false;
    };
  }, [selectedFilters]);

  const navigateToEarnTransaction = useCallback(
    (item: YieldGroupInfo) => {
      const slug = Object.values(poolInfoMap).find(
        (i) => i.group === item.group && i.chain === item.chain
      )?.slug || '';

      setEarnStorage({
        ...DEFAULT_EARN_PARAMS,
        slug,
        chain: item.chain,
        from: currentAccount?.address ? isAccountAll(currentAccount.address) ? '' : currentAccount.address : ''
      });
      navigate('/transaction/earn');
    },
    [currentAccount?.address, navigate, poolInfoMap, setEarnStorage]
  );

  const filterOptions = useMemo(() => [
    { label: t('Mainnet'), value: FilterOptionType.MAIN_NETWORK },
    { label: t('Testnet'), value: FilterOptionType.TEST_NETWORK }
  ], [t]);

  const onConnectChainSuccess = useCallback(() => {
    if (selectedPoolGroup) {
      navigateToEarnTransaction(selectedPoolGroup);
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

  const onClickItem = useCallback((item: YieldGroupInfo) => {
    return () => {
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

      if (item.poolListLength > 1) {
        navigate('/home/earning/pools', { state: {
          poolGroup: item.group,
          symbol: item.symbol
        } as EarningPoolsParam });
      } else if (item.poolListLength === 1) {
        const poolInfo = poolInfoMap[item.poolSlugs[0]];

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

        navigateToEarnTransaction(item);
      }
    };
  }, [checkChainConnected, closeAlert, getAltChain, navigate, navigateToEarnTransaction, openAlert, openConnectChainModal, poolInfoMap, t]);

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
        phosphorIcon={Database}
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
