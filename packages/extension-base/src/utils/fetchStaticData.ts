// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { staticData, StaticKey } from '@subwallet/extension-base/utils/staticData';
import axios from 'axios';

const PRODUCTION_BRANCHES = ['master', 'webapp', 'webapp-dev'];
const branchName = process.env.BRANCH_NAME || 'koni-dev';
const fetchTarget = PRODUCTION_BRANCHES.indexOf(branchName) > -1 ? 'list.json' : 'preview.json';

export async function fetchStaticData<T> (slug: string, targetFile?: string) {
  const fetchFile = targetFile || fetchTarget;

  try {
    const rs = await axios.get(`https://static-data.subwallet.app/${slug}/${fetchFile}`);

    return rs.data as T;
  } catch (e) {
    return staticData[slug as StaticKey] as T;
  }
}
