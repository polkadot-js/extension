// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftCollection, NftItem } from '@subwallet/extension-base/background/KoniTypes';
import { _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { baseParseIPFSUrl } from '@subwallet/extension-base/utils';

export interface HandleNftParams {
  updateItem: (chain: string, data: NftItem, owner: string) => void,
  updateCollection: (chain: string, data: NftCollection) => void
}

export abstract class BaseNftApi {
  chain = '';
  substrateApi: _SubstrateApi | null = null;
  evmApi: _EvmApi | null = null;
  data: NftCollection[] = [];
  total = 0;
  addresses: string[] = [];
  isEthereum = false;

  protected constructor (chain: string, substrateApi?: _SubstrateApi | null, addresses?: string[], evmApi?: _EvmApi) {
    if (substrateApi) {
      this.substrateApi = substrateApi;
    }

    if (addresses) {
      this.addresses = addresses;
    }

    this.chain = chain;

    if (evmApi) {
      this.evmApi = evmApi;
    }
  }

  async connect () {
    if (!this.substrateApi?.isApiConnected) {
      this.substrateApi = await this.substrateApi?.isReady as _SubstrateApi;
    }
  }

  recoverConnection () {
    if (!this.substrateApi?.isApiConnected) {
      this.substrateApi?.recoverConnect && this.substrateApi.recoverConnect();
    }
  }

  getSubstrateApi () {
    return this.substrateApi;
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

  setSubstrateApi (api: _SubstrateApi) {
    this.substrateApi = api;
  }

  setChain (chain: string) {
    this.chain = chain;
  }

  setAddresses (addresses: string[]) {
    this.addresses = addresses;
  }

  protected parseTokenId (tokenId: string) {
    if (tokenId.includes(',')) {
      return tokenId.replaceAll(',', '');
    }

    return tokenId;
  }

  parseUrl (input: string): string | undefined {
    return baseParseIPFSUrl(input);
  }

  // Subclass implements this function to parse data into prop result
  abstract handleNfts(params: HandleNftParams): void;

  abstract fetchNfts(params: HandleNftParams): Promise<number>;
}
