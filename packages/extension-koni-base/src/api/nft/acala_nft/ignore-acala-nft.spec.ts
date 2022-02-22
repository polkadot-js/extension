// [object Object]
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import { initApi } from '@polkadot/extension-koni-base/api/dotsama';
import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';
import { AcalaNftApi } from '@polkadot/extension-koni-base/api/nft/acala_nft/index';
import { TEST_NFT_ADDRESSES } from '@polkadot/extension-koni-base/api/nft/config';

jest.setTimeout(60000);

describe('test acala nft api', () => {
  test('test acala nft api', async () => {
    const provider = initApi(NETWORKS.acala.provider);
    const testNftApi = new AcalaNftApi(provider, TEST_NFT_ADDRESSES, 'acala');

    await testNftApi.connect();
    await testNftApi.handleNfts();

    expect(testNftApi.getTotal()).toBeGreaterThanOrEqual(0);
  });
});
