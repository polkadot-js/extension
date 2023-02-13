// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Main } from '@subwallet/extension-koni-ui/components';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import Logo2D from '@subwallet/extension-koni-ui/components/Logo/Logo2D';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { usePredefinedModal, WalletModalContext } from '@subwallet/extension-koni-ui/contexts/WalletModalContext';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { changeHeaderLogo } from '@subwallet/react-ui';
import Bowser from 'bowser';
import React, { useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

export function initRootPromise () {
  // Init Application with some default data if not existed
  const VARIANTS = ['beam', 'marble', 'pixel', 'sunset', 'bauhaus', 'ring'];

  changeHeaderLogo(<Logo2D />);

  function getRandomVariant (): string {
    const random = Math.floor(Math.random() * 6);

    return VARIANTS[random];
  }

  const browser = Bowser.getParser(window.navigator.userAgent);

  if (!window.localStorage.getItem('randomVariant') || !window.localStorage.getItem('randomNameForLogo')) {
    const randomVariant = getRandomVariant();

    window.localStorage.setItem('randomVariant', randomVariant);
    window.localStorage.setItem('randomNameForLogo', `${Date.now()}`);
  }

  if (!!browser.getBrowser() && !!browser.getBrowser().name && !!browser.getOS().name) {
    window.localStorage.setItem('browserInfo', browser.getBrowser().name as string);
    window.localStorage.setItem('osInfo', browser.getOS().name as string);
  }

  // Todo: Fetching data and setup store here
  // Todo: Loading all basic data for root with promise.all()
  // Todo: Settings data
  // Todo: Accounts data
  return true;
}

function _Root ({ className }: ThemeProps): React.ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const openPModal = usePredefinedModal();
  const dataContext = useContext(DataContext);
  const hasConfirmations = useSelector((state: RootState) => state.requestState);

  useEffect(() => {
    if (location.pathname === '/') {
      if (hasConfirmations) {
        openPModal('confirmations');
      } else {
        // Todo: check conditional an navigate to default page
        navigate('/home/tokens');
      }
    }
  },
  [hasConfirmations, location.pathname, navigate, openPModal]
  );

  // Implement WalletModalContext in Root component to make it available for all children and can use react-router-dom and ModalContextProvider
  return <WalletModalContext>
    <PageWrapper
      animateOnce={true}
      resolve={dataContext.awaitStores(['accountState', 'chainStore', 'assetRegistry', 'requestState'])}
    >
      <Main className={className}>
        <Outlet />
      </Main>
    </PageWrapper>
  </WalletModalContext>;
}

export const Root = styled(_Root)(() => ({
  '.main-layout': {
    flex: 1
  }
}));
