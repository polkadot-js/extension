// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountJson, AccountsContext, AuthorizeRequest, Contact, GroupedContacts, MetadataRequest, SigningRequest } from '@polkadot/extension-base/background/types';
import type { SettingsStruct } from '@polkadot/ui-settings/types';

import _ from 'lodash';
import React, { useEffect, useState } from 'react';
import { Route, Switch } from 'react-router';

import { PHISHING_PAGE_REDIRECT } from '@polkadot/extension-base/defaults';
import { ContactsStore } from '@polkadot/extension-base/stores';
import { canDerive } from '@polkadot/extension-base/utils';
import uiSettings from '@polkadot/ui-settings';

import { ErrorBoundary, Loading } from '../components';
import { AccountContext, ActionContext, AuthorizeReqContext, ContactsContext, MediaContext, MetadataReqContext, SettingsContext, SigningReqContext } from '../components/contexts';
import ToastProvider from '../components/Toast/ToastProvider';
import { subscribeAccounts, subscribeAuthorizeRequests, subscribeMetadataRequests, subscribeSigningRequests } from '../messaging';
import { buildHierarchy } from '../util/buildHierarchy';
import AddContact from './Contacts/AddContact';
import Accounts from './Accounts';
import AuthList from './AuthManagement';
import Authorize from './Authorize';
import Contacts from './Contacts';
import CreateAccount from './CreateAccount';
import Derive from './Derive';
import Export from './Export';
import Forget from './Forget';
import ImportLedger from './ImportLedger';
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

/**
 * Format contacts struct:
 * [{ id: '', address: '', name: '', note: '', network: '' }, ...]
 * =>
 * {
 *    'A': [{ id: '', address: '', name: '', note: '', network: '' }, ...],
 *    'B': [{ id: '', address: '', name: '', note: '', network: '' }, ...],
 * }
 *  */

function initContacts (contacts: Contact[]): GroupedContacts {
  const sortedContacts = _.sortBy(contacts, ['name', 'id']);
  const groupedContacts = {};

  _.forEach(sortedContacts, (contact) => {
    const key = contact.name[0];

    if (Object.prototype.hasOwnProperty.call(groupedContacts, key)) {
      groupedContacts[key].push(contact);
    } else {
      groupedContacts[key] = [contact];
    }
  });

  return groupedContacts as GroupedContacts;
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
  const [contacts, setContacts] = useState<GroupedContacts>({});

  const _onAction = (to?: string): void => {
    setWelcomeDone(window.localStorage.getItem('welcome_read') === 'ok');

    if (to) {
      window.location.hash = to;
    }
  };

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

    ContactsStore.on('change', (newContacts): void => {
      setContacts(initContacts(newContacts));
    });

    _onAction();
  }, []);

  useEffect((): void => {
    setAccountCtx(initAccountContext(accounts || []));
  }, [accounts]);

  useEffect((): void => {
    // initContacts(ContactsStore.get());
    setContacts(initContacts(ContactsStore.get()));
  }, []);

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
          ? wrapWithErrorBoundary(<Signing/>, 'signing')
          : wrapWithErrorBoundary(<Accounts/>, 'accounts')
    : wrapWithErrorBoundary(<Welcome />, 'welcome');

  return (
    <Loading>{accounts && authRequests && metaRequests && signRequests && (
      <ActionContext.Provider value={_onAction}>
        <SettingsContext.Provider value={settingsCtx}>
          <AccountContext.Provider value={accountCtx}>
            <AuthorizeReqContext.Provider value={authRequests}>
              <MediaContext.Provider value={cameraOn && mediaAllowed}>
                <MetadataReqContext.Provider value={metaRequests}>
                  <SigningReqContext.Provider value={signRequests}>
                    <ContactsContext.Provider value={contacts}>
                      <ToastProvider>
                        <Switch>
                          <Route path='/auth-list'>{wrapWithErrorBoundary(<AuthList />, 'auth-list')}</Route>
                          <Route path='/contacts'>{wrapWithErrorBoundary(<Contacts />, 'contacts')}</Route>
                          <Route path='/add-contact'>{wrapWithErrorBoundary(<AddContact />, 'add-contact')}</Route>
                          <Route path='/account/create'>{wrapWithErrorBoundary(<CreateAccount />, 'account-creation')}</Route>
                          <Route path='/account/forget/:address'>{wrapWithErrorBoundary(<Forget />, 'forget-address')}</Route>
                          <Route path='/account/export/:address'>{wrapWithErrorBoundary(<Export />, 'export-address')}</Route>
                          <Route path='/account/import-ledger'>{wrapWithErrorBoundary(<ImportLedger />, 'import-ledger')}</Route>
                          <Route path='/account/import-qr'>{wrapWithErrorBoundary(<ImportQr />, 'import-qr')}</Route>
                          <Route path='/account/import-seed'>{wrapWithErrorBoundary(<ImportSeed />, 'import-seed')}</Route>
                          <Route path='/account/restore-json'>{wrapWithErrorBoundary(<RestoreJson />, 'restore-json')}</Route>
                          <Route path='/account/derive/:address/locked'>{wrapWithErrorBoundary(<Derive isLocked />, 'derived-address-locked')}</Route>
                          <Route path='/account/derive/:address'>{wrapWithErrorBoundary(<Derive />, 'derive-address')}</Route>
                          <Route path={`${PHISHING_PAGE_REDIRECT}/:website`}>{wrapWithErrorBoundary(<PhishingDetected />, 'phishing-page-redirect')}</Route>
                          <Route
                            exact
                            path='/'
                          >
                            {Root}
                          </Route>
                        </Switch>
                      </ToastProvider>
                    </ContactsContext.Provider>
                  </SigningReqContext.Provider>
                </MetadataReqContext.Provider>
              </MediaContext.Provider>
            </AuthorizeReqContext.Provider>
          </AccountContext.Provider>
        </SettingsContext.Provider>
      </ActionContext.Provider>
    )}</Loading>
  );
}
