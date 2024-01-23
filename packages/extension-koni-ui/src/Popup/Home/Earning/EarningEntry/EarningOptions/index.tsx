// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AlertModal, ConnectChainModal, EmptyList, Layout, LoadingModal } from '@subwallet/extension-koni-ui/components';
import { EarningOptionItem } from '@subwallet/extension-koni-ui/components/Earning';
import { DEFAULT_EARN_PARAMS, EARN_TRANSACTION } from '@subwallet/extension-koni-ui/constants';
import { useAlert, useChainConnection, useSelector, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { useYieldGroupInfo } from '@subwallet/extension-koni-ui/hooks/earning';
import { EarningEntryView, EarningPoolsParam, ThemeProps, YieldGroupInfo } from '@subwallet/extension-koni-ui/types';
import { isAccountAll } from '@subwallet/extension-koni-ui/utils';
import { ModalContext, SwList } from '@subwallet/react-ui';
import CN from 'classnames';
import { Database } from 'phosphor-react';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
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

// todo: will more chain connection logic to a shared component

const connectChainModalId = 'earning-options-connect-chain-modal';
const chainConnectionLoadingModalId = 'earning-options-chain-connection-loading-modalId';
const alertModalId = 'earning-options-alert-modal';

function Component ({ className, hasEarningPositions, setEntryView }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeModal, inactiveModal } = useContext(ModalContext);

  const data = useYieldGroupInfo();
  const { poolInfoMap } = useSelector((state) => state.earning);
  const chainInfoMap = useSelector((state) => state.chainStore.chainInfoMap);
  const { currentAccount } = useSelector((state) => state.accountState);

  const isShowBalance = useSelector((state) => state.settings.isShowBalance);

  const [, setEarnStorage] = useLocalStorage(EARN_TRANSACTION, DEFAULT_EARN_PARAMS);

  // check chain connection
  const { checkChainConnected, turnOnChain } = useChainConnection();
  const [connectingChain, setConnectingChain] = useState<string| undefined>();
  const [isLoadingChainConnection, setIsLoadingChainConnection] = useState<boolean>(false);
  const [isConnectingChainSuccess, setIsConnectingChainSuccess] = useState<boolean>(false);
  const [selectedPoolGroup, setSelectedPoolGroup] = React.useState<YieldGroupInfo | undefined>(undefined);
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

  const onClickItem = useCallback((item: YieldGroupInfo) => {
    return () => {
      setSelectedPoolGroup(item);

      if (item.poolListLength > 1) {
        navigate('/home/earning/pools', { state: {
          poolGroup: item.group,
          symbol: item.symbol
        } as EarningPoolsParam });
      } else if (item.poolListLength === 1) {
        if (!checkChainConnected(item.chain)) {
          openConnectChainModal(item.chain);
        } else {
          navigateToEarnTransaction(item);
        }
      }
    };
  }, [checkChainConnected, navigate, navigateToEarnTransaction, openConnectChainModal]);

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
        emptyMessage={t('You can stake in-app easily')}
        emptyTitle={t('No staking found')}
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

  useEffect(() => {
    let timer: NodeJS.Timer;
    let timeout: NodeJS.Timeout;

    if (isLoadingChainConnection && selectedPoolGroup) {
      const checkConnection = () => {
        if (checkChainConnected(chainInfoMap[selectedPoolGroup.chain].slug)) {
          setIsConnectingChainSuccess(true);
          closeLoadingModal();
          setIsLoadingChainConnection(false);
          clearInterval(timer);
          clearTimeout(timeout);
          navigateToEarnTransaction(selectedPoolGroup);
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
  }, [chainInfoMap, checkChainConnected, closeAlert, closeLoadingModal, isConnectingChainSuccess, isLoadingChainConnection, navigateToEarnTransaction, openAlert, selectedPoolGroup, t]);

  return (
    <>
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

const EarningOptions = styled(Component)<Props>(({ theme: { token } }: Props) => ({
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
