// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { fetchJson, fetchText } from '@subwallet/extension-base/utils/fetch';

const branchName = process.env.BRANCH_NAME || 'koni-dev';
const fetchTarget = (branchName === 'master' || branchName === 'webapp') ? 'list.json' : 'preview.json';

export async function fetchStaticData<T> (slug: string, targetFile?: string, isJson = true) {
  const fetchFile = targetFile || fetchTarget;

  if (isJson) {
    return await fetchJson<T>(`https://static-data.subwallet.app/${slug}/${fetchFile}`);
  } else {
    return await fetchText<T>(`https://static-data.subwallet.app/${slug}/${fetchFile}`);
  }
}
