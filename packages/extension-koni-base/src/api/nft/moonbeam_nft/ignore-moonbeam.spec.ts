// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MoonbeamNftApi } from '@polkadot/extension-koni-base/api/nft/moonbeam_nft/index';

jest.setTimeout(500000000);

describe('test moonbeam nft', () => {
  test('test get nft', async () => {
    const nftApi = new MoonbeamNftApi([
      '0x369270de55e0062e21537020ea309900699e6d7b'
    ], 'moonbeam');

    for (let i = 0; i < 1; i++) {
      await nftApi.fetchNfts();
      console.log(`${i}---------------------`);
      console.log(nftApi.getTotal());
    }
  });
});
