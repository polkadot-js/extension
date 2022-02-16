import connectDotSamaApis, {initApi} from "@polkadot/extension-koni-base/api/dotsama";
import {NftHandler} from "@polkadot/extension-koni-base/api/nft/index";
import NETWORKS from "@polkadot/extension-koni-base/api/endpoints";
import UniqueNftApi from "@polkadot/extension-koni-base/api/nft/unique_nft";

describe('test api get nft', () => {
  test('test api get nft from all chains', async () => {
    const dotSamaAPIMap = connectDotSamaApis();
    const nftHandler = new NftHandler(dotSamaAPIMap, ['Fys7d6gikP6rLDF9dvhCJcAMaPrrLuHbGZRVgqLPn26fWmr', 'seAJwjS9prpF7BLXK2DoyuYWZcScrtayEN5kwsjsXmXQxrp', '7Hja2uSzxdqcJv1TJi8saFYsBjurQZtJE49v4SXVC5Dbm8KM']);
    await nftHandler.handleNfts();
  });
});

describe('test single api get nft', () => {
  test('test single api get nft', async () => {
    const api = initApi(NETWORKS.uniqueNft.provider);
    const uniqueNftApi = new UniqueNftApi(api, ['5GedyoC1nULnjzk3m8qjZznsAtpnJPUQREVLDcXcgD1yLwrb'], 'unique')
    await uniqueNftApi.handleNfts();
  });
});
