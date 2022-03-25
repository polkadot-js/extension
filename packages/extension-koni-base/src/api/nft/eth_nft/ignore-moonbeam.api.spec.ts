// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise, WsProvider } from '@polkadot/api';
import { typesBundle, typesChain } from '@polkadot/extension-koni-base/api/dotsama/api-helper';
import { Web3NftApi } from '@polkadot/extension-koni-base/api/nft/eth_nft/index';

jest.setTimeout(500000);

describe('test DotSama APIs', () => {
  test('blah', async () => {
    const provider = new WsProvider('wss://moonbeam.api.onfinality.io/public-ws');
    const apiOption = { provider, typesBundle, typesChain: typesChain };
    const api = new ApiPromise(apiOption);

    await api.isReady;
    const assets = await api.query.assets.metadata.entries();

    console.log(assets);
  });

  test('moon', async () => {
    const nftApi = new Web3NftApi([''], 'astar');

    await nftApi.fetchNfts();

    console.log(nftApi.getData());
  });
});
