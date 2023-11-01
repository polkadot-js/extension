// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import axios from 'axios';

const branchName = process.env.BRANCH_NAME || 'koni-dev';
const fetchTarget = (branchName === 'master' || branchName === 'webapp') ? 'list.json' : 'preview.json';

export async function fetchStaticData<T> (slug: string, targetFile?: string) {
  const fetchFile = targetFile || fetchTarget;
  const rs = await axios.get(`https://static-data.subwallet.app/${slug}/${fetchFile}`);

  return rs.data as T;
}
