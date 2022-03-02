// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { getSubsquidStakingReward } from '@polkadot/extension-koni-base/api/subsquid/subsquid';

jest.setTimeout(50000);

describe('test staking api', () => {
  test('subsquid axios staking api', async () => {
    const resp = await getSubsquidStakingReward('14B3z6xL9vGgKz8WptoZabPrgH6adH1ev2Ven4SiTcdznfqd');

    console.log(resp);
  });
});
