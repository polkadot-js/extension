// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import { HomeContext } from '@subwallet/extension-koni-ui/contexts/screen/HomeContext';
import useAccountBalance from '@subwallet/extension-koni-ui/hooks/screen/home/useAccountBalance';
import { useChainsByAccountType } from '@subwallet/extension-koni-ui/hooks/screen/home/useChainsByAccountType';
import useTokenGroup from '@subwallet/extension-koni-ui/hooks/screen/home/useTokenGroup';
import { CustomizeModal } from '@subwallet/extension-koni-ui/Popup/Home/modal/CustomizeModal';
import { GlobalSearchTokenModal } from '@subwallet/extension-koni-ui/Popup/Home/modal/GlobalSearchTokenModal';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ModalContext } from '@subwallet/react-ui/es/sw-modal/provider';
import React, { useCallback, useContext } from 'react';
import { Outlet } from 'react-router';
import styled from 'styled-components';

type Props = ThemeProps;

const GlobalSearchTokenModalId = 'globalSearchToken';
const CustomizeModalId = 'customizeModalId';

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { activeModal, inactiveModal } = useContext(ModalContext);
  // todo: Must check if current account exists before processing to this component
  // todo: Must get current account address then get its type.
  const chainsByAccountType = useChainsByAccountType('ALL');
  const tokenGroupStructure = useTokenGroup(chainsByAccountType);
  const accountBalance = useAccountBalance(tokenGroupStructure.tokenGroupMap);

  const onOpenCustomizeModal = useCallback(() => {
    activeModal(CustomizeModalId);
  }, [activeModal]);

  const onCloseCustomizeModal = useCallback(() => {
    inactiveModal(CustomizeModalId);
  }, [inactiveModal]);

  const onOpenGlobalSearchToken = useCallback(() => {
    activeModal(GlobalSearchTokenModalId);
  }, [activeModal]);

  const onCloseGlobalSearchToken = useCallback(() => {
    inactiveModal(GlobalSearchTokenModalId);
  }, [inactiveModal]);

  return (
    <>
      <HomeContext.Provider value={{
        tokenGroupStructure,
        accountBalance
      }}
      >
        <div className={`home home-container ${className}`}>
          <Layout.Home
            onClickFilterIcon={onOpenCustomizeModal}
            onClickSearchIcon={onOpenGlobalSearchToken}
          >
            <Outlet />
          </Layout.Home>
        </div>
      </HomeContext.Provider>
      <CustomizeModal
        id={CustomizeModalId}
        onCancel={onCloseCustomizeModal}
      />
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
