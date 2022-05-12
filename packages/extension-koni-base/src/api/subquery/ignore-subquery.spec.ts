// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { fetchDotSamaCrowdloan } from '@subwallet/extension-koni-base/api/subquery/crowdloan';

jest.setTimeout(50000);

describe('Test SubQuery Graphql', () => {
  test('Test Fetch Funds', async () => {
    const rs = await fetchDotSamaCrowdloan();

    const statusDict: Record<string, string> = {};

    Object.entries(rs).forEach(([key, r]) => {
      statusDict[key] = String(r.status);
    });

    console.log(statusDict);
  });
});
