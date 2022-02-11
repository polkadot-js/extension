// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { handleUniqueNfts } from '@polkadot/extension-koni-base/api/nft';

jest.setTimeout(500000000);

describe('test get unique nft api', () => {
  test('test get unique nft from endpoints', async () => {
    await handleUniqueNfts('5GedyoC1nULnjzk3m8qjZznsAtpnJPUQREVLDcXcgD1yLwrb');
    // test nft for unique
    // const collectionId_unique = 25;
    // const locale = 'en';
    // const owner_unique = '5GedyoC1nULnjzk3m8qjZznsAtpnJPUQREVLDcXcgD1yLwrb';
    //
    // const api = new UniqueNftApi();
    //
    // await api.connect();
    //
    // const data = await api.getAddressTokens(collectionId_unique, owner_unique);
    //
    // expect(data.length).toEqual(1);
    //
    // for (let i = 0; i < data.length; i++) {
    //   const tokenId = data[i];
    //   // Get token image URL
    //   const imageUrl = await api.getNftImageUrl(collectionId_unique, tokenId);
    //
    //   expect(imageUrl).toEqual('https://ipfs-gateway.usetech.com/ipfs/QmRGCpYx64BBGFVsvbzGwpgdzTUK6wk7nJT2uMW2dUYiHn/image1756.png');
    //
    //   // Get token data
    //   const tokenData = await api.getNftData(collectionId_unique, tokenId, locale);
    //
    //   expect(tokenData?.owner).toEqual('5GedyoC1nULnjzk3m8qjZznsAtpnJPUQREVLDcXcgD1yLwrb');
    // }
    //
    // await api.disconnect();
  });
});
