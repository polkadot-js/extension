// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import axios from 'axios';

export async function fetchStaticCache<T> (slug: string, defaultData: T, timeout = 9000) {
  try {
    const rs = await axios.get(`https://static-cache.subwallet.app/${slug}`, { timeout });

    return rs.data as T;
  } catch (e) {
    return defaultData;
  }
}
