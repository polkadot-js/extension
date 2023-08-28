// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { WalletUnlockType } from '@subwallet/extension-base/background/KoniTypes';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import { PageWrapper } from '@subwallet/extension-koni-ui/components';
import BaseWeb from '@subwallet/extension-koni-ui/components/Layout/base/BaseWeb';
import { Logo2D } from '@subwallet/extension-koni-ui/components/Logo';
import { DEFAULT_ROUTER_PATH } from '@subwallet/extension-koni-ui/constants/router';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { usePredefinedModal, WalletModalContext } from '@subwallet/extension-koni-ui/contexts/WalletModalContext';
import { useSubscribeLanguage } from '@subwallet/extension-koni-ui/hooks';
import useNotification from '@subwallet/extension-koni-ui/hooks/common/useNotification';
import useUILock from '@subwallet/extension-koni-ui/hooks/common/useUILock';
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import { subscribeNotifications } from '@subwallet/extension-koni-ui/messaging';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isNoAccount } from '@subwallet/extension-koni-ui/utils';
import { changeHeaderLogo } from '@subwallet/react-ui';
import { NotificationProps } from '@subwallet/react-ui/es/notification/NotificationProvider';
import CN from 'classnames';
import React, { useContext, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

import { WebUIContextProvider } from '../contexts/WebUIContext';

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

  useSubscribeLanguage();

  const { unlockType } = useSelector((state: RootState) => state.settings);
  const { hasConfirmations, hasInternalConfirmations } = useSelector((state: RootState) => state.requestState);
  const { accounts, hasMasterPassword, isLocked } = useSelector((state: RootState) => state.accountState);
  const noAccount = useMemo(() => isNoAccount(accounts), [accounts]);
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
      } else if (pathName !== createPasswordUrl) {
        navigate(createPasswordUrl);
      }
    } else if (noAccount) {
      if (![...allowImportAccountUrls, welcomeUrl, sercurityUrl].includes(pathName)) {
        navigate(welcomeUrl);
      }
    } else if (hasConfirmations) {
      openPModal('confirmations');
    } else if (pathName === DEFAULT_ROUTER_PATH) {
      navigate(tokenUrl);
    } else if (pathName === loginUrl && !needUnlock) {
      goHome();
    } else if (hasInternalConfirmations) {
      openPModal('confirmations');
    } else if (!hasInternalConfirmations && isOpenPModal('confirmations')) {
      openPModal(null);
    }
  }, [noAccount, goBack, goHome, hasConfirmations, hasInternalConfirmations, hasMasterPassword, isOpenPModal, location.pathname, navigate, needMigrate, openPModal, needUnlock]);

  return <>
    {children}
  </>;
}

function _Root ({ className }: ThemeProps): React.ReactElement {
  const dataContext = useContext(DataContext);
  const screenContext = useContext(ScreenContext);
  // Implement WalletModalContext in Root component to make it available for all children and can use react-router-dom and ModalContextProvider

  return (
    <WebUIContextProvider>
      <WalletModalContext>
        <PageWrapper
          animateOnce={true}
          className={CN('main-page-container', `screen-size-${screenContext.screenType}`, { 'web-ui-enable': screenContext.isWebUI })}
          resolve={dataContext.awaitStores(['accountState', 'chainStore', 'assetRegistry', 'requestState', 'settings', 'mantaPay', 'injectState'])}
        >
          <DefaultRoute>
            <main className={className}>
              <BaseWeb>
                <Outlet />
              </BaseWeb>
            </main>
          </DefaultRoute>
        </PageWrapper>
      </WalletModalContext>
    </WebUIContextProvider>
  );
}

export const Root = styled(_Root)<ThemeProps>(({ theme: { token } }: ThemeProps) => ({
  display: 'flex',
  height: '100%',
  flexDirection: 'column',
  overflow: 'auto',

  '.web-layout-container': {
    height: '100%'
  }
}));
