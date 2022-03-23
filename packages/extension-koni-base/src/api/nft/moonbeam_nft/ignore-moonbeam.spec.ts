// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MoonbeamNftApi } from '@polkadot/extension-koni-base/api/nft/moonbeam_nft/index';

jest.setTimeout(50000);

describe('test moonbeam nft', () => {
  test('test get nft', async () => {
    const nftApi = new MoonbeamNftApi(['0x5e35994dfb6b2494428d1919b15b7fd3a7de0c3a'], 'moonbeam');

    await nftApi.fetchNfts();
  });
});
