import connectDotSamaApis, {initApi} from "@polkadot/extension-koni-base/api/dotsama";
import {NftHandler} from "@polkadot/extension-koni-base/api/nft/index";
import NETWORKS from "@polkadot/extension-koni-base/api/endpoints";
import UniqueNftApi from "@polkadot/extension-koni-base/api/nft/unique_nft";
import {subscribeStaking} from "@polkadot/extension-koni-base/api/dotsama/staking";

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

describe('test single api get staking', () => {
  test('test single api get staking', async () => {
    const dotSamaAPIMap = connectDotSamaApis();
    const resp = await subscribeStaking(['5GedyoC1nULnjzk3m8qjZznsAtpnJPUQREVLDcXcgD1yLwrb', '7Hja2uSzxdqcJv1TJi8saFYsBjurQZtJE49v4SXVC5Dbm8KM'], dotSamaAPIMap);
    console.log(resp);
  });
});
