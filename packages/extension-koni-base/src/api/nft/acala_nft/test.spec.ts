// [object Object]
// SPDX-License-Identifier: Apache-2.0

import { handleAcalaNfts } from '@polkadot/extension-koni-base/api/nft/acala_nft/index';

jest.setTimeout(50000);

describe('test get acala nft api', () => {
  test('test get acala nft from endpoints', async () => {
    const resp = await handleAcalaNfts('16J48LCbpH9j1bVngG6E3Nj4NaZFy9SDCSZdg1YjwDaNdMVo');
    const collection = resp.allCollections[0];
    const items = collection.nftItems;

    console.log(items);

    // const accountAddress = '16J48LCbpH9j1bVngG6E3Nj4NaZFy9SDCSZdg1YjwDaNdMVo'
    //
    // const api = new AcalaNftApi();
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
