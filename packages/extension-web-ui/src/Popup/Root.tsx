// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { WalletUnlockType } from '@subwallet/extension-base/background/KoniTypes';
import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import { isSameAddress, TARGET_ENV } from '@subwallet/extension-base/utils';
import BaseWeb from '@subwallet/extension-web-ui/components/Layout/base/BaseWeb';
import { Logo2D } from '@subwallet/extension-web-ui/components/Logo';
import { DEFAULT_ROUTER_PATH } from '@subwallet/extension-web-ui/constants/router';
import { DataContext } from '@subwallet/extension-web-ui/contexts/DataContext';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { WalletModalContext } from '@subwallet/extension-web-ui/contexts/WalletModalContext';
import { useSubscribeLanguage } from '@subwallet/extension-web-ui/hooks';
import useNotification from '@subwallet/extension-web-ui/hooks/common/useNotification';
import useUILock from '@subwallet/extension-web-ui/hooks/common/useUILock';
import { subscribeNotifications } from '@subwallet/extension-web-ui/messaging';
import { RootState } from '@subwallet/extension-web-ui/stores';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { removeStorage } from '@subwallet/extension-web-ui/utils';
import { changeHeaderLogo, ModalContext } from '@subwallet/react-ui';
import { NotificationProps } from '@subwallet/react-ui/es/notification/NotificationProvider';
import CN from 'classnames';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import styled from 'styled-components';

import { CONFIRMATION_MODAL, TRANSACTION_STORAGES } from '../constants';
import { WebUIContextProvider } from '../contexts/WebUIContext';

changeHeaderLogo(<Logo2D />);

export const RouteState = {
  prevDifferentPathNum: -1,
  lastPathName: '/'
};

const welcomeUrl = '/welcome';
const tokenUrl = '/home/tokens';
const loginUrl = '/keyring/login';
const phishingUrl = '/phishing-page-detected';
const createPasswordUrl = '/keyring/create-password';
const migratePasswordUrl = '/keyring/migrate-password';
const securityUrl = '/settings/security';
const createDoneUrl = '/create-done';

// Campaign
const earningOptionsPreviewUrl = '/earning-preview';
const earningPoolsPreviewUrl = '/earning-preview/pools';
const checkCrowdloanUrl = '/crowdloan-unlock-campaign/check-contributions';
const crowdloanResultUrl = '/crowdloan-unlock-campaign/contributions-result';

const baseAccountPath = '/accounts';
const allowImportAccountPaths = ['new-seed-phrase', 'import-seed-phrase', 'import-private-key', 'restore-json', 'import-by-qr', 'attach-read-only', 'connect-polkadot-vault', 'connect-keystone', 'connect-ledger'];

const allowImportAccountUrls = allowImportAccountPaths.map((path) => `${baseAccountPath}/${path}`);
const allowPreventWelcomeUrls = [...allowImportAccountUrls, welcomeUrl, createPasswordUrl, securityUrl,
  earningOptionsPreviewUrl, earningPoolsPreviewUrl, checkCrowdloanUrl, crowdloanResultUrl];

export const MainWrapper = styled('div')<ThemeProps>(({ theme: { token } }: ThemeProps) => ({
  display: 'flex',
  height: '100%',
  flexDirection: 'column',
  overflow: 'auto',

  '.web-layout-container': {
    height: '100%'
  }
}));

function removeLoadingPlaceholder (animation: boolean): void {
  const element = document.getElementById('loading-placeholder');

  if (element) {
    if (animation) {
      // Add transition effect
      element.style.transition = 'opacity 0.1s ease-in-out';
      // Set opacity to 0
      element.style.opacity = '0';

      // Callback after 1 second
      setTimeout(() => {
        // Remove element
        element.parentNode?.removeChild(element);
      }, 150);
    } else {
      element.parentNode?.removeChild(element);
    }
  }
}

interface RedirectProps {
  redirect: string|null;
  modal: string|null;
}

