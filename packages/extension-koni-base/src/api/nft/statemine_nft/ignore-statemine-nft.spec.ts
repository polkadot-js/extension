// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { initApi } from '@polkadot/extension-koni-base/api/dotsama';
import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';
import StatemineNftApi from '@polkadot/extension-koni-base/api/nft/statemine_nft/index';
import { TEST_NFT_ADDRESSES } from '@polkadot/extension-koni-base/api/nft/test_config';

jest.setTimeout(60000);

describe('test statemine nft api', () => {
  const provider = initApi(NETWORKS.statemine.provider);
  const testNftApi = new StatemineNftApi(provider, TEST_NFT_ADDRESSES, 'statemine');

  test('test statemine nft api', async () => {
    await testNftApi.connect();
    await testNftApi.handleNfts();

    console.log(testNftApi.getTotal());

    expect(testNftApi.getTotal()).toBeGreaterThanOrEqual(0);
  });
});
