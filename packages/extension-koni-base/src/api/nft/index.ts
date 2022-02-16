// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {ApiProps, NftCollection, NftJson} from '@polkadot/extension-base/background/KoniTypes';
import {BaseNftApi} from "@polkadot/extension-koni-base/api/nft/nft";
import {KaruraNftApi} from "@polkadot/extension-koni-base/api/nft/karura_nft";
import {AcalaNftApi} from "@polkadot/extension-koni-base/api/nft/acala_nft";
import UniqueNftApi from "@polkadot/extension-koni-base/api/nft/unique_nft";
import StatemineNftApi from "@polkadot/extension-koni-base/api/nft/statemine_nft";
import {RmrkNftApi} from "@polkadot/extension-koni-base/api/nft/rmrk_nft";

const NFT_TIMEOUT = 30000

enum SUPPORTED_NFT_NETWORKS {
  karura = 'karura',
  acala = 'acala',
  rmrk = 'rmrk',
  statemine = 'statemine',
  uniqueNft = 'uniqueNft'
}

function createNftApi(chain: string, api: ApiProps, addresses: string[]): BaseNftApi | null {
  switch (chain) {
    case SUPPORTED_NFT_NETWORKS.karura:
      return new KaruraNftApi(api, addresses, chain);
    case SUPPORTED_NFT_NETWORKS.acala:
      return new AcalaNftApi(api, addresses, chain);
    case SUPPORTED_NFT_NETWORKS.rmrk:
      let rmrkNftApi = new RmrkNftApi();
      rmrkNftApi.setChain(SUPPORTED_NFT_NETWORKS.rmrk);
      rmrkNftApi.setAddresses(addresses);
      return rmrkNftApi;
    case SUPPORTED_NFT_NETWORKS.statemine:
      return new StatemineNftApi(api, addresses, chain);
    case SUPPORTED_NFT_NETWORKS.uniqueNft:
      return new UniqueNftApi(api, addresses, chain);
  }

  return null;
}

export class NftHandler {
  apiPromises: Record<string, any>[] = [];
  handlers: BaseNftApi[] = [];
  addresses: string[] = ['Fys7d6gikP6rLDF9dvhCJcAMaPrrLuHbGZRVgqLPn26fWmr', 'seAJwjS9prpF7BLXK2DoyuYWZcScrtayEN5kwsjsXmXQxrp', '7Hja2uSzxdqcJv1TJi8saFYsBjurQZtJE49v4SXVC5Dbm8KM'];
  total: number = 0;
  data: NftCollection[] = [];
  running: boolean = false;

  constructor(dotSamaAPIMap: Record<string, ApiProps>, addresses?: string[]) {
    if (addresses) this.addresses = addresses;

    for (let item in SUPPORTED_NFT_NETWORKS) {
      this.apiPromises.push({chain: item, api: dotSamaAPIMap[item]});
    }
  }

  setAddresses (addresses: string[]) {
    this.addresses = addresses;
  }

  private async connect () {
    if (this.handlers.length > 0) {
      await Promise.all(this.handlers.map(async handler => {
        await handler.connect();
      }));
    }
    else {
      await Promise.all(this.apiPromises.map(async ({chain, api: apiPromise}) => {
        if (apiPromise) {
          const parentApi: ApiProps = await apiPromise.isReady;
          let handler = createNftApi(chain, parentApi, this.addresses);
          if (handler) this.handlers.push(handler);
        }
      }));
    }
  }

  public async handleNfts () {
    if (this.running) {
      console.log('already fetching nft')
      return;
    }

    this.running = true;
    await this.connect();
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

    if (total > this.total) {
      console.log(`nft old length: ${this.total}, new length: ${total}`);
      this.total = total;
      this.data = data;
    }
    this.running = false;
  }

  public getTotal() {
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
    } as NftJson
  }
}


// nft test address
// unique: 5GedyoC1nULnjzk3m8qjZznsAtpnJPUQREVLDcXcgD1yLwrb
// statemine: Fys7d6gikP6rLDF9dvhCJcAMaPrrLuHbGZRVgqLPn26fWmr
// singular rmrk: DMkCuik9UA1nKDZzC683Hr6GMermD8Tcqq9HvyCtkfF5QRW
// birds kanaria rmrk: Fys7d6gikP6rLDF9dvhCJcAMaPrrLuHbGZRVgqLPn26fWmr
// kanaria rmrk: Fys7d6gikP6rLDF9dvhCJcAMaPrrLuHbGZRVgqLPn26fWmr
// karura: Fys7d6gikP6rLDF9dvhCJcAMaPrrLuHbGZRVgqLPn26fWmr
// acala: 16J48LCbpH9j1bVngG6E3Nj4NaZFy9SDCSZdg1YjwDaNdMVo
