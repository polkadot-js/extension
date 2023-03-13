// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { Layout } from '@subwallet/extension-koni-ui/components';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { StakingNetworkDetailModalId } from '@subwallet/extension-koni-ui/components/Modal/Staking/StakingNetworkDetailModal';
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { subscribeFreeBalance } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ButtonProps, Icon, SwSubHeader } from '@subwallet/react-ui';
import { ModalContext } from '@subwallet/react-ui/es/sw-modal/provider';
import CN from 'classnames';
import { Info } from 'phosphor-react';
import React, { Dispatch, SetStateAction, useCallback, useContext, useEffect, useMemo, useState } from 'react';
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
  transactionType: ExtrinsicType,
  setTransactionType: Dispatch<SetStateAction<ExtrinsicType>>,
  setFrom: Dispatch<SetStateAction<string>>,
  setChain: Dispatch<SetStateAction<string>>,
  freeBalance: string | undefined,
  onDone: (extrinsicHash: string) => void,
  onClickRightBtn: () => void,
  setShowRightBtn: Dispatch<SetStateAction<boolean>>
}

export const TransactionContext = React.createContext<TransactionContextProps>({
  transactionType: ExtrinsicType.TRANSFER_BALANCE,
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
  onDone: (extrinsicHash) => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onClickRightBtn: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setShowRightBtn: (value) => {}
});

function Component ({ className }: Props) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { activeModal } = useContext(ModalContext);
  const { currentAccount, isAllAccount } = useSelector((root: RootState) => root.accountState);
  const [from, setFrom] = useState(!isAllAccount ? currentAccount?.address || '' : '');
  const [chain, setChain] = useState('');
  const [transactionType, setTransactionType] = useState<ExtrinsicType>(ExtrinsicType.TRANSFER_BALANCE);
  const [freeBalance, setFreeBalance] = useState<string | undefined>();
  const [showRightBtn, setShowRightBtn] = useState<boolean>(false);
  const titleMap = useMemo<Record<string, string>>(() => ({
    [ExtrinsicType.TRANSFER_BALANCE]: t('Transfer'),
    [ExtrinsicType.SEND_NFT]: t('Transfer NFT'),
    [ExtrinsicType.STAKING_STAKE]: t('Add to Bond'),
    [ExtrinsicType.STAKING_UNSTAKE]: t('Remove Bond')
  }), [t]);
  const { goBack } = useDefaultNavigate();

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

  // Navigate to finish page
  const onDone = useCallback(
    (extrinsicHash: string) => {
      const chainType = isEthereumAddress(from) ? 'ethereum' : 'substrate';

      navigate(`/transaction/done/${chainType}/${chain}/${extrinsicHash}`, { replace: true });
    },
    [from, chain, navigate]
  );

  const onClickRightBtn = useCallback(() => {
    if (transactionType === ExtrinsicType.STAKING_STAKE) {
      activeModal(StakingNetworkDetailModalId);
    }
  }, [activeModal, transactionType]);

  const subHeaderButton: ButtonProps[] = useMemo(() => {
    return showRightBtn
      ? [
        {
          icon: <Icon phosphorIcon={Info} />,
          onClick: () => onClickRightBtn()
        }
      ]
      : [];
  }, [onClickRightBtn, showRightBtn]);

  return (
    <Layout.Home showTabBar={false}>
      <TransactionContext.Provider value={{ transactionType, from, setFrom, freeBalance, chain, setChain, setTransactionType, onDone, onClickRightBtn, setShowRightBtn }}>
        <PageWrapper>
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
      flex: '1 1 400px',
      paddingLeft: token.padding,
      paddingRight: token.padding,
      overflow: 'auto'
    },

    '.transaction-footer': {
      display: 'flex',
      flexWrap: 'wrap',
      padding: `${token.paddingMD}px ${token.padding}px`,
      paddingBottom: token.paddingLG,
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
