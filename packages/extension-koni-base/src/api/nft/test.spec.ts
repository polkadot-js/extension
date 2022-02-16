import connectDotSamaApis, {initApi} from "@polkadot/extension-koni-base/api/dotsama";
import {NftHandler} from "@polkadot/extension-koni-base/api/nft/index";
import NETWORKS from "@polkadot/extension-koni-base/api/endpoints";
import UniqueNftApi from "@polkadot/extension-koni-base/api/nft/unique_nft";

jest.setTimeout(5000000000)

describe('test api get nft', () => {
  test('test api get nft from all chains', async () => {
    const dotSamaAPIMap = connectDotSamaApis();
    const nftHandler = new NftHandler(dotSamaAPIMap);
    await nftHandler.handleNfts();
    console.log(nftHandler.getTotal());
  });
});

describe('test single api get nft', () => {
  test('test single api get nft', async () => {
    const api = initApi(NETWORKS.uniqueNft.provider);
    const uniqueNftApi = new UniqueNftApi(api, ['5GedyoC1nULnjzk3m8qjZznsAtpnJPUQREVLDcXcgD1yLwrb'], 'unique');
    await uniqueNftApi.connect();
    await uniqueNftApi.handleNfts();
  });
});
