// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { initApi } from '@polkadot/extension-koni-base/api/dotsama';
import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';
import { TEST_NFT_ADDRESSES } from '@polkadot/extension-koni-base/api/nft/test_config';
import UniqueNftApi from '@polkadot/extension-koni-base/api/nft/unique_nft/index';

jest.setTimeout(50000);

describe('test unique nft api', () => {
  test('test unique nft api', async () => {
    const provider = initApi(NETWORKS.uniqueNft.provider);
    const testNftApi = new UniqueNftApi(provider, TEST_NFT_ADDRESSES, 'quartz');

    await testNftApi.connect();
    await testNftApi.handleNfts();

    expect(testNftApi.getTotal()).toBeGreaterThanOrEqual(0);
  });
});
