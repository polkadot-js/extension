// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { packageInfo as chainListInfo } from '@subwallet/chain-list/packageInfo';
import fetch from 'cross-fetch';

const PRODUCTION_BRANCHES = ['master', 'webapp', 'webapp-dev'];
const branchName = process.env.BRANCH_NAME || 'subwallet-dev';
const fetchDomain = PRODUCTION_BRANCHES.indexOf(branchName) > -1 ? 'https://chain-list-assets.subwallet.app' : 'https://dev.sw-chain-list-assets.pages.dev';

export async function fetchPatchData<T> (slug: string) {
  try {
    const fetchPromise = fetch(`${fetchDomain}/patch/${chainListInfo.version}/${slug}`);
    const timeout = new Promise<null>((resolve) => {
      const id = setTimeout(() => {
        clearTimeout(id);
        resolve(null);
      }, 1000);
    });
    const rs = await Promise.race([
      timeout,
      fetchPromise
    ]);

    if (!rs) {
      return null;
    }

    return await rs.json() as T;
  } catch (e) {
    return null;
  }
}
