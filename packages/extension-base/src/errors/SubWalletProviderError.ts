// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SubWalletProviderErrorInterface } from '@subwallet/extension-base/background/KoniTypes';

export class SubWalletProviderError extends Error implements SubWalletProviderErrorInterface {
  code: number | undefined;
  data: unknown | undefined;

  constructor (message: string, code?: number, data?: unknown) {
    super(message);

    this.code = code;
    this.data = data;
  }
}
