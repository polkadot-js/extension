// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SessionStorage } from '@subwallet/extension-koni-ui/types';

export const DEFAULT_SESSION_VALUE: SessionStorage = {
  remind: false,
  timeBackup: 1209600000,
  timeCalculate: Date.now(),
  isFinished: true
};
