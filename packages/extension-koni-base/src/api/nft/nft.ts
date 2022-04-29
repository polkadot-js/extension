// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, NftCollection, NftItem } from '@polkadot/extension-base/background/KoniTypes';
import { CLOUDFLARE_PINATA_SERVER } from '@polkadot/extension-koni-base/api/nft/config';
import { isUrl } from '@polkadot/extension-koni-base/utils/utils';

export abstract class BaseNftApi {
  chain: string | null = null;
  dotSamaApi: ApiProps | null = null;
  data: NftCollection[] = [];
  total = 0;
  addresses: string[] = [];

  protected constructor (api?: ApiProps | null, addresses?: string[], chain?: string) {
    if (api) {
      this.dotSamaApi = api;
    }

    if (addresses) {
      this.addresses = addresses;
    }

    if (chain) {
      this.chain = chain;
    }
  }

  async connect () {
    if (!this.dotSamaApi?.isApiConnected) {
      this.dotSamaApi = await this.dotSamaApi?.isReady as ApiProps;
    }
  }

  recoverConnection () {
    if (!this.dotSamaApi?.isApiConnected) {
      this.dotSamaApi?.recoverConnect && this.dotSamaApi.recoverConnect();
    }
  }

  getDotSamaApi () {
    return this.dotSamaApi;
  }

  getChain () {
    return this.chain;
  }

  getTotal () {
    return this.total;
  }

  getData () {
    return this.data;
  }

  setApi (api: ApiProps) {
    this.dotSamaApi = api;
  }

  setChain (chain: string) {
    this.chain = chain;
  }

  setAddresses (addresses: string[]) {
    this.addresses = addresses;
  }

  protected parseTokenId (tokenId: string) {
    if (tokenId.includes(',')) {
      return tokenId.replace(',', '');
    }

    return tokenId;
  }

  parseUrl (input: string): string | undefined {
    if (!input || input.length === 0) {
      return undefined;
    }

    if (isUrl(input)) {
      return input;
    }

    if (!input.includes('ipfs://')) {
      return CLOUDFLARE_PINATA_SERVER + input;
    }

    return CLOUDFLARE_PINATA_SERVER + input.split('ipfs://ipfs/')[1];
  }

  // Sub-class implements this function to parse data into prop result
  abstract handleNfts(updateItem: (data: NftItem) => void, updateCollection: (data: NftCollection) => void, updateReady: (ready: boolean) => void): void;

  abstract fetchNfts(updateItem: (data: NftItem) => void, updateCollection: (data: NftCollection) => void, updateReady: (ready: boolean) => void): Promise<number>;
}
