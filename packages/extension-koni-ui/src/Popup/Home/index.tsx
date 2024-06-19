// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Layout } from '@subwallet/extension-koni-ui/components';
import { GlobalSearchTokenModal } from '@subwallet/extension-koni-ui/components/Modal/GlobalSearchTokenModal';
import RemindUpgradeFirefoxVersion from '@subwallet/extension-koni-ui/components/Modal/RemindUpgradeFirefoxVersion';
import { GeneralTermModal } from '@subwallet/extension-koni-ui/components/Modal/TermsAndConditions/GeneralTermModal';
import { CONFIRM_GENERAL_TERM, DEFAULT_SESSION_VALUE, GENERAL_TERM_AND_CONDITION_MODAL, HOME_CAMPAIGN_BANNER_MODAL, LATEST_SESSION, REMIND_BACKUP_SEED_PHRASE_MODAL, REMIND_UPGRADE_FIREFOX_VERSION } from '@subwallet/extension-koni-ui/constants';
import { AppOnlineContentContext } from '@subwallet/extension-koni-ui/contexts/AppOnlineContentProvider';
import { HomeContext } from '@subwallet/extension-koni-ui/contexts/screen/HomeContext';
import { useAccountBalance, useGetChainSlugsByAccountType, useGetMantaPayConfig, useHandleMantaPaySync, useSetSessionLatest, useTokenGroup, useUpgradeFireFoxVersion } from '@subwallet/extension-koni-ui/hooks';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { RemindBackUpSeedPhraseParamState, SessionStorage, ThemeProps } from '@subwallet/extension-koni-ui/types';
import { isFirefox } from '@subwallet/extension-koni-ui/utils';
import { ModalContext } from '@subwallet/react-ui';
import React, { useCallback, useContext, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { Outlet } from 'react-router';
import { useLocation } from 'react-router-dom';
import styled from 'styled-components';
import { useLocalStorage } from 'usehooks-ts';

type Props = ThemeProps;

export const GlobalSearchTokenModalId = 'globalSearchToken';
const historyPageIgnoreRemind = 'ignoreRemind';
const historyPageIgnoreBanner = 'ignoreBanner';

function Component ({ className = '' }: Props): React.ReactElement<Props> {
  const { activeModal, inactiveModal } = useContext(ModalContext);
  const chainsByAccountType = useGetChainSlugsByAccountType();
  const tokenGroupStructure = useTokenGroup(chainsByAccountType);
  const location = useLocation();
  const accountBalance = useAccountBalance(tokenGroupStructure.tokenGroupMap);
  const currentAccount = useSelector((state: RootState) => state.accountState.currentAccount);
  const [isConfirmedTermGeneral, setIsConfirmedTermGeneral] = useLocalStorage(CONFIRM_GENERAL_TERM, 'nonConfirmed');
  const { isNeedUpgradeVersion } = useUpgradeFireFoxVersion();
  const { showAppPopup } = useContext(AppOnlineContentContext);

  const mantaPayConfig = useGetMantaPayConfig(currentAccount?.address);
  const isZkModeSyncing = useSelector((state: RootState) => state.mantaPay.isSyncing);
  const handleMantaPaySync = useHandleMantaPaySync();
  const remindBackUpShowed = useRef<boolean>(false);
  const showAppPopupFunc = useRef<(currentRoute: string | undefined) => void>(showAppPopup);

  const { sessionLatest } = useSetSessionLatest();

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
    showAppPopupFunc.current = showAppPopup;
  }, [showAppPopup]);

  useEffect(() => {
    const isFromIgnorePage = location.state as RemindBackUpSeedPhraseParamState;
    const sessionLatestInit = (JSON.parse(localStorage.getItem(LATEST_SESSION) || JSON.stringify(DEFAULT_SESSION_VALUE))) as SessionStorage;

    const handleOpenBanner = () => {
      if (!sessionLatestInit.remind && isFromIgnorePage?.from !== historyPageIgnoreBanner) {
        showAppPopupFunc.current(location.pathname);
      }
    };

    if (isFirefox()) {
      isNeedUpgradeVersion().then((rs) => {
        if (rs) {
          activeModal(REMIND_UPGRADE_FIREFOX_VERSION);
        } else {
          handleOpenBanner();
        }
      })
        .catch(console.error);
    } else {
      handleOpenBanner();
    }
  }, [activeModal, isNeedUpgradeVersion, location]);

  useEffect(() => {
    // Run remind backup seed phrase one time
    if (!remindBackUpShowed.current) {
      const infoSession = Date.now();

      const isFromIgnorePage = location.state as RemindBackUpSeedPhraseParamState;

      if (infoSession - sessionLatest.timeCalculate > sessionLatest.timeBackup &&
        sessionLatest.remind &&
        (isFromIgnorePage?.from !== historyPageIgnoreRemind)) {
        inactiveModal(HOME_CAMPAIGN_BANNER_MODAL);
        activeModal(REMIND_BACKUP_SEED_PHRASE_MODAL);
        remindBackUpShowed.current = true;
      }
    }
  }, [activeModal, inactiveModal, location, sessionLatest]);

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
            <RemindUpgradeFirefoxVersion />
          </Layout.Home>
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
