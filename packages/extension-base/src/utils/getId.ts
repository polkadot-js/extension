// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ID_PREFIX } from '../defaults';

let counter = 0;

export function getId (): string {
  return `${ID_PREFIX}.${Date.now()}.${++counter}`;
}
