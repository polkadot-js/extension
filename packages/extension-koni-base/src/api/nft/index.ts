// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, NftCollection, NftJson } from '@polkadot/extension-base/background/KoniTypes';
import { AcalaNftApi } from '@polkadot/extension-koni-base/api/nft/acala_nft';
import { KaruraNftApi } from '@polkadot/extension-koni-base/api/nft/karura_nft';
import { BaseNftApi } from '@polkadot/extension-koni-base/api/nft/nft';
import QuartzNftApi from '@polkadot/extension-koni-base/api/nft/quartz_nft';
import { RmrkNftApi } from '@polkadot/extension-koni-base/api/nft/rmrk_nft';
import StatemineNftApi from '@polkadot/extension-koni-base/api/nft/statemine_nft';
import UniqueNftApi from '@polkadot/extension-koni-base/api/nft/unique_nft';

const NFT_TIMEOUT = 20000;

enum SUPPORTED_NFT_NETWORKS {
  karura = 'karura',
  acala = 'acala',
  rmrk = 'rmrk',
  statemine = 'statemine',
  uniqueNft = 'uniqueNft',
  quartz = 'quartz'
}

function createNftApi (chain: string, api: ApiProps, addresses: string[]): BaseNftApi | null {
  switch (chain) {
    case SUPPORTED_NFT_NETWORKS.karura:
      return new KaruraNftApi(api, addresses, chain);
    case SUPPORTED_NFT_NETWORKS.acala:
      return new AcalaNftApi(api, addresses, chain);
    case SUPPORTED_NFT_NETWORKS.rmrk:
      const rmrkNftApi = new RmrkNftApi();

      rmrkNftApi.setChain(SUPPORTED_NFT_NETWORKS.rmrk);
      rmrkNftApi.setAddresses(addresses);

      return rmrkNftApi;
    case SUPPORTED_NFT_NETWORKS.statemine:
      return new StatemineNftApi(api, addresses, chain);
    case SUPPORTED_NFT_NETWORKS.uniqueNft:
      return new UniqueNftApi(api, addresses, chain);
    case SUPPORTED_NFT_NETWORKS.quartz:
      return new QuartzNftApi(api, addresses, chain);
  }

  return null;
}

export class NftHandler {
  apiPromises: Record<string, any>[] = [];
  handlers: BaseNftApi[] = [];
  addresses: string[] = [];
  total = 0;
  data: NftCollection[] = [];

  constructor (dotSamaAPIMap: Record<string, ApiProps>, addresses?: string[]) {
    if (addresses) this.addresses = addresses;

    for (const item in SUPPORTED_NFT_NETWORKS) {
      this.apiPromises.push({ chain: item, api: dotSamaAPIMap[item] });
    }
  }

  setAddresses (addresses: string[]) {
    this.addresses = addresses;
    this.handlers.map((handler) => {
      handler.setAddresses(addresses);
    });
  }

  private async connect () {
    if (this.handlers.length > 0) {
      await Promise.all(this.handlers.map(async (handler) => {
        await handler.connect();
      }));
    } else {
      await Promise.all(this.apiPromises.map(async ({ api: apiPromise, chain }) => {
        if (apiPromise) {
          const parentApi: ApiProps = await apiPromise.isReady;
          const handler = createNftApi(chain, parentApi, this.addresses);

          if (handler && !this.handlers.includes(handler)) this.handlers.push(handler);
        }
      }));
    }
  }

  public async handleNfts () {
    await this.connect();
    console.log(`fetching nft from ${this.handlers.length} chains`, this.addresses);

    let total = 0;
    let data: NftCollection[] = [];
    let timer: any;

    const allPromises = Promise.all(this.handlers.map(async (handler) => {
      await handler.handleNfts();
      total += handler.getTotal();
      data = [...data, ...handler.getData()];
    }));

    // Set timeout for all requests
    await Promise
      .race([allPromises, new Promise((_r, rej) => timer = setTimeout(rej, NFT_TIMEOUT))])
      .finally(() => clearTimeout(timer));

    this.total = total;
    this.data = data;

    console.log(`done fetching ${total} nft from rpc`);
  }

  public getTotal () {
    return this.total;
  }

  public getNfts () {
    return this.data;
  }

  public getNftJson () {
    return {
      ready: true,
      total: this.total,
      nftList: this.data
    } as NftJson;
  }
}
