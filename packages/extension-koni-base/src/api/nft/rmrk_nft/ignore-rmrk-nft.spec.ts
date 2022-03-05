// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RmrkNftApi } from '@polkadot/extension-koni-base/api/nft/rmrk_nft/index';
import { TEST_NFT_ADDRESSES } from '@polkadot/extension-koni-base/api/nft/test_config';

jest.setTimeout(60000);

describe('test rmrk nft api', () => {
  test('test rmrk nft api', async () => {
    const testNftApi = new RmrkNftApi();

    testNftApi.setAddresses(TEST_NFT_ADDRESSES);
    await testNftApi.connect();
    await testNftApi.handleNfts();
    // const result = testNftApi.getData();

    console.log(testNftApi.getData());

    for (const collection of testNftApi.getData()) {
      console.log(collection.nftItems);
    }

    expect(testNftApi.getTotal()).toBeGreaterThanOrEqual(0);
  });
});
