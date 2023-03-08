// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type {
  AccountJson,
  AccountsContext,
  AuthorizeRequest,
  MetadataRequest,
  SigningRequest
} from '@polkadot/extension-base/background/types';
import type { SettingsStruct } from '@polkadot/ui-settings/types';

import React, { useCallback, useEffect, useState } from 'react';
import { Route, Switch, useHistory } from 'react-router';

import { PHISHING_PAGE_REDIRECT } from '@polkadot/extension-base/defaults';
import { canDerive } from '@polkadot/extension-base/utils';
import uiSettings from '@polkadot/ui-settings';

import { ErrorBoundary, Loading, SplashHandler } from '../components';
import {
  AccountContext,
  ActionContext,
  AuthorizeReqContext,
  MediaContext,
  MetadataReqContext,
  SettingsContext,
  SigningReqContext
} from '../components/contexts';
import ToastProvider from '../components/Toast/ToastProvider';
import {
  subscribeAccounts,
  subscribeAuthorizeRequests,
  subscribeMetadataRequests,
  subscribeSigningRequests
} from '../messaging';
import { buildHierarchy } from '../util/buildHierarchy';
import AddAccountMenu from './Accounts/AddAccountMenu';
import EditAccountMenu from './Accounts/EditAccountMenu';
import EditName from './Accounts/EditName';
import EditNetwork from './Accounts/EditNetwork';
import AccountManagement from './AuthManagement/AccountManagement';
import RestoreJson from './Restore/RestoreJson';
import TransactionStatus from './Signing/TransactionStatus';
import About from './About';
import Accounts from './Accounts';
import AuthList from './AuthManagement';
import Authorize from './Authorize';
import CreateAccount from './CreateAccount';
import Derive from './Derive';
import Export from './Export';
import ExportAll from './ExportAll';
import Forget from './Forget';
import Help from './Help';
import ImportLedger from './ImportLedger';
import ImportQr from './ImportQr';
import ImportSeed from './ImportSeed';
import Metadata from './Metadata';
import PhishingDetected from './PhishingDetected';
import Settings from './Settings';
import Signing from './Signing';
import Welcome from './Welcome';

const startSettings = uiSettings.get();

