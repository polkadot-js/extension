// [object Object]
// SPDX-License-Identifier: Apache-2.0

import StatemineNftApi from '@polkadot/extension-koni-base/api/nft/statemine_nft/index';

jest.setTimeout(20000);

describe('test get unique nft api', () => {
  test('test get unique nft from endpoints', async () => {
    const accountAddress = 'Fys7d6gikP6rLDF9dvhCJcAMaPrrLuHbGZRVgqLPn26fWmr';

    const api = new StatemineNftApi();

    await api.connect();
    const assetIds = await api.getNfts(accountAddress);

    expect(assetIds).not.toBeNaN();

    await Promise.all(assetIds.map(async (assetId) => {
      const tokenInfo = await api.getTokenDetails({ classId: 8, tokenId: 1 });

      console.log(tokenInfo);
      expect(tokenInfo).not.toBeNaN();
    }));

    // const metadataCollection = await api.query.uniques.classMetadataOf(collectionId)
    // console.log(metadataCollection.toHuman());

    // const ownerOfCollection = await api.query.uniques.class(collectionId);
    // console.log(ownerOfCollection.toHuman());
  });
});
