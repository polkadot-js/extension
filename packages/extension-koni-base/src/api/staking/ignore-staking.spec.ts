// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import connectDotSamaApis, { initApi } from '@polkadot/extension-koni-base/api/dotsama';
import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';
import { subscribeStaking } from '@polkadot/extension-koni-base/api/staking/staking';

jest.setTimeout(50000);

describe('test staking api', () => {
  const testAddress = ['17bR6rzVsVrzVJS1hM4dSJU43z2MUmz7ZDpPLh8y2fqVg7m'];

  test('test get staking', async () => {
    const dotSamaAPIMap = connectDotSamaApis();
    const stakingInfo = await subscribeStaking(testAddress, dotSamaAPIMap);

    console.log(stakingInfo);
    expect(stakingInfo.details.length).toBeGreaterThanOrEqual(0);
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
});