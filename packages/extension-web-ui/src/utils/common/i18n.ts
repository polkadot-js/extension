// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import i18n from '@subwallet/extension-web-ui/i18n/i18n';

export const i18nPromise = new Promise<boolean>((resolve) => {
  i18n.on('loaded', () => {
    resolve(true);
  });
});
