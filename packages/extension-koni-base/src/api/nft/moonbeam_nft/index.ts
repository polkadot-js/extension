// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps } from '@polkadot/extension-base/background/KoniTypes';
import { BaseNftApi } from '@polkadot/extension-koni-base/api/nft/nft';

const SUPPORTED_NFT_CONTRACTS = [
  '0xCc1A7573C8f10d0df7Ee4d57cc958C8Df4a5Aca9', // Moon monkey
  '0xe6e0696F70c507749d59283C0887E795Ee6Ff64b', // MoonDAO
  '0x8fbe243d898e7c88a6724bb9eb13d746614d23d6' // GlimmerApes
];

export class MoonbeamNftApi extends BaseNftApi {
  // eslint-disable-next-line no-useless-constructor
  constructor (api: ApiProps, addresses: string[], chain?: string) {
    super(api, addresses, chain);
  }

  private getCollectionDetails (smartContract: string) {
    console.log(smartContract);
  }

  fetchNfts (): Promise<number> {
    return Promise.resolve(0);
  }

  async handleNfts (): Promise<void> {
    await this.connect();
    this.getCollectionDetails('ajunscoas');
  }
}
