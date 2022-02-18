// [object Object]
// SPDX-License-Identifier: Apache-2.0

import connectDotSamaApis, { initApi } from '@polkadot/extension-koni-base/api/dotsama';
import { subscribeStaking } from '@polkadot/extension-koni-base/api/dotsama/staking';
import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';
import { NftHandler } from '@polkadot/extension-koni-base/api/nft/index';
import { RmrkNftApi } from '@polkadot/extension-koni-base/api/nft/rmrk_nft';
import UniqueNftApi from '@polkadot/extension-koni-base/api/nft/unique_nft';

jest.setTimeout(5000000000);

const TEST_NFT_ADDRESSES = [
  'seAJwjS9prpF7BLXK2DoyuYWZcScrtayEN5kwsjsXmXQxrp',
  '5GedyoC1nULnjzk3m8qjZznsAtpnJPUQREVLDcXcgD1yLwrb',
  'Fys7d6gikP6rLDF9dvhCJcAMaPrrLuHbGZRVgqLPn26fWmr',
  '7Hja2uSzxdqcJv1TJi8saFYsBjurQZtJE49v4SXVC5Dbm8KM',
  '16J48LCbpH9j1bVngG6E3Nj4NaZFy9SDCSZdg1YjwDaNdMVo',
  'yGJJkW9RiA7bFHRuUESSudCZZ1QNQGNbZQyqWJwMf1VeQ2HZo',
  'yGHkvgGth212LzAokvhCMLvs5a9vTpRjKkqjCHfRqwxHn3Lum'
];

describe('test api get nft', () => {
  test('test api get nft from all chains', async () => {
    const dotSamaAPIMap = connectDotSamaApis();
    const nftHandler = new NftHandler(dotSamaAPIMap, TEST_NFT_ADDRESSES);

    await nftHandler.handleNfts();
    console.log(nftHandler.getTotal());
  });
});

describe('test single api get nft', () => {
  test('test single api get nft', async () => {
    const provider = initApi(NETWORKS.uniqueNft.provider);
    const testNftApi = new UniqueNftApi(provider, TEST_NFT_ADDRESSES, 'quartz');

    await testNftApi.connect();
    await testNftApi.handleNfts();
    console.log(testNftApi.getData());
  });
});

describe('test single api get nft from rmrk', () => {
  test('test single api get nft from rmrk', async () => {
    const testNftApi = new RmrkNftApi();

    testNftApi.setAddresses(TEST_NFT_ADDRESSES);
    await testNftApi.connect();
    await testNftApi.handleNfts();
    console.log(testNftApi.getTotal());
  });
});

describe('test single api get staking', () => {
  test('test single api get staking', async () => {
    const dotSamaAPIMap = connectDotSamaApis();
    const resp = await subscribeStaking(['5GedyoC1nULnjzk3m8qjZznsAtpnJPUQREVLDcXcgD1yLwrb', '7Hja2uSzxdqcJv1TJi8saFYsBjurQZtJE49v4SXVC5Dbm8KM'], dotSamaAPIMap);

    console.log(resp);
  });
});
