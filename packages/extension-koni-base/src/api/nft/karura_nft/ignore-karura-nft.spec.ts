// [object Object]
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import { initApi } from '@polkadot/extension-koni-base/api/dotsama';
import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';
import { TEST_NFT_ADDRESSES } from '@polkadot/extension-koni-base/api/nft/config';
import { KaruraNftApi } from '@polkadot/extension-koni-base/api/nft/karura_nft/index';

jest.setTimeout(60000);

describe('test karura nft api', () => {
  test('test karura nft api', async () => {
    const provider = initApi(NETWORKS.karura.provider);
    const testNftApi = new KaruraNftApi(provider, TEST_NFT_ADDRESSES, 'karura');

    await testNftApi.connect();
    await testNftApi.handleNfts();

    expect(testNftApi.getTotal()).toBeGreaterThanOrEqual(0);
  });
});
