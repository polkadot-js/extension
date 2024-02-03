// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { fetchJson } from '@subwallet/extension-base/utils/fetch';

export async function fetchStaticCache<T> (slug: string, defaultData: T, timeout = 9000) {
  try {
    return await fetchJson<T>(`https://static-cache.subwallet.app/${slug}`, { timeout });
  } catch (e) {
    return defaultData;
  }
}
