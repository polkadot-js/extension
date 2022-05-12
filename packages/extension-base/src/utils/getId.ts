// Copyright 2019-2022 @subwallet/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { EXTENSION_PREFIX } from '../defaults';

let counter = 0;

export function getId (): string {
  return `${EXTENSION_PREFIX}.${Date.now()}.${++counter}`;
}
