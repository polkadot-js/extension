// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountJson, AccountsContext, AuthorizeRequest, MetadataRequest, SigningRequest } from '@polkadot/extension-base/background/types';
import type { SettingsStruct } from '@polkadot/ui-settings/types';

import * as Bowser from 'bowser';
import React, { useCallback, useEffect, useState } from 'react';
import { Provider } from 'react-redux';
import { Route, Switch } from 'react-router';

import { AccountsWithCurrentAddress } from '@polkadot/extension-base/background/KoniTypes';
import { PHISHING_PAGE_REDIRECT } from '@polkadot/extension-base/defaults';
import { canDerive } from '@polkadot/extension-base/utils';
import LoadingContainer from '@polkadot/extension-koni-ui/components/LoadingContainer';
import useSetupStore from '@polkadot/extension-koni-ui/hooks/store/useSetupStore';
import Donate from '@polkadot/extension-koni-ui/Popup/Sending/old/Donate';
import SendFund from '@polkadot/extension-koni-ui/Popup/Sending/old/SendFund';
import Settings from '@polkadot/extension-koni-ui/Popup/Settings';
import uiSettings from '@polkadot/ui-settings';

import { ErrorBoundary } from '../components';
import { AccountContext, ActionContext, AuthorizeReqContext, MediaContext, MetadataReqContext, SettingsContext, SigningReqContext } from '../components/contexts';
import ToastProvider from '../components/Toast/ToastProvider';
import { saveCurrentAccountAddress, subscribeAccountsWithCurrentAddress, subscribeAuthorizeRequests, subscribeMetadataRequests, subscribeSigningRequests } from '../messaging';
import { store } from '../stores';
import { buildHierarchy } from '../util/buildHierarchy';
import AuthList from './AuthManagement';
import Authorize from './Authorize';
import CreateAccount from './CreateAccount';
import Derive from './Derive';
import Export from './Export';
import ExportAll from './ExportAll';
import Forget from './Forget';
import Home from './Home';
import ImportQr from './ImportQr';
import ImportSeed from './ImportSeed';
import Metadata from './Metadata';
import PhishingDetected from './PhishingDetected';
import RestoreJson from './RestoreJson';
import Signing from './Signing';
import Welcome from './Welcome';

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

function updateCurrentAccount (currentAcc: AccountJson): void {
  store.dispatch({ type: 'currentAccount/update', payload: currentAcc });
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
        saveCurrentAccountAddress(selectedAcc.address).then(() => {
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
      subscribeAuthorizeRequests(setAuthRequests),
      subscribeMetadataRequests(setMetaRequests),
      subscribeSigningRequests(setSignRequests)
    ]).catch(console.error);

    uiSettings.on('change', (settings): void => {
      setSettingsCtx(settings);
      setCameraOn(settings.camera === 'on');
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
                        <Switch>
                          <Route path='/auth-list'>{wrapWithErrorBoundary(<AuthList />, 'auth-list')}</Route>
                          <Route path='/account/create'>{wrapWithErrorBoundary(<CreateAccount />, 'account-creation')}</Route>
                          <Route path='/account/forget/:address'>{wrapWithErrorBoundary(<Forget />, 'forget-address')}</Route>
                          <Route path='/account/export/:address'>{wrapWithErrorBoundary(<Export />, 'export-address')}</Route>
                          <Route path='/account/export-all'>{wrapWithErrorBoundary(<ExportAll />, 'export-all-address')}</Route>
                          <Route path='/account/import-qr'>{wrapWithErrorBoundary(<ImportQr />, 'import-qr')}</Route>
                          <Route path='/account/import-seed'>{wrapWithErrorBoundary(<ImportSeed />, 'import-seed')}</Route>
                          <Route path='/account/restore-json'>{wrapWithErrorBoundary(<RestoreJson />, 'restore-json')}</Route>
                          <Route path='/account/derive/:address/locked'>{wrapWithErrorBoundary(<Derive isLocked />, 'derived-address-locked')}</Route>
                          <Route path='/account/derive/:address'>{wrapWithErrorBoundary(<Derive />, 'derive-address')}</Route>
                          <Route path='/account/settings'>{wrapWithErrorBoundary(<Settings />, 'account-settings')}</Route>
                          <Route path='/account/send-fund'>{wrapWithErrorBoundary(<SendFund />, 'send-fund')}</Route>
                          <Route path='/account/donate'>{wrapWithErrorBoundary(<Donate />, 'donate')}</Route>
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
