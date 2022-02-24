// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { FundInfos, FundInfosVariables } from '@polkadot/extension-koni-base/api/subquery/__generated__/FundInfos';
import { client, FETCH_FUNDS_QUERY } from '@polkadot/extension-koni-base/api/subquery/subquery';

jest.setTimeout(50000);

describe('Test SubQuery Graphql', () => {
  test('Test Fetch Funds', async () => {
    const rs = await client.query<FundInfos, FundInfosVariables>({ query: FETCH_FUNDS_QUERY, variables: { first: 100, offset: 0 } });

    console.log(rs.data.crowdloans?.nodes);
  });
});
