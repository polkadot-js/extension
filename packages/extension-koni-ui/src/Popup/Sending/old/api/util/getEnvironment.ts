// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Environment } from '../types';

// https://github.com/electron/electron/issues/2288
function isElectron () {
  if (process?.versions?.electron) {
    return true;
  }

  // @ts-ignore
  if (window?.process?.type === 'renderer') {
    return true;
  }

  return navigator?.userAgent?.indexOf('Electron') >= 0;
}

export default function getEnvironment (): Environment {
  if (isElectron()) {
    return 'app';
  }

  return 'web';
}
