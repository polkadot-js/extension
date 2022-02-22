// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import connectDotSamaApis from '@polkadot/extension-koni-base/api/dotsama';
import { TEST_NFT_ADDRESSES } from '@polkadot/extension-koni-base/api/nft/config';
import { NftHandler } from '@polkadot/extension-koni-base/api/nft/index';

jest.setTimeout(5000000);

describe('test api get nft from all chains', () => {
  const dotSamaAPIMap = connectDotSamaApis();
  const nftHandler = new NftHandler(dotSamaAPIMap, TEST_NFT_ADDRESSES);

  test('test api get nft from all chains', async () => {
    await nftHandler.handleNfts();
    console.log(nftHandler.getTotal());
    expect(nftHandler.getTotal()).toBeGreaterThanOrEqual(0);
  });
});
