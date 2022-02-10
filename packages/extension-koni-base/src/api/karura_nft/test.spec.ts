import KaruraNftApi from "@polkadot/extension-koni-base/api/karura_nft/index";

jest.setTimeout(50000)

describe('test get karura nft api', () => {
   test('test get karura nft from endpoints', async () => {
      const accountAddress = 'Fys7d6gikP6rLDF9dvhCJcAMaPrrLuHbGZRVgqLPn26fWmr'

      const api = new KaruraNftApi();
      await api.connect();
      const assetIds = await api.getNfts(accountAddress);
      expect(assetIds).not.toBeNaN()

      await Promise.all(assetIds.map( async (assetId) => {
        const tokenInfo = await api.getCollectionDetails(assetId.classId)
        console.log(tokenInfo)
        expect(tokenInfo).not.toBeNaN()
      }))

   })
})
