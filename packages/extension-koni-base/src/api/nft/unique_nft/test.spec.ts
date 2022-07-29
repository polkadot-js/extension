// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftCollection, NftItem } from '@subwallet/extension-base/background/KoniTypes';
import { UniqueNftApiV2 } from '@subwallet/extension-koni-base/api/nft/unique_nft/uniqueNftV2';

jest.setTimeout(50000);

describe('test DotSama APIs', () => {
  test('test get Balances', async () => {
    const nftApi = new UniqueNftApiV2();

    nftApi.setChain('uniqueNft');
    nftApi.setAddresses(['5HdwtP77HPPVzCVqEu38GGCHf1g9eQXCMZV5aPhZttN3sKF4']);

    await nftApi.fetchNfts({
      updateItem: (data: NftItem) => {
        console.log(data);
      },
      updateCollection: (data: NftCollection) => {
        console.log(data);
      },
      updateReady: (ready) => {
        console.log(ready);
      },
      updateNftIds: (networkKey: string) => {
        console.log(networkKey);
      },
      updateCollectionIds: (networkKey: string) => {
        console.log(networkKey);
      }
    });
  });
});
