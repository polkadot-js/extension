// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { InfoIcon, Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import { StakingNetworkDetailModalId } from '@subwallet/extension-koni-ui/components/Modal/Staking/StakingNetworkDetailModal';
import { DEFAULT_TRANSACTION_PARAMS, TRANSACTION_TITLE_MAP } from '@subwallet/extension-koni-ui/constants';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { TransactionContext } from '@subwallet/extension-koni-ui/contexts/TransactionContext';
import { useChainChecker, useNavigateOnChangeAccount, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { Theme, ThemeProps, TransactionFormBaseProps } from '@subwallet/extension-koni-ui/types';
import { detectTransactionPersistKey } from '@subwallet/extension-koni-ui/utils';
import { ButtonProps, ModalContext, SwSubHeader } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useContext, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

import { isEthereumAddress } from '@polkadot/util-crypto';

interface Props extends ThemeProps {
  title: string,

  transactionType: string
}

function Component ({ className }: Props) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const { activeModal } = useContext(ModalContext);
  const dataContext = useContext(DataContext);

  const transactionType = useMemo((): ExtrinsicType => {
    const pathName = location.pathname;
    const action = pathName.split('/')[2] || '';

    switch (action) {
      case 'stake':
        return ExtrinsicType.STAKING_JOIN_POOL;
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
      case 'stake':
      case 'unstake':
      case 'cancel-unstake':
      case 'claim-reward':
      case 'withdraw':
      case 'compound':
        return '/home/staking';
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
      const chainType = isEthereumAddress(from) ? 'ethereum' : 'substrate';

      navigate(`/transaction-done/${chainType}/${chain}/${extrinsicHash}`, { replace: true });
    },
    [from, chain, navigate]
  );

  const onClickRightBtn = useCallback(() => {
    if (transactionType === ExtrinsicType.STAKING_JOIN_POOL) {
      activeModal(StakingNetworkDetailModalId);
    }
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

  useEffect(() => {
    chain !== '' && chainChecker(chain);
  }, [chain, chainChecker]);

  return (
    <Layout.Home
      showFilterIcon
      showTabBar={false}
    >
      <TransactionContext.Provider value={{ defaultData, needPersistData, persistData, onDone, onClickRightBtn, setShowRightBtn, setDisabledRightBtn }}>
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
