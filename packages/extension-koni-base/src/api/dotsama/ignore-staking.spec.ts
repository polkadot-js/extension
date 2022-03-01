// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import connectDotSamaApis, { initApi } from '@polkadot/extension-koni-base/api/dotsama/index';
import { getSubqueryKusamaStakingReward, subscribeStaking } from '@polkadot/extension-koni-base/api/dotsama/staking';
import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';

jest.setTimeout(50000);

describe('test staking api', () => {
  const testAddress = ['17bR6rzVsVrzVJS1hM4dSJU43z2MUmz7ZDpPLh8y2fqVg7m', '7Hja2uSzxdqcJv1TJi8saFYsBjurQZtJE49v4SXVC5Dbm8KM', 'Caa8SHQ8P1jtXeuZV7MJ3yJvdnG2M3mhXpvgx7FtKwgxkVJ'];

  test('test get staking', async () => {
    const dotSamaAPIMap = connectDotSamaApis();

    await subscribeStaking(testAddress, dotSamaAPIMap, (networkKey, stakingItem) => {
      console.log('here!');
      console.log(networkKey);
      console.log(stakingItem);
    });

    // expect(stakingInfo.details.length).toBeGreaterThanOrEqual(0);
  });

  test('test staking manually', async () => {
    const provider = NETWORKS.polkadot.provider;
    const apiProps = initApi(provider);
    const parentApi = await apiProps.isReady;
    const ledgers = await parentApi.api.query.staking?.ledger.multi(testAddress);

    console.log('ledgers', ledgers);

    for (const ledger of ledgers) {
      console.log(ledger.toHuman());
    }
  });

  test('subquery get reward', async () => {
    const resp = await getSubqueryKusamaStakingReward('Caa8SHQ8P1jtXeuZV7MJ3yJvdnG2M3mhXpvgx7FtKwgxkVJ');

    console.log(resp);
  });
});
