// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { getAllSubsquidStaking } from '@subwallet/extension-koni-base/api/staking/subsquidStaking';

jest.setTimeout(50000);

describe('test DotSama APIs', () => {
  test('asda', async () => {
    const result = await getAllSubsquidStaking(['7Hja2uSzxdqcJv1TJi8saFYsBjurQZtJE49v4SXVC5Dbm8KM'], (networkKey, rs) => {
      console.log(`${networkKey} got`, rs);
    });

    console.log(result);
  });
});
