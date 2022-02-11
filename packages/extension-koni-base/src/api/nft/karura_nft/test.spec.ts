// [object Object]
// SPDX-License-Identifier: Apache-2.0

import { handleKaruraNfts } from '@polkadot/extension-koni-base/api/nft/karura_nft/index';

jest.setTimeout(50000);

describe('test get karura nft api', () => {
  test('test get karura nft from endpoints', async () => {
    const resp = await handleKaruraNfts('');
    const collection = resp.allCollections[0];
    const items = collection.nftItems;

    console.log(items);
    // const accountAddress = 'Fys7d6gikP6rLDF9dvhCJcAMaPrrLuHbGZRVgqLPn26fWmr'
    //
    // const api = new KaruraNftApi();
    // await api.connect();
    // const assetIds = await api.getNfts(accountAddress);
    // expect(assetIds).not.toBeNaN()
    //
    // await Promise.all(assetIds.map( async (assetId) => {
    //   const tokenInfo = await api.getCollectionDetails(assetId.classId)
    //   console.log(tokenInfo)
    //   expect(tokenInfo).not.toBeNaN()
    // }))
  });
});
