// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AccountJson, AuthorizeRequest, MetadataRequest, SigningRequest } from '@polkadot/extension-base/background/types';

import React, { useEffect, useState } from 'react';
import { Route, Switch } from 'react-router';
import settings from '@polkadot/ui-settings';
import { setSS58Format } from '@polkadot/util-crypto';

import { Loading } from '../components';
import { AccountContext, ActionContext, AuthorizeReqContext, MediaContext, MetadataReqContext, SigningReqContext } from '../components/contexts';
import { subscribeAccounts, subscribeAuthorizeRequests, subscribeMetadataRequests, subscribeSigningRequests } from '../messaging';
import Accounts from './Accounts';
import Authorize from './Authorize';
import CreateAccount from './CreateAccount';
import Derive from './Derive';
import Export from './Export';
import Forget from './Forget';
import ImportQr from './ImportQr';
import ImportSeed from './ImportSeed';
import Metadata from './Metadata';
import Signing from './Signing';
import Welcome from './Welcome';

// load the ui settings, actually only used for address prefix atm
// probably overkill (however can replace once we have actual others)
const { prefix } = settings.get();

// FIXME Duplicated in Settings, horrible...
setSS58Format(prefix === -1 ? 42 : prefix);

// Request permission for video, based on access we can hide/show import
async function requestMediaAccess (cameraOn: boolean): Promise<boolean> {
  if (!cameraOn) {
    return false;
  }

  try {
    await navigator.mediaDevices.getUserMedia({ video: true });

    return true;
  } catch (error) {
    console.error('Permission for video declined', error.message);
  }

  return false;
}

export default function Popup (): React.ReactElement<{}> {
  const [accounts, setAccounts] = useState<null | AccountJson[]>(null);
  const [authRequests, setAuthRequests] = useState<null | AuthorizeRequest[]>(null);
  const [cameraOn, setCameraOn] = useState(settings.get().camera === 'on');
  const [mediaAllowed, setMediaAllowed] = useState(false);
  const [metaRequests, setMetaRequests] = useState<null | MetadataRequest[]>(null);
  const [signRequests, setSignRequests] = useState<null | SigningRequest[]>(null);
  const [isWelcomeDone, setWelcomeDone] = useState(false);

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
    ]).catch((error: Error) => console.error(error));

    settings.on('change', ({ camera }): void => setCameraOn(camera === 'on'));

    _onAction();
  }, []);

  useEffect((): void => {
    requestMediaAccess(cameraOn).then(setMediaAllowed);
  }, [cameraOn]);

  const Root = isWelcomeDone
    ? authRequests && authRequests.length
      ? Authorize
      : metaRequests && metaRequests.length
        ? Metadata
        : signRequests && signRequests.length
          ? Signing
          : Accounts
    : Welcome;

  return (
    <Loading>{accounts && authRequests && metaRequests && signRequests && (
      <ActionContext.Provider value={_onAction}>
        <AccountContext.Provider value={accounts}>
          <AuthorizeReqContext.Provider value={authRequests}>
            <MediaContext.Provider value={cameraOn && mediaAllowed}>
              <MetadataReqContext.Provider value={metaRequests}>
                <SigningReqContext.Provider value={signRequests}>
                  <Switch>
                    <Route path='/account/create' component={CreateAccount} />
                    <Route path='/account/forget/:address' component={Forget} />
                    <Route path='/account/export/:address' component={Export} />
                    <Route path='/account/import-qr' component={ImportQr} />
                    <Route path='/account/import-seed' component={ImportSeed} />
                    <Route path='/account/derive/:address' component={Derive} />
                  <Route exact path='/' component={Root} />
                  </Switch>
                </SigningReqContext.Provider>
              </MetadataReqContext.Provider>
            </MediaContext.Provider>
          </AuthorizeReqContext.Provider>
        </AccountContext.Provider>
      </ActionContext.Provider>
    )}</Loading>
  );
}
