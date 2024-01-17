// Copyright 2019-2022 @polkadot/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { InfoIcon, Layout, PageWrapper } from '@subwallet/extension-web-ui/components';
import { DEFAULT_TRANSACTION_PARAMS, STAKING_NETWORK_DETAIL_MODAL, TRANSACTION_TITLE_MAP, TRANSACTION_TRANSFER_MODAL, TRANSACTION_YIELD_CANCEL_UNSTAKE_MODAL, TRANSACTION_YIELD_CLAIM_MODAL, TRANSACTION_YIELD_FAST_WITHDRAW_MODAL, TRANSACTION_YIELD_UNSTAKE_MODAL, TRANSACTION_YIELD_WITHDRAW_MODAL, TRANSFER_NFT_MODAL } from '@subwallet/extension-web-ui/constants';
import { DataContext } from '@subwallet/extension-web-ui/contexts/DataContext';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { TransactionContext, TransactionContextProps } from '@subwallet/extension-web-ui/contexts/TransactionContext';
import { useChainChecker, useNavigateOnChangeAccount, useTranslation } from '@subwallet/extension-web-ui/hooks';
import { Theme, ThemeProps, TransactionFormBaseProps } from '@subwallet/extension-web-ui/types';
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

function Component ({ children, className, modalContent, modalId }: Props) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const { activeModal, checkActive } = useContext(ModalContext);
  const { isWebUI } = useContext(ScreenContext);
  const dataContext = useContext(DataContext);

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
      case 'stake':
        return ExtrinsicType.STAKING_JOIN_POOL;
      case 'un-yield':
      case 'unstake':
        return ExtrinsicType.STAKING_LEAVE_POOL;
      case 'cancel-unstake':
      case 'cancel-un-yield':
        return ExtrinsicType.STAKING_CANCEL_UNSTAKE;
      case 'claim-reward':
      case 'yield-claim':
        return ExtrinsicType.STAKING_CLAIM_REWARD;
      case 'withdraw':
      case 'withdraw-yield':
        return ExtrinsicType.STAKING_WITHDRAW;
      case 'yield-withdraw-position':
        return ExtrinsicType.REDEEM_VDOT;
      case 'compound':
        return ExtrinsicType.STAKING_COMPOUNDING;
      case 'send-nft':
        return ExtrinsicType.SEND_NFT;
      case 'earn':
        return ExtrinsicType.JOIN_YIELD_POOL; // TODO: change this
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
      case 'stake':
      case 'unstake':
      case 'cancel-unstake':
      case 'claim-reward':
      case 'withdraw':
      case 'compound':
        return '/home/staking';
      case 'send-nft':
        return '/home/nfts/collections';
      case 'earn':
      case 'un-yield':
      case 'withdraw-yield':
      case 'cancel-un-yield':
      case 'yield-withdraw-position':
      case 'yield-claim':
        return '/home/earning/';
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

  const [showRightBtn, setShowRightBtn] = useState<boolean>(false);
  const [disabledRightBtn, setDisabledRightBtn] = useState<boolean>(false);

  const chainChecker = useChainChecker();

  const goBack = useCallback(() => {
    navigate(homePath);
  }, [homePath, navigate]);

  const persistData = useCallback((value: TransactionFormBaseProps) => {
    setStorage(value);
  }, [setStorage]);

  // Navigate to finish page
  const onDone = useCallback(
    (extrinsicHash: string) => {
      navigate(`/transaction-done/${from}/${chain}/${extrinsicHash}`, { replace: true });
    },
    [from, chain, navigate]
  );

  const onClickRightBtn = useCallback(() => {
    if (transactionType === ExtrinsicType.STAKING_JOIN_POOL) {
      activeModal(STAKING_NETWORK_DETAIL_MODAL);
    }

    // if (transactionType === ExtrinsicType.EARN) {
    //   activeModal(STAKING_PROCESS_MODAL);
    // }
  }, [activeModal, transactionType]);

  const subHeaderButton: ButtonProps[] = useMemo(() => {
    return showRightBtn
      ? [
        {
          disabled: disabledRightBtn,
          icon: <InfoIcon />,
          onClick: () => onClickRightBtn()
        }
      ]
      : [];
  }, [disabledRightBtn, onClickRightBtn, showRightBtn]);

  const contextValues = useMemo((): TransactionContextProps => ({
    defaultData,
    needPersistData,
    persistData,
    onDone,
    onClickRightBtn,
    setShowRightBtn,
    setDisabledRightBtn,
    modalId
  }), [defaultData, modalId, needPersistData, onClickRightBtn, onDone, persistData]);

  useEffect(() => {
    chain !== '' && chainChecker(chain);
  }, [chain, chainChecker]);

  if (modalContent) {
    return (
      <TransactionContext.Provider value={contextValues}>
        <PageWrapper resolve={dataContext.awaitStores(['chainStore', 'assetRegistry', 'balance'])}>
          <div className={CN(className, 'transaction-wrapper __modal-content')}>
            {children}
          </div>
        </PageWrapper>
      </TransactionContext.Provider>
    );
  }

  if (isWebUI) {
    return (
      <Layout.WithSubHeaderOnly
        onBack={goBack}
        showBackButton
        title={titleMap[transactionType]}
      >
        <TransactionContext.Provider value={contextValues}>
          <PageWrapper resolve={dataContext.awaitStores(['chainStore', 'assetRegistry', 'balance'])}>
            <div className={CN(className, 'transaction-wrapper')}>
              <Outlet />
            </div>
          </PageWrapper>
        </TransactionContext.Provider>
      </Layout.WithSubHeaderOnly>
    );
  }

  return (
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
              onBack={goBack}
              rightButtons={subHeaderButton}
              showBackButton
              title={titleMap[transactionType]}
            />
            <Outlet />
          </div>
        </PageWrapper>
      </TransactionContext.Provider>
    </Layout.Home>
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
