// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { CreateDeriveAccountInfo } from '@subwallet/extension-base/background/KoniTypes';

export interface DeriveAccount extends CreateDeriveAccountInfo{
  address: string;
}
