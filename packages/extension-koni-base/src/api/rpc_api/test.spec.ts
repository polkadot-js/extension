// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { getAllNftsByAccount } from '@polkadot/extension-koni-base/api/nft';
import { getBalances } from '@polkadot/extension-koni-base/api/rpc_api/index';
import { getStakingInfo } from '@polkadot/extension-koni-base/api/rpc_api/staking_info';
import { reformatAddress } from '@polkadot/extension-koni-base/utils/utils';
import { isEthereumAddress } from '@polkadot/util-crypto';

jest.setTimeout(5000000000000);

describe('test rpc api', () => {
  test('test rpc api from endpoints', async () => {
    return getBalances([{ paraId: 2000, chainId: 2 }], 'seAJwjS9prpF7BLXK2DoyuYWZcScrtayEN5kwsjsXmXQxrp').then((rs) => {
      console.log(rs);
      expect(rs).not.toBeNaN();
    }).catch((err) => {
      console.log(err);
    });
  });
});

describe('test api get staking', () => {
  test('test api get bonded token from endpoints', async () => {
    const resp = await getStakingInfo('');

    console.log(resp);
    // const resp = await getAllNftsByAccount('5CFktU1BC5sXSfs64PJ9vBVUGZp2ezpVRGUCjAXv7spRZR3W');
    // const collection = resp.nftList[2]
    // const item = collection.nftItems
    // console.log(collection);
    // const allChainsMapping = getAllChainsMapping()
    // const apis = await connectChains(allChainsMapping)
    // return getMultiCurrentBonded( { apis, accountId: '111B8CxcmnWbuDLyGvgUmRezDCK1brRZmvUuQ6SrFdMyc3S' } ).then(rs => {
    //   console.log(rs.length)
    //   expect(rs).not.toBeNaN()
    // }).catch(err => {
    //   console.log(err)
    // })
  });
});
