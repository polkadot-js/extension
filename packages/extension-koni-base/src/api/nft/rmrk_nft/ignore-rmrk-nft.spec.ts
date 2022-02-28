// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TEST_NFT_ADDRESSES } from '@polkadot/extension-koni-base/api/nft/config';
import { RmrkNftApi } from '@polkadot/extension-koni-base/api/nft/rmrk_nft/index';

jest.setTimeout(60000);

describe('test rmrk nft api', () => {
  test('test rmrk nft api', async () => {
    const testNftApi = new RmrkNftApi();

    testNftApi.setAddresses(TEST_NFT_ADDRESSES);
    await testNftApi.connect();
    await testNftApi.handleNfts();
    const result = testNftApi.getData();

    for (const collection of result) {
      console.log(collection.nftItems);
    }

    expect(testNftApi.getTotal()).toBeGreaterThanOrEqual(0);
  });
});
