// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import connectDotSamaApis, { initApi } from '@polkadot/extension-koni-base/api/dotsama/index';
import { getSubqueryStakingReward, subscribeStaking } from '@polkadot/extension-koni-base/api/dotsama/staking';
import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';

jest.setTimeout(50000);

describe('test staking api', () => {
  const testAddress = ['26AeiFcdfBtzaBYRjatTpPPJqRzCWyjR5r6wpqykZmXFSnh9'];

  test('test get staking', async () => {
    const dotSamaAPIMap = connectDotSamaApis();

    await subscribeStaking(testAddress, dotSamaAPIMap, (networkKey, stakingItem) => {
      console.log('here!');
      console.log(networkKey);
      console.log(stakingItem);
    });

    // expect(stakingInfo.details.length).toBeGreaterThanOrEqual(0);
  });

  test('test staking manually', async () => {
    const provider = NETWORKS.acala.provider;
    const apiProps = initApi('acala', provider);
    const parentApi = await apiProps.isReady;
    const ledgers = await parentApi.api.query.staking?.ledger.multi(testAddress);

    console.log('ledgers', ledgers);

    // for (const ledger of ledgers) {
    //   console.log(ledger.toHuman());
    // }
  });

  test('subquery get reward', async () => {
    const resp = await getSubqueryStakingReward(['17bR6rzVsVrzVJS1hM4dSJU43z2MUmz7ZDpPLh8y2fqVg7m', 'Caa8SHQ8P1jtXeuZV7MJ3yJvdnG2M3mhXpvgx7FtKwgxkVJ', '111B8CxcmnWbuDLyGvgUmRezDCK1brRZmvUuQ6SrFdMyc3S']);

    console.log(resp);
  });

  test('nft', async () => {
    // const dotSamaAPIMap = connectDotSamaApis();
    // const testApiNft = new NftHandler(dotSamaAPIMap, ['5HMkyzwXxVtFa4VGid3DuDtuWxZcGqt57wq9WiZPP8YrSt6d', '5CFktU1BC5sXSfs64PJ9vBVUGZp2ezpVRGUCjAXv7spRZR3W']);
    //
    // await testApiNft.handleNfts();

    // for (const item of testApiNft.getNftJson().nftList) {
    //   console.log(item);
    //   console.log(item.nftItems);
    // }
  });
});
