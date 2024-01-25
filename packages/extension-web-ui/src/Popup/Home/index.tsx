// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-web-ui/components';
import { GlobalSearchTokenModal } from '@subwallet/extension-web-ui/components/Modal/GlobalSearchTokenModal';
import { GeneralTermModal } from '@subwallet/extension-web-ui/components/Modal/TermsAndConditions/GeneralTermModal';
import { CONFIRM_GENERAL_TERM, GENERAL_TERM_AND_CONDITION_MODAL } from '@subwallet/extension-web-ui/constants';
import { HomeContext } from '@subwallet/extension-web-ui/contexts/screen/HomeContext';
import { ScreenContext } from '@subwallet/extension-web-ui/contexts/ScreenContext';
import { WebUIContext } from '@subwallet/extension-web-ui/contexts/WebUIContext';
import useAccountBalance from '@subwallet/extension-web-ui/hooks/screen/home/useAccountBalance';
import { useGetChainSlugsByAccountType } from '@subwallet/extension-web-ui/hooks/screen/home/useGetChainSlugsByAccountType';
import useTokenGroup from '@subwallet/extension-web-ui/hooks/screen/home/useTokenGroup';
import PortfolioPage from '@subwallet/extension-web-ui/Popup/Home/PortfolioPage';
import { ThemeProps } from '@subwallet/extension-web-ui/types';
import { ModalContext } from '@subwallet/react-ui';
import CN from 'classnames';
import React, { useCallback, useContext, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

type Props = ThemeProps;

export const GlobalSearchTokenModalId = 'globalSearchToken';

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const chainsByAccountType = useGetChainSlugsByAccountType();
  const tokenGroupStructure = useTokenGroup(chainsByAccountType);
  const accountBalance = useAccountBalance(tokenGroupStructure.tokenGroupMap);
  const [isConfirmedTermGeneral, setIsConfirmedTermGeneral] = useLocalStorage(CONFIRM_GENERAL_TERM, 'nonConfirmed');
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

  const onAfterConfirmTermModal = useCallback(() => {
    setIsConfirmedTermGeneral('confirmed');
  }, [setIsConfirmedTermGeneral]);

  useEffect(() => {
    const pathEls = pathname.split('/').filter((i: string) => !!i);

    if (pathEls.length <= 1) {
      navigate('/home/tokens');
    }
  }, [navigate, pathname]);

  useEffect(() => {
    if (isConfirmedTermGeneral.includes('nonConfirmed')) {
      activeModal(GENERAL_TERM_AND_CONDITION_MODAL);
    }
  }, [activeModal, isConfirmedTermGeneral, setIsConfirmedTermGeneral]);

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
          <GeneralTermModal onOk={onAfterConfirmTermModal} />
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
