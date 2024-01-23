// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolInfo, YieldPoolType } from '@subwallet/extension-base/types';
import { AlertModal, ConnectChainModal, EmptyList, Layout, LoadingModal, PageWrapper } from '@subwallet/extension-koni-ui/components';
import { EarningPoolItem } from '@subwallet/extension-koni-ui/components/Earning';
import { DEFAULT_EARN_PARAMS, EARN_TRANSACTION } from '@subwallet/extension-koni-ui/constants';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { useAlert, useChainConnection, useSelector, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { useYieldPoolInfoByGroup } from '@subwallet/extension-koni-ui/hooks/earning';
import { EarningEntryParam, EarningEntryView, EarningPoolsParam, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isAccountAll } from '@subwallet/extension-koni-ui/utils';
import { ModalContext, SwList } from '@subwallet/react-ui';
import BigN from 'bignumber.js';
import CN from 'classnames';
import { Database } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
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

function Component ({ poolGroup, symbol }: ComponentProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeModal, inactiveModal } = useContext(ModalContext);

  const pools = useYieldPoolInfoByGroup(poolGroup);

  const chainInfoMap = useSelector((state) => state.chainStore.chainInfoMap);
  const { currentAccount } = useSelector((state) => state.accountState);

  const [, setEarnStorage] = useLocalStorage(EARN_TRANSACTION, DEFAULT_EARN_PARAMS);

  // check chain connection
  const { checkChainConnected, turnOnChain } = useChainConnection();
  const [connectingChain, setConnectingChain] = useState<string| undefined>();
  const [isLoadingChainConnection, setIsLoadingChainConnection] = useState<boolean>(false);
  const [isConnectingChainSuccess, setIsConnectingChainSuccess] = useState<boolean>(false);
  const [selectedPool, setSelectedPool] = React.useState<YieldPoolInfo | undefined>(undefined);
  const { alertProps, closeAlert, openAlert } = useAlert(alertModalId);

  const openConnectChainModal = useCallback((chain: string) => {
    setConnectingChain(chain);
    activeModal(connectChainModalId);
  }, [activeModal]);

  const closeConnectChainModal = useCallback(() => {
    inactiveModal(connectChainModalId);
  }, [inactiveModal]);

  const openLoadingModal = useCallback(() => {
    activeModal(chainConnectionLoadingModalId);
  }, [activeModal]);

  const closeLoadingModal = useCallback(() => {
    inactiveModal(chainConnectionLoadingModalId);
  }, [inactiveModal]);

  const onConnectChain = useCallback((chain: string) => {
    turnOnChain(chain);
    setIsLoadingChainConnection(true);
    closeConnectChainModal();
    openLoadingModal();
  }, [closeConnectChainModal, openLoadingModal, turnOnChain]);

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
          chain={chainInfoMap[item.chain]}
          className={'earning-pool-item'}
          key={item.slug}
          onClick={onClickItem(item)}
          poolInfo={item}
        />
      );
    },
    [chainInfoMap, onClickItem]
  );

  const emptyList = useCallback(() => {
    return (
      <EmptyList
        emptyMessage={t('You can stake in-app easily')}
        emptyTitle={t('No staking found')}
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

  const onBack = useCallback(() => {
    navigate('/home/earning', { state: {
      view: EarningEntryView.OPTIONS
    } as EarningEntryParam });
  }, [navigate]);

  useEffect(() => {
    let timer: NodeJS.Timer;
    let timeout: NodeJS.Timeout;

    if (isLoadingChainConnection && selectedPool) {
      const checkConnection = () => {
        if (checkChainConnected(chainInfoMap[selectedPool.chain].slug)) {
          setIsConnectingChainSuccess(true);
          closeLoadingModal();
          setIsLoadingChainConnection(false);
          clearInterval(timer);
          clearTimeout(timeout);
          navigateToEarnTransaction(selectedPool);
        }
      };

      // Check network connection every 0.5 second
      timer = setInterval(checkConnection, 500);

      // Set timeout for 3 seconds
      timeout = setTimeout(() => {
        clearInterval(timer);

        if (!isConnectingChainSuccess) {
          closeLoadingModal();
          setIsLoadingChainConnection(false);
          openAlert({
            title: t('Error!'),
            content: t('Failed to get data. Please try again later.'),
            okButton: {
              text: t('Continue'),
              onClick: closeAlert
            }
          });
        }
      }, 3000);
    }

    return () => {
      clearInterval(timer);
      clearTimeout(timeout);
    };
  }, [chainInfoMap, checkChainConnected, closeAlert, closeLoadingModal, isConnectingChainSuccess, isLoadingChainConnection, navigateToEarnTransaction, openAlert, selectedPool, t]);

  return (
    <>
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
          className={'__section-list-container'}
          enableSearchInput
          list={items}
          renderItem={renderItem}
          renderWhenEmpty={emptyList}
          searchFunction={searchFunction}
          searchMinCharactersCount={2}
          searchPlaceholder={t<string>('Search token')}
          showActionBtn={false}
        />
      </Layout.Base>

      {
        !!connectingChain && (
          <ConnectChainModal
            chain={connectingChain}
            modalId={connectChainModalId}
            onCancel={closeConnectChainModal}
            onConnectChain={onConnectChain}
          />
        )
      }

      <LoadingModal
        loadingText={t('Getting data')}
        modalId={chainConnectionLoadingModalId}
      />

      {
        !!alertProps && (
          <AlertModal
            modalId={alertModalId}
            {...alertProps}
          />
        )
      }
    </>
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
