// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { fetchJson, fetchText } from '@subwallet/extension-base/utils/fetch';
import { staticData, StaticKey } from '@subwallet/extension-base/utils/staticData';

const PRODUCTION_BRANCHES = ['master', 'webapp', 'webapp-dev'];
const branchName = process.env.BRANCH_NAME || 'koni-dev';
const fetchTarget = PRODUCTION_BRANCHES.indexOf(branchName) > -1 ? 'list.json' : 'preview.json';

export async function fetchStaticData<T> (slug: string, targetFile?: string, isJson = true) {
  const fetchFile = targetFile || fetchTarget;

  try {
    if (isJson) {
      return await fetchJson<T>(`https://static-data.subwallet.app/${slug}/${fetchFile}`);
    } else {
      return await fetchText<T>(`https://static-data.subwallet.app/${slug}/${fetchFile}`);
    }
  } catch (e) {
    return staticData[slug as StaticKey] as T;
  }
}
