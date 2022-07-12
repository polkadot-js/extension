// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { state } from '@subwallet/extension-koni-base/background/handlers';

export const onExtensionInstall = () => {
  state.onInstall();
};
