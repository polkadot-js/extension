// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

const PRODUCTION_BRANCHES = ['master', 'webapp', 'webapp-dev'];
const branchName = process.env.BRANCH_NAME || 'subwallet-dev';
const fetchDomain = PRODUCTION_BRANCHES.indexOf(branchName) > -1 ? 'https://chain-list-assets.subwallet.app' : 'https://dev.sw-chain-list-assets.pages.dev';

const ChainListVersion = '0.2.62';

export async function fetchPatchData<T> (slug: string) {
  try {
    const fetchPromise = fetch(`${fetchDomain}/patch/${ChainListVersion}/${slug}`);
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
