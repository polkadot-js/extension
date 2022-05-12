// Copyright 2019-2022 @subwallet/web-runner authors & contributors
// SPDX-License-Identifier: Apache-2.0

import '@subwallet/extension-inject/crossenv';

import { AccountsStore } from '@subwallet/extension-base/stores';
import { KoniCron } from '@subwallet/extension-koni-base/background/cron';
import { KoniSubcription } from '@subwallet/extension-koni-base/background/subscription';

import keyring from '@polkadot/ui-keyring';
import { cryptoWaitReady } from '@polkadot/util-crypto';

import { PageStatus, responseMessage, setupHandlers } from './messageHandle';

responseMessage({ id: '0', response: { status: 'load' } } as PageStatus);

setupHandlers();

// initial setup
cryptoWaitReady()
  .then((): void => {
    console.log('crypto initialized');

    // load all the keyring data
    keyring.loadAll({ store: new AccountsStore(), type: 'sr25519' });

    // Init subcription
    const subscriptions = new KoniSubcription();

    subscriptions.init();

    // Init cron
    new KoniCron(subscriptions).init();

    responseMessage({ id: '0', response: { status: 'crypto_ready' } } as PageStatus);

    console.log('initialization completed');
  })
  .catch((error): void => {
    console.error('initialization failed', error);
  });
