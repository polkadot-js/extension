// [object Object]
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import { ApiProps, NftCollection } from '@polkadot/extension-base/background/KoniTypes';
import { PINATA_SERVER } from '@polkadot/extension-koni-base/api/nft/config';
import { isUrl } from '@polkadot/extension-koni-base/utils/utils';

export abstract class BaseNftApi {
  chain: string | null = null;
  dotSamaApi: ApiProps | null = null;
  data: NftCollection[] = [];
  total = 0;
  addresses: string[] = [];

  protected constructor (api?: ApiProps, addresses?: string[], chain?: string) {
    if (api) this.dotSamaApi = api;
    if (addresses) this.addresses = addresses;
    if (chain) this.chain = chain;
  }

  async connect () {
    await this.dotSamaApi?.isReady;
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
    if (tokenId.includes(',')) return tokenId.replace(',', '');

    return tokenId;
  }

  parseUrl (input: string): string | undefined {
    if (!input || input.length === 0) return undefined;

    if (isUrl(input)) return input;

    if (!input.includes('ipfs://')) {
      return PINATA_SERVER + input;
    }

    return PINATA_SERVER + input.split('ipfs://ipfs/')[1];
  }

  // Sub-class implements this function to parse data into prop result
  abstract handleNfts(): void;
}
