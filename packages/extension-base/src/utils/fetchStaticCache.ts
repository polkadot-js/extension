// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import axios from 'axios';

const PRODUCTION_BRANCHES = ['master', 'webapp', 'webapp-dev'];
const branchName = process.env.BRANCH_NAME || 'koni-dev';
const fetchTarget = PRODUCTION_BRANCHES.indexOf(branchName) > -1 ? 'https://static-cache.subwallet.app' : 'https://dev.sw-static-cache.pages.dev';

export async function fetchStaticCache<T> (slug: string, defaultData: T, timeout = 9000) {
  try {
    const rs = await axios.get(`${fetchTarget}/${slug}`, { timeout });

    return rs.data as T;
  } catch (e) {
    return defaultData;
  }
}
