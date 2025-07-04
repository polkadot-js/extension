// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

/* global chrome */

import '@polkadot/extension-mocks/chrome';

import type * as _ from '@polkadot/dev-test/globals.d.ts';

import { wakeUpServiceWorkerWrapper } from '../../extension-base/src/utils/portUtils.js';
import { exportAccount } from './messaging.js';

describe('messaging sends message to background via extension port for', () => {
  beforeEach(() => {
    jest.spyOn(wakeUpServiceWorkerWrapper, 'wakeUpServiceWorker').mockImplementation(() => Promise.resolve({ status: 'awake' }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('exportAccount', async () => {
    const callback = jest.fn();

    chrome.runtime.connect().onMessage.addListener(callback);

    try {
      await exportAccount('HjoBp62cvsWDA3vtNMWxz6c9q13ReEHi9UGHK7JbZweH5g5', 'passw0rd');
    } catch (error) {
      console.error(error);
    }

    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'pri(accounts.export)',
        request: { address: 'HjoBp62cvsWDA3vtNMWxz6c9q13ReEHi9UGHK7JbZweH5g5', password: 'passw0rd' }
      })
    );
  });
});
