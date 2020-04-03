// Copyright 2019-2020 @polkadot/extension authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { assert } from '@polkadot/util';

let idCounter = 0;

export function getId (): string {
  return `${Date.now()}.${++idCounter}`;
}

export function stripUrl (url: string): string {
  assert(url && (url.startsWith('http:') || url.startsWith('https:')), `Invalid url ${url}, expected to start with http: or https:`);

  const parts = url.split('/');

  return parts[2];
}