// Request permission for video, based on access we can hide/show import
async function requestMediaAccess(cameraOn: boolean): Promise<boolean> {
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

function initAccountContext({
  accounts,
  selectedAccounts,
  setSelectedAccounts
}: Omit<AccountsContext, 'hierarchy' | 'master'>): AccountsContext {
  const hierarchy = buildHierarchy(accounts);
  const master = hierarchy.find(({ isExternal, type }) => !isExternal && canDerive(type));

  return {
    accounts,
    hierarchy,
    master,
    selectedAccounts,
    setSelectedAccounts
  };
}

export default function Popup(): React.ReactElement {
  const [accounts, setAccounts] = useState<null | AccountJson[]>(null);
  const [accountCtx, setAccountCtx] = useState<AccountsContext>({ accounts: [], hierarchy: [] });
  const [selectedAccounts, setSelectedAccounts] = useState<AccountJson['address'][]>([]);
  const [authRequests, setAuthRequests] = useState<null | AuthorizeRequest[]>(null);
  const [cameraOn, setCameraOn] = useState(startSettings.camera === 'on');
  const [mediaAllowed, setMediaAllowed] = useState(false);
  const [metaRequests, setMetaRequests] = useState<null | MetadataRequest[]>(null);
  const [signRequests, setSignRequests] = useState<null | SigningRequest[]>(null);
  const [isWelcomeDone, setWelcomeDone] = useState(false);
  const [settingsCtx, setSettingsCtx] = useState<SettingsStruct>(startSettings);
  const history = useHistory();

  const _onAction = useCallback(
    (to?: string): void => {
      setWelcomeDone(window.localStorage.getItem('welcome_read') === 'ok');

      if (!to) {
        return;
      }

      to === '..'
        ? // if we can't go gack from there, go to the home
          history.length === 1
          ? history.push('/')
          : history.goBack()
        : (window.location.hash = to);
    },
    [history]
  );

  useEffect((): void => {
    Promise.all([
      subscribeAccounts(setAccounts),
      subscribeAuthorizeRequests(setAuthRequests),
      subscribeMetadataRequests(setMetaRequests),
      subscribeSigningRequests(setSignRequests)
    ]).catch(console.error);

    uiSettings.on('change', (settings): void => {
      setSettingsCtx(settings);
      setCameraOn(settings.camera === 'on');
    });

    _onAction();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect((): void => {
    setAccountCtx(initAccountContext({ accounts: accounts || [], selectedAccounts, setSelectedAccounts }));
  }, [accounts, selectedAccounts]);

  useEffect((): void => {
    requestMediaAccess(cameraOn).then(setMediaAllowed).catch(console.error);
  }, [cameraOn]);

  function wrapWithErrorBoundary(component: React.ReactElement, trigger?: string): React.ReactElement {
    return <ErrorBoundary trigger={trigger}>{component}</ErrorBoundary>;
  }

  const Root = isWelcomeDone
    ? authRequests && authRequests.length
      ? wrapWithErrorBoundary(<Authorize />, 'authorize')
      : metaRequests && metaRequests.length
      ? wrapWithErrorBoundary(<Metadata />, 'metadata')
      : signRequests && signRequests.length
      ? wrapWithErrorBoundary(<Signing />, 'signing')
      : wrapWithErrorBoundary(<Accounts />, 'accounts')
    : wrapWithErrorBoundary(<Welcome />, 'welcome');

  return (
    <Loading>
      {accounts && authRequests && metaRequests && signRequests && (
        <ActionContext.Provider value={_onAction}>
          <SettingsContext.Provider value={settingsCtx}>
            <AccountContext.Provider value={accountCtx}>
              <AuthorizeReqContext.Provider value={authRequests}>
                <MediaContext.Provider value={cameraOn && mediaAllowed}>
                  <MetadataReqContext.Provider value={metaRequests}>
                    <SigningReqContext.Provider value={signRequests}>
                      <ToastProvider>
                        <SplashHandler>
                          <Switch>
                            <Route path='/auth-list'>{wrapWithErrorBoundary(<AuthList />, 'auth-list')}</Route>
                            <Route path='/about'>{wrapWithErrorBoundary(<About />, 'about')}</Route>
                            <Route path='/help'>{wrapWithErrorBoundary(<Help />, 'help')}</Route>
                            <Route path='/account/settings'>{wrapWithErrorBoundary(<Settings />, 'settings')}</Route>
                            <Route path='/account/add-menu'>
                              {wrapWithErrorBoundary(<AddAccountMenu />, 'adding-account-menu')}
                            </Route>
                            <Route path='/account/create'>
                              {wrapWithErrorBoundary(<CreateAccount />, 'account-creation')}
                            </Route>
                            <Route path='/account/edit-menu/:address'>
                              {wrapWithErrorBoundary(<EditAccountMenu />, 'edit-menu')}
                            </Route>
                            <Route path='/transaction-status/:status'>
                              {wrapWithErrorBoundary(<TransactionStatus />, 'transaction-status')}
                            </Route>
                            <Route path='/account/edit-name/:address'>
                              {wrapWithErrorBoundary(<EditName />, 'edit-name')}
                            </Route>
                            <Route path='/account/edit-network/:address'>
                              {wrapWithErrorBoundary(<EditNetwork />, 'edit-network')}
                            </Route>
                            <Route path='/account/forget/:address'>
                              {wrapWithErrorBoundary(<Forget />, 'forget-address')}
                            </Route>
                            <Route path='/account/export/:address'>
                              {wrapWithErrorBoundary(<Export />, 'export-address')}
                            </Route>
                            <Route path='/account/export-all'>
                              {wrapWithErrorBoundary(<ExportAll />, 'export-all-address')}
                            </Route>
                            <Route path='/account/import-ledger'>
                              {wrapWithErrorBoundary(<ImportLedger />, 'import-ledger')}
                            </Route>
                            <Route path='/account/import-qr'>{wrapWithErrorBoundary(<ImportQr />, 'import-qr')}</Route>
                            <Route path='/account/import-seed'>
                              {wrapWithErrorBoundary(<ImportSeed />, 'import-seed')}
                            </Route>
                            <Route path='/account/restore-json'>
                              {wrapWithErrorBoundary(<RestoreJson />, 'restore-json')}
                            </Route>
                            <Route path='/account/derive/:address/locked'>
                              {wrapWithErrorBoundary(<Derive isLocked />, 'derived-address-locked')}
                            </Route>
                            <Route path='/account/derive/:address'>
                              {wrapWithErrorBoundary(<Derive />, 'derive-address')}
                            </Route>
                            <Route path='/url/manage'>
                              {wrapWithErrorBoundary(<AccountManagement />, 'manage-url')}
                            </Route>
                            <Route path={`${PHISHING_PAGE_REDIRECT}/:website`}>
                              {wrapWithErrorBoundary(<PhishingDetected />, 'phishing-page-redirect')}
                            </Route>
                            <Route
                              exact
                              path='/'
                            >
                              {Root}
                            </Route>
                          </Switch>
                        </SplashHandler>
                      </ToastProvider>
                    </SigningReqContext.Provider>
                  </MetadataReqContext.Provider>
                </MediaContext.Provider>
              </AuthorizeReqContext.Provider>
            </AccountContext.Provider>
          </SettingsContext.Provider>
        </ActionContext.Provider>
      )}
    </Loading>
  );
}
