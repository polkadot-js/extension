// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { fetchDotSamaCrowdloan } from '@polkadot/extension-koni-base/api/subquery/subquery';

jest.setTimeout(50000);

describe('Test SubQuery Graphql', () => {
  test('Test Fetch Funds', async () => {
    const rs = await fetchDotSamaCrowdloan();

    console.log(rs);
  });
});
