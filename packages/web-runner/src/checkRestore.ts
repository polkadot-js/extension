// Copyright 2019-2022 @subwallet/web-runner authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { mobile } from '@subwallet/extension-base/koni/background/handlers';
import { isWebRunnerDataReset } from '@subwallet/extension-base/koni/background/handlers/Mobile';

import { PageStatus, responseMessage } from './messageHandle';

export async function checkRestore (): Promise<void> {
  const needRestore = await isWebRunnerDataReset();

  return new Promise((resolve) => {
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
