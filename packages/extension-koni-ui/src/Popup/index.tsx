// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountJson, AccountsContext, AuthorizeRequest, MetadataRequest, SigningRequest } from '@subwallet/extension-base/background/types';
import type { SettingsStruct } from '@polkadot/ui-settings/types';

import { AccountsWithCurrentAddress, CurrentAccountInfo } from '@subwallet/extension-base/background/KoniTypes';
import { PHISHING_PAGE_REDIRECT } from '@subwallet/extension-base/defaults';
import { canDerive } from '@subwallet/extension-base/utils';
import useSetupStore from '@subwallet/extension-koni-ui/hooks/store/useSetupStore';
import Home from '@subwallet/extension-koni-ui/Popup/Home';
import XcmTransfer from '@subwallet/extension-koni-ui/Popup/XcmTransfer/XcmTransfer';
import { updateCurrentAccount } from '@subwallet/extension-koni-ui/stores/updater';
import * as Bowser from 'bowser';
import React, { useCallback, useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { Route, Switch } from 'react-router';

import uiSettings from '@polkadot/ui-settings';

import { AccountContext, ActionContext, AuthorizeReqContext, MediaContext, MetadataReqContext, SettingsContext, SigningReqContext } from '../components/contexts';
import ToastProvider from '../components/Toast/ToastProvider';
import { saveCurrentAccountAddress, subscribeAccountsWithCurrentAddress, subscribeAuthorizeRequestsV2, subscribeMetadataRequests, subscribeSigningRequests } from '../messaging';
import { store } from '../stores';
import { buildHierarchy } from '../util/buildHierarchy';

const EvmTokenEdit = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Settings/TokenSetting/EvmTokenEdit'));
const EvmTokenSetting = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Settings/TokenSetting/EvmTokenSetting'));
const Welcome = React.lazy(() => import('./Welcome'));
const Signing = React.lazy(() => import('./Signing'));
const RestoreJson = React.lazy(() => import('./RestoreJson'));
const PhishingDetected = React.lazy(() => import('./PhishingDetected'));
const Metadata = React.lazy(() => import('./Metadata'));
const ImportSeed = React.lazy(() => import('./ImportSeed'));
const ImportQr = React.lazy(() => import('./ImportQr'));
const ImportMetamaskPrivateKey = React.lazy(() => import('./ImportMetamaskPrivateKey'));
const Forget = React.lazy(() => import('./Forget'));
const Export = React.lazy(() => import('./Export'));
const Derive = React.lazy(() => import('./Derive'));
const CreateAccount = React.lazy(() => import('./CreateAccount'));
const Authorize = React.lazy(() => import('./Authorize'));
const AuthList = React.lazy(() => import('./AuthManagement'));
const LoadingContainer = React.lazy(() => import('@subwallet/extension-koni-ui/components/LoadingContainer'));
const TransferNftContainer = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Home/Nfts/transfer/TransferNftContainer'));
const ImportLedger = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/ImportLedger'));
const ImportEvmNft = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/ImportToken/ImportEvmNft'));
const ImportEvmToken = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/ImportToken/ImportEvmToken'));
const SendFund = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Sending/SendFund'));
const Settings = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Settings'));
const GeneralSetting = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Settings/GeneralSetting'));
const NetworkCreate = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Settings/NetworkSettings/NetworkEdit'));
const Networks = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Settings/NetworkSettings/Networks'));
const Rendering = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Rendering'));
const Donate = React.lazy(() => import('@subwallet/extension-koni-ui/Popup/Sending/Donate'));
const ErrorBoundary = React.lazy(() => import('../components/ErrorBoundary'));

const startSettings = uiSettings.get();

// Request permission for video, based on access we can hide/show import
async function requestMediaAccess (cameraOn: boolean): Promise<boolean> {
  if (!cameraOn) {
    return false;
  }

  try {
    await navigator.mediaDevices.getUserMedia({ video: true });

    return true;
  } catch (error) {
    console.error('Permission for video declined', (error as Error).message);
  }

  return false;
}

function initAccountContext (accounts: AccountJson[]): AccountsContext {
  const hierarchy = buildHierarchy(accounts);
  const master = hierarchy.find(({ isExternal, type }) => !isExternal && canDerive(type));

  return {
    accounts,
    hierarchy,
    master
  };
}

const VARIANTS = ['beam', 'marble', 'pixel', 'sunset', 'bauhaus', 'ring'];

function getRandomVariant (): string {
  const random = Math.floor(Math.random() * 6);

  return VARIANTS[random];
}

export default function Popup (): React.ReactElement {
  const [accounts, setAccounts] = useState<null | AccountJson[]>(null);
  const [accountCtx, setAccountCtx] = useState<AccountsContext>({ accounts: [], hierarchy: [] });
  const [authRequests, setAuthRequests] = useState<null | AuthorizeRequest[]>(null);
  const [cameraOn, setCameraOn] = useState(startSettings.camera === 'on');
  const [mediaAllowed, setMediaAllowed] = useState(false);
  const [metaRequests, setMetaRequests] = useState<null | MetadataRequest[]>(null);
  const [signRequests, setSignRequests] = useState<null | SigningRequest[]>(null);
  const [isWelcomeDone, setWelcomeDone] = useState(false);
  const [settingsCtx, setSettingsCtx] = useState<SettingsStruct>(startSettings);
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

  const _onAction = useCallback(
    (to?: string): void => {
      setWelcomeDone(window.localStorage.getItem('welcome_read') === 'ok');

      if (to) {
        window.location.hash = to;
      }
    },
    []
  );

  // @ts-ignore
  const handleGetAccountsWithCurrentAddress = (data: AccountsWithCurrentAddress) => {
    const { accounts, currentAddress } = data;

    setAccounts(accounts);

    if (accounts && accounts.length) {
      let selectedAcc = accounts.find((acc) => acc.address === currentAddress);

      if (!selectedAcc) {
        selectedAcc = accounts[0];
        const accountInfo = {
          address: selectedAcc.address
        } as CurrentAccountInfo;

        saveCurrentAccountAddress(accountInfo, () => {
          updateCurrentAccount(selectedAcc as AccountJson);
        }).catch((e) => {
          console.error('There is a problem when set Current Account', e);
        });
      } else {
        updateCurrentAccount(selectedAcc);
      }
    }
  };

  useEffect((): void => {
    setWelcomeDone(window.localStorage.getItem('welcome_read') === 'ok');
    const beforeNav = window.localStorage.getItem('popupNavigation');

    if (beforeNav) {
      if ((authRequests && authRequests.length) ||
        (metaRequests && metaRequests.length) ||
        (signRequests && signRequests.length)) {
        window.location.hash = '/';
      } else {
        window.location.hash = beforeNav;
      }
    }
  }, [authRequests, metaRequests, signRequests]);

  useEffect((): void => {
    Promise.all([
      // subscribeAccounts(setAccounts),
      subscribeAccountsWithCurrentAddress(handleGetAccountsWithCurrentAddress),
      subscribeAuthorizeRequestsV2(setAuthRequests),
      subscribeMetadataRequests(setMetaRequests),
      subscribeSigningRequests(setSignRequests)
    ]).catch(console.error);

    uiSettings.on('change', (settings): void => {
      setSettingsCtx(settings);
      setCameraOn(settings.camera === 'on');
    });
  }, []);

  useSetupStore();

  useEffect((): void => {
    setAccountCtx(initAccountContext(accounts || []));
  }, [accounts]);

  useEffect((): void => {
    requestMediaAccess(cameraOn)
      .then(setMediaAllowed)
      .catch(console.error);
  }, [cameraOn]);

  function wrapWithErrorBoundary (component: React.ReactElement, trigger?: string): React.ReactElement {
    return <ErrorBoundary trigger={trigger}>{component}</ErrorBoundary>;
  }

  const Root = isWelcomeDone
    ? authRequests && authRequests.length
      ? wrapWithErrorBoundary(<Authorize />, 'authorize')
      : metaRequests && metaRequests.length
        ? wrapWithErrorBoundary(<Metadata />, 'metadata')
        : signRequests && signRequests.length
          ? wrapWithErrorBoundary(<Signing />, 'signing')
          : wrapWithErrorBoundary(<Home />, 'Home')
    : wrapWithErrorBoundary(<Welcome />, 'welcome');

  return (
    <LoadingContainer>{accounts && authRequests && metaRequests && signRequests && (
      <Provider store={store}>
        <ActionContext.Provider value={_onAction}><div id='tooltips' />
          <SettingsContext.Provider value={settingsCtx}>
            <AccountContext.Provider value={accountCtx}>
              <AuthorizeReqContext.Provider value={authRequests}>
                <MediaContext.Provider value={cameraOn && mediaAllowed}>
                  <MetadataReqContext.Provider value={metaRequests}>
                    <SigningReqContext.Provider value={signRequests}>
                      <ToastProvider>
                        <Rendering />
                        <Switch>
                          <Route path='/auth-list'>{wrapWithErrorBoundary(<AuthList />, 'auth-list')}</Route>
                          <Route path='/account/create'>{wrapWithErrorBoundary(<CreateAccount />, 'account-creation')}</Route>
                          <Route path='/account/forget/:address'>{wrapWithErrorBoundary(<Forget />, 'forget-address')}</Route>
                          <Route path='/account/export/:address'>{wrapWithErrorBoundary(<Export />, 'export-address')}</Route>
                          {/* <Route path='/account/export-all'>{wrapWithErrorBoundary(<ExportAll />, 'export-all-address')}</Route> */}
                          <Route path='/account/import-ledger'>{wrapWithErrorBoundary(<ImportLedger />, 'import-ledger')}</Route>
                          <Route path='/account/import-qr'>{wrapWithErrorBoundary(<ImportQr />, 'import-qr')}</Route>
                          <Route path='/account/import-seed'>{wrapWithErrorBoundary(<ImportSeed />, 'import-seed')}</Route>
                          <Route path='/account/import-metamask-private-key'>{wrapWithErrorBoundary(<ImportMetamaskPrivateKey />, 'import-metamask-private-key')}</Route>
                          <Route path='/account/restore-json'>{wrapWithErrorBoundary(<RestoreJson />, 'restore-json')}</Route>
                          <Route path='/account/derive/:address/locked'>{wrapWithErrorBoundary(<Derive isLocked />, 'derived-address-locked')}</Route>
                          <Route path='/account/derive/:address'>{wrapWithErrorBoundary(<Derive />, 'derive-address')}</Route>
                          <Route path='/account/settings'>{wrapWithErrorBoundary(<Settings />, 'account-settings')}</Route>
                          <Route path='/account/general-setting'>{wrapWithErrorBoundary(<GeneralSetting />, 'account-general-settings')}</Route>
                          <Route path='/account/networks'>{wrapWithErrorBoundary(<Networks />, 'account-networks')}</Route>
                          <Route path='/account/config-network'>{wrapWithErrorBoundary(<NetworkCreate />, 'account-network-edit')}</Route>
                          <Route path='/account/xcm-transfer'>{wrapWithErrorBoundary(<XcmTransfer />, 'xcm-transfer')}</Route>
                          <Route path='/account/send-fund'>{wrapWithErrorBoundary(<SendFund />, 'send-fund')}</Route>
                          <Route path='/account/donate'>{wrapWithErrorBoundary(<Donate />, 'donate')}</Route>
                          <Route path='/account/send-nft'>{wrapWithErrorBoundary(<TransferNftContainer />, 'send-nft')}</Route>
                          <Route path='/account/import-evm-token'>{wrapWithErrorBoundary(<ImportEvmToken />, 'import-evm-token')}</Route>
                          <Route path='/account/import-evm-nft'>{wrapWithErrorBoundary(<ImportEvmNft />, 'import-evm-nft')}</Route>
                          <Route path='/account/evm-token-setting'>{wrapWithErrorBoundary(<EvmTokenSetting />, 'evm-token-setting')}</Route>
                          <Route path='/account/evm-token-edit'>{wrapWithErrorBoundary(<EvmTokenEdit />, 'evm-token-edit')}</Route>
                          <Route path={`${PHISHING_PAGE_REDIRECT}/:website`}>{wrapWithErrorBoundary(<PhishingDetected />, 'phishing-page-redirect')}</Route>
                          <Route
                            exact
                            path='/'
                          >
                            {Root}
                          </Route>
                        </Switch>
                      </ToastProvider>
                    </SigningReqContext.Provider>
                  </MetadataReqContext.Provider>
                </MediaContext.Provider>
              </AuthorizeReqContext.Provider>
            </AccountContext.Provider>
          </SettingsContext.Provider>
        </ActionContext.Provider>
      </Provider>
    )}</LoadingContainer>
  );
}
