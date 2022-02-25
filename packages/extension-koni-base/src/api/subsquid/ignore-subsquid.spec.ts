// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { FundInfos, FundInfosVariables } from '@polkadot/extension-koni-base/api/subquery/__generated__/FundInfos';
import { client, getSubsquidStakingReward, SUBSQUID_STAKING_QUERY } from '@polkadot/extension-koni-base/api/subsquid/subsquid';

jest.setTimeout(50000);

describe('test staking api', () => {
  test('subsquid staking api', async () => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const rs = await client.query<FundInfos, FundInfosVariables>({ query: SUBSQUID_STAKING_QUERY });

    console.log(rs.data);
  });

  test('subsquid axios staking api', async () => {
    const resp = await getSubsquidStakingReward('14B3z6xL9vGgKz8WptoZabPrgH6adH1ev2Ven4SiTcdznfqd');

    console.log(resp);
  });
});
