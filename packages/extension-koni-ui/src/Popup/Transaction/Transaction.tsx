// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { AlertModal, Layout, PageWrapper, RecheckChainConnectionModal } from '@subwallet/extension-koni-ui/components';
import { DEFAULT_TRANSACTION_PARAMS, TRANSACTION_TITLE_MAP } from '@subwallet/extension-koni-ui/constants';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { TransactionContext } from '@subwallet/extension-koni-ui/contexts/TransactionContext';
import { useAlert, useChainChecker, useNavigateOnChangeAccount, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { ManageChainsParam, Theme, ThemeProps, TransactionFormBaseProps } from '@subwallet/extension-koni-ui/types';
import { detectTransactionPersistKey } from '@subwallet/extension-koni-ui/utils';
import { ButtonProps, ModalContext, SwSubHeader } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useContext, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

interface Props extends ThemeProps {
  title: string,
  transactionType: string
}

const recheckChainConnectionModalId = 'recheck-chain-connection-modal-id';
const alertModalId = 'transaction-alert-modal-id';

function Component ({ className }: Props) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { activeModal, inactiveModal } = useContext(ModalContext);

  const dataContext = useContext(DataContext);

  const { alertProps, closeAlert, openAlert } = useAlert(alertModalId);
  const [recheckingChain, setRecheckingChain] = useState<string | undefined>();

  const transactionType = useMemo((): ExtrinsicType => {
    const pathName = location.pathname;
    const action = pathName.split('/')[2] || '';

    switch (action) {
      case 'earn':
        return ExtrinsicType.JOIN_YIELD_POOL;
      case 'unstake':
        return ExtrinsicType.STAKING_LEAVE_POOL;
      case 'cancel-unstake':
        return ExtrinsicType.STAKING_CANCEL_UNSTAKE;
      case 'claim-reward':
        return ExtrinsicType.STAKING_CLAIM_REWARD;
      case 'withdraw':
        return ExtrinsicType.STAKING_WITHDRAW;
      case 'compound':
        return ExtrinsicType.STAKING_COMPOUNDING;
      case 'send-nft':
        return ExtrinsicType.SEND_NFT;
      case 'swap':
        return ExtrinsicType.SWAP;
      case 'send-fund':
      default:
        return ExtrinsicType.TRANSFER_BALANCE;
    }
  }, [location.pathname]);

  const storageKey = useMemo((): string => detectTransactionPersistKey(transactionType), [transactionType]);

  const [storage, setStorage] = useLocalStorage<TransactionFormBaseProps>(storageKey, DEFAULT_TRANSACTION_PARAMS);

  const cacheStorage = useDeferredValue(storage);

  const needPersistData = useMemo(() => {
    return JSON.stringify(cacheStorage) === JSON.stringify(DEFAULT_TRANSACTION_PARAMS);
  }, [cacheStorage]);

  const [defaultData] = useState(storage);
  const { chain, from } = storage;

  const homePath = useMemo((): string => {
    const pathName = location.pathname;
    const action = pathName.split('/')[2] || '';

    switch (action) {
      case 'earn':
      case 'unstake':
      case 'cancel-unstake':
      case 'claim-reward':
      case 'withdraw':
      case 'compound':
        return '/home/earning';
      case 'send-nft':
        return '/home/nfts/collections';
      case 'send-fund':
      default:
        return '/home/tokens';
    }
  }, [location.pathname]);

  const titleMap = useMemo<Record<string, string>>(() => {
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(TRANSACTION_TITLE_MAP)) {
      result[key] = t(value);
    }

    return result;
  }, [t]);

  useNavigateOnChangeAccount(homePath);

  const goBack = useCallback(() => {
    navigate(homePath);
  }, [homePath, navigate]);

  const [subHeaderRightButtons, setSubHeaderRightButtons] = useState<ButtonProps[] | undefined>();
  const [isDisableHeader, setIsDisableHeader] = useState<boolean>();
  const [{ disabled: disableBack, onClick: onClickBack }, setBackProps] = useState<{
    disabled: boolean,
    onClick: null | VoidFunction
  }>({ disabled: false, onClick: null });
  const [customScreenTitle, setCustomScreenTitle] = useState<string | undefined>();

  const chainChecker = useChainChecker();

  // Navigate to finish page
  const onDone = useCallback(
    (extrinsicHash: string) => {
      navigate(`/transaction-done/${from}/${chain}/${extrinsicHash}`, { replace: true });
    },
    [from, chain, navigate]
  );

  const openRecheckChainConnectionModal = useCallback((chainName: string) => {
    setRecheckingChain(chainName);
    activeModal(recheckChainConnectionModalId);
  }, [activeModal]);

  const closeRecheckChainConnectionModal = useCallback(() => {
    inactiveModal(recheckChainConnectionModalId);
  }, [inactiveModal]);

  const onClickConfirmOnRecheckChainConnectionModal = useCallback(() => {
    if (recheckingChain) {
      navigate('/settings/chains/manage', { state: { defaultSearch: recheckingChain } as ManageChainsParam });
    }
  }, [navigate, recheckingChain]);

  useEffect(() => {
    chain !== '' && chainChecker(chain);
  }, [chain, chainChecker]);

  return (
    <>
      <Layout.Home
        isDisableHeader={isDisableHeader}
        showFilterIcon
        showTabBar={false}
      >
        <TransactionContext.Provider value={{
          defaultData,
          needPersistData,
          persistData: setStorage,
          onDone,
          setSubHeaderRightButtons,
          setIsDisableHeader,
          setCustomScreenTitle,
          goBack,
          setBackProps,
          closeAlert,
          openAlert,
          openRecheckChainConnectionModal,
          closeRecheckChainConnectionModal
        }}
        >
          <PageWrapper resolve={dataContext.awaitStores(['chainStore', 'assetRegistry', 'balance'])}>
            <div className={CN(className, 'transaction-wrapper')}>
              <SwSubHeader
                background={'transparent'}
                center
                className={'transaction-header'}
                disableBack={disableBack}
                onBack={onClickBack || goBack}
                rightButtons={subHeaderRightButtons}
                showBackButton
                title={customScreenTitle || titleMap[transactionType]}
              />
              <Outlet />
            </div>
          </PageWrapper>
        </TransactionContext.Provider>
      </Layout.Home>

      <RecheckChainConnectionModal
        modalId={recheckChainConnectionModalId}
        onCancel={closeRecheckChainConnectionModal}
        onClickConfirm={onClickConfirmOnRecheckChainConnectionModal}
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

const Transaction = styled(Component)(({ theme }) => {
  const token = (theme as Theme).token;

  return ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',

    '.transaction-header': {
      paddingTop: token.paddingSM,
      paddingBottom: token.paddingSM,
      flexShrink: 0
    },

    '.transaction-content': {
      flex: '1 1 370px',
      paddingLeft: token.padding,
      paddingRight: token.padding,
      overflow: 'auto'
    },

    '.transaction-footer': {
      display: 'flex',
      flexWrap: 'wrap',
      padding: `${token.paddingMD}px ${token.padding}px ${token.padding}px`,
      marginBottom: token.padding,
      gap: token.paddingXS,

      '.error-messages': {
        width: '100%',
        color: token.colorError
      },

      '.warning-messages': {
        width: '100%',
        color: token.colorWarning
      },

      '.ant-btn': {
        flex: 1
      },

      '.full-width': {
        minWidth: '100%'
      }
    }
  });
});

export default Transaction;
