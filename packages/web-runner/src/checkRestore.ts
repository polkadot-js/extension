// Copyright 2019-2022 @subwallet/web-runner authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { mobile } from '@subwallet/extension-base/koni/background/handlers';
import { PageStatus, responseMessage } from '@subwallet/web-runner/messageHandle';

export async function checkRestore (): Promise<void> {
  return new Promise((resolve) => {
    const needRestore = !localStorage.getItem('keyring:subwallet');

    if (needRestore) {
      responseMessage({ id: '0', response: { status: 'require_restore' } } as PageStatus);
      mobile.waitRestore()
        .catch((err) => console.warn(err))
        .finally(() => {
          resolve();
        });
    } else {
      resolve();
    }
  });
}
