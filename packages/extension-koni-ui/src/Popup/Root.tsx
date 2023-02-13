// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Main } from '@subwallet/extension-koni-ui/components';
import PageWrapper from '@subwallet/extension-koni-ui/components/Layout/PageWrapper';
import { DataContext } from '@subwallet/extension-koni-ui/contexts/DataContext';
import { usePredefinedModal, WalletModalContext } from '@subwallet/extension-koni-ui/contexts/WalletModalContext';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useContext, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

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