function DefaultRoute ({ children }: {children: React.ReactNode}): React.ReactElement {
  const dataContext = useContext(DataContext);
  const screenContext = useContext(ScreenContext);
  const location = useLocation();
  const notify = useNotification();
  const [rootLoading, setRootLoading] = useState(true);
  const [dataLoaded, setDataLoaded] = useState(false);
  const initDataRef = useRef<Promise<boolean>>(dataContext.awaitStores(['accountState', 'chainStore', 'assetRegistry', 'requestState', 'settings', 'mantaPay']));
  const firstRender = useRef(true);

  useSubscribeLanguage();

  const { activeModal, inactiveModal } = useContext(ModalContext);

  const { unlockType } = useSelector((state: RootState) => state.settings);
  const { hasConfirmations, hasInternalConfirmations } = useSelector((state: RootState) => state.requestState);
  const { accounts, currentAccount, hasMasterPassword, isLocked, isNoAccount } = useSelector((state: RootState) => state.accountState);
  const [initAccount, setInitAccount] = useState(currentAccount);
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
    initDataRef.current.then(() => {
      setDataLoaded(true);
    }).catch(console.error);
  }, []);

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

  const redirectTarget = useMemo(() => {
    const pathName = location.pathname;

    const redirectHandlePage = pathName.startsWith('/redirect-handler');

    const redirectObj: RedirectProps = { redirect: null, modal: null };

    if (pathName === '/wc') {
      window.location.replace('https://docs.subwallet.app/main/extension-user-guide/connect-dapps-and-manage-website-access/connect-dapp-with-walletconnect');
    }

    // Wait until data loaded
    if (!dataLoaded) {
      return redirectObj;
    }

    const ignoreRedirect = pathName.startsWith(phishingUrl);

    if (ignoreRedirect) {
      // Do nothing
    } else if (needMigrate && hasMasterPassword && !needUnlock) {
      redirectObj.redirect = migratePasswordUrl;
    } else if (hasMasterPassword && needUnlock) {
      redirectObj.redirect = loginUrl;
    } else if (hasMasterPassword && pathName === createPasswordUrl) {
      redirectObj.redirect = DEFAULT_ROUTER_PATH;
    } else if (!hasMasterPassword) {
      if (isNoAccount) {
        if (!allowPreventWelcomeUrls.includes(pathName) && !redirectHandlePage) {
          redirectObj.redirect = welcomeUrl;
        }
      } else if (pathName !== createDoneUrl) {
        redirectObj.redirect = createPasswordUrl;
      }
    } else if (isNoAccount) {
      if (!allowPreventWelcomeUrls.includes(pathName) && !redirectHandlePage) {
        redirectObj.redirect = welcomeUrl;
      }
    } else if (hasConfirmations) {
      redirectObj.modal = `open:${CONFIRMATION_MODAL}`;
    } else if (pathName === DEFAULT_ROUTER_PATH) {
      redirectObj.redirect = tokenUrl;
    } else if (pathName === loginUrl && !needUnlock) {
      redirectObj.redirect = DEFAULT_ROUTER_PATH;
    } else if (pathName === welcomeUrl && !isNoAccount) {
      redirectObj.redirect = DEFAULT_ROUTER_PATH;
    } else if (pathName === migratePasswordUrl && !needMigrate) {
      if (isNoAccount) {
        redirectObj.redirect = welcomeUrl;
      } else {
        redirectObj.redirect = DEFAULT_ROUTER_PATH;
      }
    } else if (hasInternalConfirmations) {
      redirectObj.modal = `open:${CONFIRMATION_MODAL}`;
    } else if (!hasInternalConfirmations) {
      redirectObj.modal = `close:${CONFIRMATION_MODAL}`;
    }

    // Remove loading on finished first compute
    firstRender.current && setRootLoading((val) => {
      if (val) {
        removeLoadingPlaceholder(!needUnlock);
        firstRender.current = false;
      }

      return false;
    });

    redirectObj.redirect = redirectObj.redirect !== pathName ? redirectObj.redirect : null;

    return redirectObj;
  }, [location.pathname, dataLoaded, needMigrate, hasMasterPassword, needUnlock, isNoAccount, hasConfirmations, hasInternalConfirmations]);

  // Active or inactive confirmation modal
  useEffect(() => {
    if (redirectTarget.modal) {
      const [action, modalName] = redirectTarget.modal.split(':');

      if (action === 'open') {
        activeModal(modalName);
      } else {
        inactiveModal(modalName);
      }
    }
  }, [activeModal, inactiveModal, redirectTarget.modal]);

  // Remove transaction persist state
  useEffect(() => {
    if (TARGET_ENV === 'extension' && !isSameAddress(initAccount?.address || '', currentAccount?.address || '')) {
      for (const key of TRANSACTION_STORAGES) {
        removeStorage(key);
      }

      setInitAccount(currentAccount);
    }
  }, [currentAccount, initAccount]);

  if (rootLoading || redirectTarget.redirect) {
    return <>{redirectTarget.redirect && <Navigate to={redirectTarget.redirect} />}</>;
  } else {
    return <MainWrapper className={CN('main-page-container', `screen-size-${screenContext.screenType}`, { 'web-ui-enable': screenContext.isWebUI })}>
      {children}
    </MainWrapper>;
  }
}

export function Root (): React.ReactElement {
  // Implement WalletModalContext in Root component to make it available for all children and can use react-router-dom and ModalContextProvider

  return (
    <WebUIContextProvider>
      <WalletModalContext>
        <DefaultRoute>
          <BaseWeb>
            <Outlet />
          </BaseWeb>
        </DefaultRoute>
      </WalletModalContext>
    </WebUIContextProvider>
  );
}
