// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ALL_ACCOUNT_KEY } from '@subwallet/extension-base/constants';
import { PageWrapper } from '@subwallet/extension-koni-ui/components';
import Logo2D from '@subwallet/extension-koni-ui/components/Logo/Logo2D';
import { DEFAULT_ROUTER_PATH } from '@subwallet/extension-koni-ui/constants/router';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { usePredefinedModal, WalletModalContext } from '@subwallet/extension-koni-ui/contexts/WalletModalContext';
import useDefaultNavigate from '@subwallet/extension-koni-ui/hooks/router/useDefaultNavigate';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isNoAccount } from '@subwallet/extension-koni-ui/util/account';
import { changeHeaderLogo } from '@subwallet/react-ui';
import React, { useContext, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

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

function DefaultRoute ({ children }: {children: React.ReactNode}): React.ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const { goBack, goHome } = useDefaultNavigate();
  const { isOpenPModal, openPModal } = usePredefinedModal();
  const { hasConfirmations, hasInternalConfirmations } = useSelector((state: RootState) => state.requestState);
  const { accounts, hasMasterPassword, isLocked } = useSelector((state: RootState) => state.accountState);

  const needMigrate = useMemo(
    () => !!accounts
      .filter((acc) => acc.address !== ALL_ACCOUNT_KEY && !acc.isExternal)
      .filter((acc) => !acc.isMasterPassword)
      .length
    , [accounts]
  );

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

    if (needMigrate && hasMasterPassword) {
      navigate(migratePasswordUrl);
    } else if (pathName === DEFAULT_ROUTER_PATH) {
      if (isNoAccount(accounts)) {
        if (hasMasterPassword && isLocked) {
          navigate(loginUrl);
        } else {
          navigate(welcomeUrl);
        }
      } else if (!hasMasterPassword) {
        navigate(createPasswordUrl);
      } else if (isLocked) {
        navigate(loginUrl);
      } else if (needMigrate) {
        navigate(migratePasswordUrl);
      } else if (hasConfirmations) {
        openPModal('confirmations');
      } else {
        navigate(tokenUrl);
      }
    } else if (pathName === loginUrl && !isLocked) {
      goHome();
    } else if (pathName === welcomeUrl && !isNoAccount(accounts)) {
      goHome();
    } else if (hasInternalConfirmations) {
      openPModal('confirmations');
    } else if (!hasInternalConfirmations && isOpenPModal('confirmations')) {
      openPModal(null);
    }
  }, [accounts, goBack, goHome, hasConfirmations, hasInternalConfirmations, hasMasterPassword, isLocked, isOpenPModal, location.pathname, navigate, needMigrate, openPModal]);

  return <>{children}</>;
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
        resolve={dataContext.awaitStores(['accountState', 'chainStore', 'assetRegistry', 'requestState', 'settings'])}
      >
        <DefaultRoute>
          <Main className={className}>
            <Outlet />
          </Main>
        </DefaultRoute>
      </PageWrapper>
    </WalletModalContext>
  );
}

export const Root = styled(_Root)(() => ({}));
