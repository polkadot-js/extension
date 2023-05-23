// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import { GlobalSearchTokenModal } from '@subwallet/extension-koni-ui/components/Modal/GlobalSearchTokenModal';
import { HomeContext } from '@subwallet/extension-koni-ui/contexts/screen/HomeContext';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import useAccountBalance from '@subwallet/extension-koni-ui/hooks/screen/home/useAccountBalance';
import { useGetChainSlugsByAccountType } from '@subwallet/extension-koni-ui/hooks/screen/home/useGetChainSlugsByAccountType';
import useTokenGroup from '@subwallet/extension-koni-ui/hooks/screen/home/useTokenGroup';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ModalContext } from '@subwallet/react-ui';
import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router';
import styled from 'styled-components';

import Porfolio from '../Porfolio';

type Props = ThemeProps;

export const GlobalSearchTokenModalId = 'globalSearchToken';

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const chainsByAccountType = useGetChainSlugsByAccountType();
  const tokenGroupStructure = useTokenGroup(chainsByAccountType);
  const accountBalance = useAccountBalance(tokenGroupStructure.tokenGroupMap);
  const { isWebUI } = useContext(ScreenContext);
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const onOpenGlobalSearchToken = useCallback(() => {
    activeModal(GlobalSearchTokenModalId);
  }, [activeModal]);

  const onCloseGlobalSearchToken = useCallback(() => {
    inactiveModal(GlobalSearchTokenModalId);
  }, [inactiveModal]);

  useEffect(() => {
    const pathEls = pathname.split('/').filter((i: string) => !!i);

    if (pathEls.length <= 1) {
      navigate('/home/tokens');
    }
  }, [navigate, pathname]);

  const pathEls = useMemo(() => pathname.split('/').filter((i: string) => !!i), [pathname]);
  const homeContent = useMemo(() => {
    if (isWebUI && ['tokens', 'nfts'].includes(pathEls[1])) {
      return (
        <Layout.Base
          headerList={['Controller', 'Balance']}
          showWebHeader
          withSideMenu
        withBackground={['tokens', 'nfts'].includes(pathEls[1])}
        >
          <Porfolio />
        </Layout.Base>

      );
    }

    return (
      <Layout.Home
        onClickSearchIcon={onOpenGlobalSearchToken}
        showFilterIcon
        showSearchIcon
      >
        <Outlet />
      </Layout.Home>
    );
  }, [isWebUI, onOpenGlobalSearchToken, pathEls]);

  return (
    <>
      <HomeContext.Provider value={{
        tokenGroupStructure,
        accountBalance
      }}
      >
        <div className={`home home-container ${className}`}>
          {homeContent}
        </div>
      </HomeContext.Provider>

      <GlobalSearchTokenModal
        id={GlobalSearchTokenModalId}
        onCancel={onCloseGlobalSearchToken}
        sortedTokenSlugs={tokenGroupStructure.sortedTokenSlugs}
        tokenBalanceMap={accountBalance.tokenBalanceMap}
      />
    </>
  );
}

const Home = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    height: '100%'
  });
});

export default Home;
