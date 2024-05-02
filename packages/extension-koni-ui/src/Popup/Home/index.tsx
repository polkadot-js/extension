// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CampaignBanner } from '@subwallet/extension-base/background/KoniTypes';
import { CampaignBannerModal, Layout } from '@subwallet/extension-koni-ui/components';
import { GlobalSearchTokenModal } from '@subwallet/extension-koni-ui/components/Modal/GlobalSearchTokenModal';
import { GeneralTermModal } from '@subwallet/extension-koni-ui/components/Modal/TermsAndConditions/GeneralTermModal';
import { CONFIRM_GENERAL_TERM, GENERAL_TERM_AND_CONDITION_MODAL, HOME_CAMPAIGN_BANNER_MODAL } from '@subwallet/extension-koni-ui/constants';
import { HomeContext } from '@subwallet/extension-koni-ui/contexts/screen/HomeContext';
import { useAccountBalance, useGetBannerByScreen, useGetChainSlugsByAccountType, useGetMantaPayConfig, useHandleMantaPaySync, useTokenGroup } from '@subwallet/extension-koni-ui/hooks';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { ModalContext } from '@subwallet/react-ui';
import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Outlet } from 'react-router';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

type Props = ThemeProps;

export const GlobalSearchTokenModalId = 'globalSearchToken';

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const chainsByAccountType = useGetChainSlugsByAccountType();
  const tokenGroupStructure = useTokenGroup(chainsByAccountType);
  const accountBalance = useAccountBalance(tokenGroupStructure.tokenGroupMap);
  const currentAccount = useSelector((state: RootState) => state.accountState.currentAccount);
  const [isConfirmedTermGeneral, setIsConfirmedTermGeneral] = useLocalStorage(CONFIRM_GENERAL_TERM, 'nonConfirmed');

  const mantaPayConfig = useGetMantaPayConfig(currentAccount?.address);
  const isZkModeSyncing = useSelector((state: RootState) => state.mantaPay.isSyncing);
  const handleMantaPaySync = useHandleMantaPaySync();

  const banners = useGetBannerByScreen('home');

  const firstBanner = useMemo((): CampaignBanner | undefined => banners[0], [banners]);

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
    if (mantaPayConfig && mantaPayConfig.enabled && !mantaPayConfig.isInitialSync && !isZkModeSyncing) {
      handleMantaPaySync(mantaPayConfig.address);
    }
  }, [handleMantaPaySync, isZkModeSyncing, mantaPayConfig]);

  useEffect(() => {
    if (firstBanner) {
      activeModal(HOME_CAMPAIGN_BANNER_MODAL);
    }
  }, [activeModal, firstBanner]);

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
        <div className={`home home-container ${className}`}>
          <Layout.Home
            onClickSearchIcon={onOpenGlobalSearchToken}
            showFilterIcon
            showSearchIcon
          >
            <Outlet />
            <GeneralTermModal onOk={onAfterConfirmTermModal} />
          </Layout.Home>
        </div>
      </HomeContext.Provider>

      <GlobalSearchTokenModal
        id={GlobalSearchTokenModalId}
        onCancel={onCloseGlobalSearchToken}
        sortedTokenSlugs={tokenGroupStructure.sortedTokenSlugs}
        tokenBalanceMap={accountBalance.tokenBalanceMap}
      />
      {firstBanner && <CampaignBannerModal banner={firstBanner} />}
    </>
  );
}

const Home = styled(Component)<Props>(({ theme: { token } }: Props) => {
  return ({
    height: '100%'
  });
});

export default Home;
