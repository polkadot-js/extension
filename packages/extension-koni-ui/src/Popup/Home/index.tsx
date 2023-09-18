// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import { GlobalSearchTokenModal } from '@subwallet/extension-koni-ui/components/Modal/GlobalSearchTokenModal';
import { HomeContext } from '@subwallet/extension-koni-ui/contexts/screen/HomeContext';
import { ScreenContext } from '@subwallet/extension-koni-ui/contexts/ScreenContext';
import { WebUIContext } from '@subwallet/extension-koni-ui/contexts/WebUIContext';
import useAccountBalance from '@subwallet/extension-koni-ui/hooks/screen/home/useAccountBalance';
import { useGetChainSlugsByAccountType } from '@subwallet/extension-koni-ui/hooks/screen/home/useGetChainSlugsByAccountType';
import useTokenGroup from '@subwallet/extension-koni-ui/hooks/screen/home/useTokenGroup';
import PortfolioPage from '@subwallet/extension-koni-ui/Popup/Home/PortfolioPage';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ModalContext } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useContext, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';

type Props = ThemeProps;

export const GlobalSearchTokenModalId = 'globalSearchToken';

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const chainsByAccountType = useGetChainSlugsByAccountType();
  const tokenGroupStructure = useTokenGroup(chainsByAccountType);
  const accountBalance = useAccountBalance(tokenGroupStructure.tokenGroupMap);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { isPortfolio } = useContext(WebUIContext);
  const { isWebUI } = useContext(ScreenContext);

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

  return (
    <>
      <HomeContext.Provider value={{
        tokenGroupStructure,
        accountBalance
      }}
      >
        <div className={CN(className, 'home', 'home-container', { 'portfolio-container': isPortfolio })}>
          {(isPortfolio && isWebUI)
            ? <PortfolioPage />
            : <Layout.Home
              onClickSearchIcon={onOpenGlobalSearchToken}
              showFilterIcon
              showSearchIcon
            >
              <Outlet />
            </Layout.Home>}
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
