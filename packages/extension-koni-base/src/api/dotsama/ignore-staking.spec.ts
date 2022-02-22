// [object Object]
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import connectDotSamaApis from '@polkadot/extension-koni-base/api/dotsama/index';
import { subscribeStaking } from '@polkadot/extension-koni-base/api/dotsama/staking';

jest.setTimeout(50000);

describe('test staking api', () => {
  const dotSamaAPIMap = connectDotSamaApis();
  const testAddress = ['5GedyoC1nULnjzk3m8qjZznsAtpnJPUQREVLDcXcgD1yLwrb', '7Hja2uSzxdqcJv1TJi8saFYsBjurQZtJE49v4SXVC5Dbm8KM'];

  test('test get staking', async () => {
    const stakingInfo = await subscribeStaking(testAddress, dotSamaAPIMap);

    expect(stakingInfo.details.length).toBeGreaterThanOrEqual(0);
  });
});
