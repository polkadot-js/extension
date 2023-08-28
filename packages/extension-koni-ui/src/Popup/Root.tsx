// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { WalletUnlockType } from '@subwallet/extension-base/background/KoniTypes';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import { isSameAddress } from '@subwallet/extension-base/utils';
import { BackgroundExpandView, PageWrapper } from '@subwallet/extension-koni-ui/components';
// Special
import { Logo2D } from '@subwallet/extension-koni-ui/components/Logo';
import { DEFAULT_ROUTER_PATH, TRANSACTION_STORAGES } from '@subwallet/extension-koni-ui/constants';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { usePredefinedModal, WalletModalContext } from '@subwallet/extension-koni-ui/contexts/WalletModalContext';
import { useDefaultNavigate, useGetCurrentPage, useNotification, useSelector, useSubscribeLanguage } from '@subwallet/extension-koni-ui/hooks';
import useUILock from '@subwallet/extension-koni-ui/hooks/common/useUILock';
import { subscribeNotifications } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isNoAccount, removeStorage } from '@subwallet/extension-koni-ui/utils';
import { changeHeaderLogo } from '@subwallet/react-ui';
import { NotificationProps } from '@subwallet/react-ui/es/notification/NotificationProvider';
import React, { useContext, useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useIsFirstRender } from 'usehooks-ts';

changeHeaderLogo(<Logo2D />);

export const RouteState = {
  prevDifferentPathNum: -1,
  lastPathName: '/'
};

const welcomeUrl = '/welcome';
const tokenUrl = '/home/tokens';
const loginUrl = '/keyring/login';
const createPasswordUrl = '/keyring/create-password';
const migratePasswordUrl = '/keyring/migrate-password';
const sercurityUrl = '/settings/security';

const baseAccountPath = '/accounts';
const allowImportAccountPaths = ['new-seed-phrase', 'import-seed-phrase', 'import-private-key', 'restore-json', 'import-by-qr', 'attach-read-only', 'connect-polkadot-vault', 'connect-keystone', 'connect-ledger'];

const allowImportAccountUrls = allowImportAccountPaths.map((path) => `${baseAccountPath}/${path}`);

function DefaultRoute ({ children }: {children: React.ReactNode}): React.ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const { goBack, goHome } = useDefaultNavigate();
  const { isOpenPModal, openPModal } = usePredefinedModal();
  const notify = useNotification();
  const currentPage = useGetCurrentPage();
  const isFirstRender = useIsFirstRender();
  const atRoot = location.pathname === '/';

  useSubscribeLanguage();

  const { hasConfirmations, hasInternalConfirmations } = useSelector((state: RootState) => state.requestState);
  const { accounts, currentAccount, hasMasterPassword, isLocked } = useSelector((state: RootState) => state.accountState);
  const [initAccount, setInitAccount] = useState(currentAccount);

  const noAccount = useMemo(() => isNoAccount(accounts), [accounts]);
  const { unlockType } = useSelector((state: RootState) => state.settings);
  const { isUILocked } = useUILock();
  const needUnlock = isUILocked || (isLocked && unlockType === WalletUnlockType.ALWAYS_REQUIRED);

  const needMigrate = useMemo(
    () => !!accounts
      .filter((acc) => acc.address !== ALL_ACCOUNT_KEY && !acc.isExternal && !acc.isInjected)
      .filter((acc) => !acc.isMasterPassword)
      .length
    , [accounts]
  );

  useEffect(() => {
    let cancel = false;
    let lastNotifyTime = new Date().getTime();

    subscribeNotifications((rs) => {
      rs.sort((a, b) => a.id - b.id)
        .forEach(({ action, id, message, title, type }) => {
          if (!cancel && id > lastNotifyTime) {
            const notificationItem: NotificationProps = { message: title || message, type };

            if (action?.url) {
              notificationItem.onClick = () => {
                window.open(action.url);
              };
            }

            notify(notificationItem);
            lastNotifyTime = id;
          }
        });
    }).catch(console.error);

    return () => {
      cancel = true;
    };
  }, [notify]);

  // Update goBack number
  useEffect(() => {
    if (location.pathname === RouteState.lastPathName) {
      RouteState.prevDifferentPathNum -= 1;
    } else {
      RouteState.prevDifferentPathNum = -1;
    }

    RouteState.lastPathName = location.pathname;
  }, [location]);

  useEffect(() => {
    const pathName = location.pathname;

    if (needMigrate && hasMasterPassword && !needUnlock) {
      if (pathName !== migratePasswordUrl) {
        navigate(migratePasswordUrl);
      }
    } else if (hasMasterPassword && needUnlock) {
      if (pathName !== loginUrl) {
        navigate(loginUrl);
      }
    } else if (!hasMasterPassword) {
      if (noAccount) {
        if (![...allowImportAccountUrls, welcomeUrl, createPasswordUrl, sercurityUrl].includes(pathName)) {
          navigate(welcomeUrl);
        }
      } else {
        navigate(createPasswordUrl);
      }
    } else if (noAccount) {
      if (![...allowImportAccountUrls, welcomeUrl, sercurityUrl].includes(pathName)) {
        navigate(welcomeUrl);
      }
    } else if (pathName === DEFAULT_ROUTER_PATH) {
      if (hasConfirmations) {
        openPModal('confirmations');
      } else {
        navigate(tokenUrl);
      }
    } else if (pathName === loginUrl && !needUnlock) {
      goHome();
    } else if (pathName === welcomeUrl && !noAccount) {
      goHome();
    } else if (hasInternalConfirmations) {
      openPModal('confirmations');
    } else if (!hasInternalConfirmations && isOpenPModal('confirmations')) {
      openPModal(null);
    }
  }, [
    accounts,
    currentPage,
    goBack,
    goHome,
    hasConfirmations,
    hasInternalConfirmations,
    hasMasterPassword,
    isLocked,
    isOpenPModal,
    location.pathname,
    navigate,
    noAccount,
    needUnlock,
    needMigrate,
    openPModal
  ]);

  useEffect(() => {
    if (currentPage && isFirstRender && atRoot && !hasConfirmations) {
      navigate(currentPage);
    }
  }, [currentPage, navigate, isFirstRender, atRoot, hasConfirmations]);

  // Remove transaction persist state
  useEffect(() => {
    if (!isSameAddress(initAccount?.address || '', currentAccount?.address || '')) {
      for (const key of TRANSACTION_STORAGES) {
        removeStorage(key);
      }

      setInitAccount(currentAccount);
    }
  }, [currentAccount, initAccount]);

  return <>
    {children}
  </>;
}

const Main = styled.main`
  display: flex;
  height: 100%;
  flex-direction: column
`;

function _Root ({ className }: ThemeProps): React.ReactElement {
  const dataContext = useContext(DataContext);

  // Implement WalletModalContext in Root component to make it available for all children and can use react-router-dom and ModalContextProvider
  return (
    <WalletModalContext>
      <PageWrapper
        animateOnce={true}
        className={'main-page-container'}
        resolve={dataContext.awaitStores(['accountState', 'chainStore', 'assetRegistry', 'requestState', 'settings', 'mantaPay', 'injectState'])}
      >
        <DefaultRoute>
          <Main className={className}>
            <Outlet />
          </Main>
        </DefaultRoute>
      </PageWrapper>
      <BackgroundExpandView />
    </WalletModalContext>
  );
}

export const Root = styled(_Root)(() => ({}));
