// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { initApi } from '@polkadot/extension-koni-base/api/dotsama';
import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';
import { TEST_NFT_ADDRESSES } from '@polkadot/extension-koni-base/api/nft/config';
import QuartzNftApi from '@polkadot/extension-koni-base/api/nft/quartz_nft/index';

jest.setTimeout(600000);

describe('test quartz nft api', () => {
  test('test quartz nft api', async () => {
    const provider = initApi(NETWORKS.quartz.provider);
    const testNftApi = new QuartzNftApi(provider, TEST_NFT_ADDRESSES, 'quartz');

    await testNftApi.connect();
    await testNftApi.handleNfts();
    console.log(testNftApi.getTotal());
    expect(testNftApi.getTotal()).toBeGreaterThanOrEqual(0);
  });
});