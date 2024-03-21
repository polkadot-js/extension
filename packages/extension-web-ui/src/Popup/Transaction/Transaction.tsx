// Copyright 2019-2022 @polkadot/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { AlertModal, Layout, PageWrapper, RecheckChainConnectionModal } from '@subwallet/extension-web-ui/components';
import { DEFAULT_TRANSACTION_PARAMS, TRANSACTION_TITLE_MAP, TRANSACTION_TRANSFER_MODAL, TRANSACTION_YIELD_CANCEL_UNSTAKE_MODAL, TRANSACTION_YIELD_CLAIM_MODAL, TRANSACTION_YIELD_FAST_WITHDRAW_MODAL, TRANSACTION_YIELD_UNSTAKE_MODAL, TRANSACTION_YIELD_WITHDRAW_MODAL, TRANSFER_NFT_MODAL } from '@subwallet/extension-web-ui/constants';
import { DataContext } from '@subwallet/extension-web-ui/contexts/DataContext';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { TransactionContext, TransactionContextProps } from '@subwallet/extension-web-ui/contexts/TransactionContext';
import { useAlert, useChainChecker, useNavigateOnChangeAccount, useTranslation } from '@subwallet/extension-web-ui/hooks';
import { ManageChainsParam, Theme, ThemeProps, TransactionFormBaseProps } from '@subwallet/extension-web-ui/types';
import { detectTransactionPersistKey } from '@subwallet/extension-web-ui/utils';
import { ButtonProps, ModalContext, SwSubHeader } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useContext, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

interface Props extends ThemeProps {
  title?: string;
  children?: React.ReactElement;
  transactionType?: string;
  modalContent?: boolean;
  modalId?: string;
}

const recheckChainConnectionModalId = 'recheck-chain-connection-modal-id';
const alertModalId = 'transaction-alert-modal-id';

function Component ({ children, className, modalContent, modalId }: Props) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const { activeModal, checkActive, inactiveModal } = useContext(ModalContext);
  const { isWebUI } = useContext(ScreenContext);
  const dataContext = useContext(DataContext);

  const { alertProps, closeAlert, openAlert } = useAlert(alertModalId);
  const [recheckingChain, setRecheckingChain] = useState<string | undefined>();

  const transactionType = useMemo((): ExtrinsicType => {
    const pathName = location.pathname;
    const action = pathName.split('/')[2] || '';

    if (checkActive(TRANSACTION_TRANSFER_MODAL)) {
      return ExtrinsicType.TRANSFER_BALANCE;
    } else if (checkActive(TRANSFER_NFT_MODAL)) {
      return ExtrinsicType.SEND_NFT;
    } else if (checkActive(TRANSACTION_YIELD_UNSTAKE_MODAL)) {
      return ExtrinsicType.STAKING_LEAVE_POOL;
    } else if (checkActive(TRANSACTION_YIELD_CANCEL_UNSTAKE_MODAL)) {
      return ExtrinsicType.STAKING_CANCEL_UNSTAKE;
    } else if (checkActive(TRANSACTION_YIELD_WITHDRAW_MODAL)) {
      return ExtrinsicType.STAKING_WITHDRAW;
    } else if (checkActive(TRANSACTION_YIELD_FAST_WITHDRAW_MODAL)) {
      return ExtrinsicType.REDEEM_LDOT;
    } else if (checkActive(TRANSACTION_YIELD_CLAIM_MODAL)) {
      return ExtrinsicType.STAKING_CLAIM_REWARD;
    }

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
  }, [checkActive, location.pathname]);

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

  useNavigateOnChangeAccount(homePath, !modalContent);

  const goBack = useCallback(() => {
    navigate(homePath);
  }, [homePath, navigate]);

  const [subHeaderRightButtons, setSubHeaderRightButtons] = useState<ButtonProps[] | undefined>();
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

  const contextValues = useMemo((): TransactionContextProps => ({
    defaultData,
    needPersistData,
    persistData: setStorage,
    onDone,
    setSubHeaderRightButtons,
    setCustomScreenTitle,
    goBack,
    setBackProps,
    closeAlert,
    openAlert,
    openRecheckChainConnectionModal,
    closeRecheckChainConnectionModal,
    modalId
  }), [closeAlert, closeRecheckChainConnectionModal, defaultData, goBack, modalId, needPersistData, onDone, openAlert, openRecheckChainConnectionModal, setStorage]);

  useEffect(() => {
    chain !== '' && chainChecker(chain);
  }, [chain, chainChecker]);

  const recheckChainConnectionModalNode = (
    <>
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

  if (modalContent) {
    return (
      <>
        <TransactionContext.Provider value={contextValues}>
          <PageWrapper resolve={dataContext.awaitStores(['chainStore', 'assetRegistry', 'balance'])}>
            <div className={CN(className, 'transaction-wrapper __modal-content')}>
              {children}
            </div>
          </PageWrapper>
        </TransactionContext.Provider>

        {recheckChainConnectionModalNode}
      </>
    );
  }

  if (isWebUI) {
    return (
      <>
        <Layout.WithSubHeaderOnly
          onBack={goBack}
          showBackButton
          title={customScreenTitle || titleMap[transactionType]}
        >
          <TransactionContext.Provider value={contextValues}>
            <PageWrapper resolve={dataContext.awaitStores(['chainStore', 'assetRegistry', 'balance'])}>
              <div className={CN(className, 'transaction-wrapper')}>
                <Outlet />
              </div>
            </PageWrapper>
          </TransactionContext.Provider>
        </Layout.WithSubHeaderOnly>

        {recheckChainConnectionModalNode}
      </>
    );
  }

  return (
    <>
      <Layout.Home
        showFilterIcon
        showTabBar={false}
      >
        <TransactionContext.Provider value={contextValues}>
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

      {recheckChainConnectionModalNode}
    </>
  );
}

const Transaction = styled(Component)(({ theme }) => {
  const token = (theme as Theme).token;

  return ({
    height: '100%',
    display: 'flex',
    flexDirection: 'column',

    '.content': {
      '&.__web-ui': {
        display: 'flex',
        gap: 16,
        justifyContent: 'center',
        width: '80%',
        margin: '0 auto',

        '& > *': {
          maxWidth: '50%',
          flex: 1
        }
      }
    },

    '&.__modal-content': {
      margin: `0 -${token.margin}px`,

      '.transaction-content': {
        flex: '1 1 auto'
      }
    },

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
