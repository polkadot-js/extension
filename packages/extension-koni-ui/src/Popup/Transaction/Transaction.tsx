// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { InfoIcon, Layout, PageWrapper } from '@subwallet/extension-koni-ui/components';
import { StakingNetworkDetailModalId } from '@subwallet/extension-koni-ui/components/Modal/Staking/StakingNetworkDetailModal';
import { TRANSACTION_TITLE_MAP } from '@subwallet/extension-koni-ui/constants';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { useAssetChecker, useNavigateOnChangeAccount, useTranslation } from '@subwallet/extension-koni-ui/hooks';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { Theme, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ButtonProps, ModalContext, SwSubHeader } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { Dispatch, SetStateAction, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { isEthereumAddress } from '@polkadot/util-crypto';

interface Props extends ThemeProps {
  title: string,

  transactionType: string
}

export interface TransactionFormBaseProps {
  from: string,
  chain: string
  asset: string
}

export interface TransactionContextProps extends TransactionFormBaseProps {
  transactionType: ExtrinsicType,
  setFrom: Dispatch<SetStateAction<string>>,
  setChain: Dispatch<SetStateAction<string>>,
  setAsset: Dispatch<SetStateAction<string>>,
  onDone: (extrinsicHash: string) => void,
  onClickRightBtn: () => void,
  setShowRightBtn: Dispatch<SetStateAction<boolean>>
  setDisabledRightBtn: Dispatch<SetStateAction<boolean>>
}

export const TransactionContext = React.createContext<TransactionContextProps>({
  transactionType: ExtrinsicType.TRANSFER_BALANCE,
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  from: '',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setFrom: (value) => {},
  chain: '',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setChain: (value) => {},
  asset: '',
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setAsset: (value) => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onDone: (extrinsicHash) => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onClickRightBtn: () => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setShowRightBtn: (value) => {},
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  setDisabledRightBtn: (value) => {}
});

function Component ({ className }: Props) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  const { activeModal } = useContext(ModalContext);
  const dataContext = useContext(DataContext);

  const { currentAccount, isAllAccount } = useSelector((root: RootState) => root.accountState);

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
      case 'compound':
        return ExtrinsicType.STAKING_COMPOUNDING;
      case 'send-nft':
        return ExtrinsicType.SEND_NFT;
      case 'send-fund':
      default:
        return ExtrinsicType.TRANSFER_BALANCE;
    }
  }, [location.pathname]);

  const homePath = useMemo((): string => {
    const pathName = location.pathname;
    const action = pathName.split('/')[2] || '';

    switch (action) {
      case 'stake':
      case 'unstake':
      case 'cancel-unstake':
      case 'claim-reward':
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

  const [from, setFrom] = useState(!isAllAccount ? currentAccount?.address || '' : '');
  const [chain, setChain] = useState('');
  const [asset, setAsset] = useState('');
  const [showRightBtn, setShowRightBtn] = useState<boolean>(false);
  const [disabledRightBtn, setDisabledRightBtn] = useState<boolean>(false);

  const checkAsset = useAssetChecker();

  const goBack = useCallback(() => {
    navigate(homePath);
  }, [homePath, navigate]);

  // Navigate to finish page
  const onDone = useCallback(
    (extrinsicHash: string) => {
      const chainType = isEthereumAddress(from) ? 'ethereum' : 'substrate';

      navigate(`/transaction/done/${chainType}/${chain}/${extrinsicHash}`, { replace: true });
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
    asset !== '' && checkAsset(asset);
  }, [asset, checkAsset]);

  return (
    <Layout.Home
      showFilterIcon
      showTabBar={false}
    >
      <TransactionContext.Provider value={{ transactionType, from, setFrom, chain, setChain, onDone, onClickRightBtn, setShowRightBtn, setDisabledRightBtn, asset, setAsset }}>
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
