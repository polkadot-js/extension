// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {ApiProps, NftCollection, NftItem} from '@subwallet/extension-base/background/KoniTypes';
import { BaseNftApi } from '@subwallet/extension-koni-base/api/nft/nft';

export class WasmNftApi extends BaseNftApi {
  constructor (api: ApiProps | null, addresses: string[], chain: string) {
    super(chain, api, addresses);
  }

  fetchNfts (updateItem: (data: NftItem) => void, updateCollection: (data: NftCollection) => void, updateReady: (ready: boolean) => void): Promise<number> {
    return Promise.resolve(0);
  }

  handleNfts (updateItem: (data: NftItem) => void, updateCollection: (data: NftCollection) => void, updateReady: (ready: boolean) => void): void {
  }
}
