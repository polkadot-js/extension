// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { subscribeFreeBalance } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { SwSubHeader } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { Dispatch, SetStateAction, useCallback, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Outlet, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

interface Props extends ThemeProps {
  title: string,

  transactionType: string
}

export interface TransactionFormBaseProps {
  from: string,
  chain: string
}

export interface TransactionContextProps extends TransactionFormBaseProps {
  transactionType: string,
  setTransactionType: Dispatch<SetStateAction<string>>,
  setFrom: Dispatch<SetStateAction<string>>,
  setChain: Dispatch<SetStateAction<string>>,
  freeBalance: string | undefined
  onDone: (extrinsicHash: string) => void
}

export const TransactionContext = React.createContext<TransactionContextProps>({
  transactionType: 'transfer',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setTransactionType: (value) => {},
  from: '',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setFrom: (value) => {},
  chain: '',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setChain: (value) => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  freeBalance: '0',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onDone: (extrinsicHash) => {}
});

function Component ({ className }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { currentAccount, isAllAccount } = useSelector((root: RootState) => root.accountState);
  const [from, setFrom] = useState(!isAllAccount ? currentAccount?.address || '' : '');
  const [chain, setChain] = useState('');
  const [transactionType, setTransactionType] = useState('transfer');
  const [freeBalance, setFreeBalance] = useState<string | undefined>();
  const titleMap = useMemo<Record<string, string>>(() => ({
    transfer: t('Transfer')
  }), [t]);

  useEffect(() => {
    let cancel = false;

    if (chain && from && chain !== '' && from !== '') {
      subscribeFreeBalance({ address: from, networkKey: chain }, (free) => {
        if (!cancel) {
          !cancel && setFreeBalance(free);
        }
      }).catch(console.error);
    }

    return () => {
      cancel = true;
    };
  }, [from, chain]);

  // Navigate go back
  const onBack = useCallback(
    () => {
      navigate('/home/tokens');
    },
    [navigate]
  );

  // Navigate to finish page
  const onDone = useCallback(
    (extrinsicHash: string) => {
      const chainType = isEthereumAddress(from) ? 'ethereum' : 'substrate';

      navigate(`/transaction/done/${chainType}/${chain}/${extrinsicHash}`, { replace: true });
    },
    [from, chain, navigate]
  );

  return (
    <Layout.Home showTabBar={false}>
      <TransactionContext.Provider value={{ transactionType, from, setFrom, freeBalance, chain, setChain, setTransactionType, onDone }}>
        <PageWrapper>
          <div className={CN(className, 'transaction-wrapper')}>
            <SwSubHeader
              background={'transparent'}
              center
              className={'transaction-header'}
              onBack={onBack}
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
      paddingTop: token.paddingXS,
      paddingBottom: token.paddingXS
    },

    '.transaction-content': {
      flex: '1 1 400px',
      padding: token.paddingMD,
      overflow: 'auto'
    },

    '.transaction-footer': {
      display: 'flex',
      flexWrap: 'wrap',
      padding: token.paddingMD,
      paddingBottom: token.paddingLG,
      gap: token.paddingXS,

      '.error-messages': {
        width: '100%',
        color: token.colorError
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
