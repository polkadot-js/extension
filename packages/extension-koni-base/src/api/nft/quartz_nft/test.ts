import QuartzNftApi from "@polkadot/extension-koni-base/api/nft/quartz_nft";
import NETWORKS from "@polkadot/extension-koni-base/api/endpoints";
import {initApi} from "@polkadot/extension-koni-base/api/dotsama";

describe('test quartz_nft api', () => {
  const api = initApi(NETWORKS.quartz.provider);
  const quartzNftApi = new QuartzNftApi(api, [], 'quartz');

  test('test quartz_nft getCreatedCollectionCount', async () => {
    await quartzNftApi.connect();
    const createdCollectionCount = await quartzNftApi.getCreatedCollectionCount();
    expect(createdCollectionCount).toBeGreaterThan(16);
  });

  test('test quartz_nft getAddressTokens', async () => {
    await quartzNftApi.connect();
    const addressTokens = await quartzNftApi.getAddressTokens(5,
      'yGJJkW9RiA7bFHRuUESSudCZZ1QNQGNbZQyqWJwMf1VeQ2HZo');
    expect(addressTokens.length).toBeGreaterThan(1);
  });

  test('test quartz_nft getCollectionProperties', async () => {
    await quartzNftApi.connect();
    const collectionProperties = await quartzNftApi.getCollectionProperties(5);
    expect(collectionProperties?.owner).toEqual('yGHkvgGth212LzAokvhCMLvs5a9vTpRjKkqjCHfRqwxHn3Lum');
  });

  test('test quartz_nft getNftImageUrl', async () => {
    await quartzNftApi.connect();
    const collectionProperties = await quartzNftApi.getCollectionProperties(5);
    if (collectionProperties) {
      const imageUrl = await quartzNftApi.getNftImageUrl(collectionProperties, 173);
      expect(imageUrl).toEqual(
        'http://ipfs-gateway.usetech.com/ipfs/Qmap7uz7JKZNovCdLfdDE3p4XA6shghdADS7EsHvLjL6jT/nft_image_173.png');
    }
  });

  test('test quartz_nft getNftData', async () => {
    await quartzNftApi.connect();
    const collectionProperties = await quartzNftApi.getCollectionProperties(5);
    if (collectionProperties) {
      const nftData = await quartzNftApi.getNftData(collectionProperties, 5, 173);
      expect(nftData?.prefix).toEqual('AAA');
      expect(nftData?.collectionName).toEqual('Workaholics');
      expect(nftData?.collectionDescription).toEqual('Workaholics test collection');
      expect(nftData?.properties['Workaholic Name']).toEqual('Iliya Smirnov');
      expect(nftData?.image).toEqual(
        'http://ipfs-gateway.usetech.com/ipfs/Qmap7uz7JKZNovCdLfdDE3p4XA6shghdADS7EsHvLjL6jT/nft_image_173.png');
    }
  });
});
