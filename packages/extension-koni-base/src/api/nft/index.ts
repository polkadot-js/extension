// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {ApiProps} from '@polkadot/extension-base/background/KoniTypes';
import {BaseNftApi} from "@polkadot/extension-koni-base/api/nft/nft";
import {KaruraNftApi} from "@polkadot/extension-koni-base/api/nft/karura_nft";
import {AcalaNftApi} from "@polkadot/extension-koni-base/api/nft/acala_nft";
import UniqueNftApi from "@polkadot/extension-koni-base/api/nft/unique_nft";
import StatemineNftApi from "@polkadot/extension-koni-base/api/nft/statemine_nft";
import {RmrkNftApi} from "@polkadot/extension-koni-base/api/nft/rmrk_nft";

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
  addresses: string[] = [];

  constructor(dotSamaAPIMap: Record<string, ApiProps>, addresses: string[]) {
    // console.log(dotSamaAPIMap)
    this.addresses = addresses;

    for (let item in SUPPORTED_NFT_NETWORKS) {
      this.apiPromises.push({chain: item, api: dotSamaAPIMap[item]});
    }
  }

  private async connect () {
    await Promise.all(this.apiPromises.map(async ({chain, api: apiPromise}) => {
      if (apiPromise) {
        const parentApi: ApiProps = await apiPromise.isReady;
        let handler = createNftApi(chain, parentApi, this.addresses);
        if (handler) this.handlers.push(handler);
      }
    }));
  }

  public async handleNfts () {
    await this.connect();
    await Promise.all(this.handlers.map(async (handler) => {
      handler.handleNfts();
    }));
  }

  public getNfts () {
    if (this.handlers.length > 0) {
      for (let handler of this.handlers) {
        console.log(handler.getChain());
        console.log(handler.getData());
      }
    }
  }
}

// export const getAllNftsByAccount = async (account: string): Promise<NftJson> => {
//   try {
//     const kusamaAddress = reformatAddress(account, 2);
//     const _rmrkNfts = handleRmrkNfts(kusamaAddress);
//
//     // const _uniqueNfts = handleUniqueNfts(account);
//     //
//     // const _statemineNfts = handleStatemineNfts(account);
//     //
//     // const _karuraNfts = handleKaruraNfts(account);
//     //
//     // const _acalaNfts = handleAcalaNfts(account);
//
//     // const [rmrkNfts, uniqueNfts, statemineNfts, karuraNfts, acalaNfts] = await Promise.all([
//     //   _rmrkNfts,
//     //   _uniqueNfts,
//     //   _statemineNfts,
//     //   _karuraNfts,
//     //   _acalaNfts
//     // ]);
//
//     // const total = rmrkNfts.total + uniqueNfts.total + statemineNfts.total + karuraNfts.total + acalaNfts.total;
//     // const allCollections = [
//     //   ...rmrkNfts.allCollections,
//     //   ...uniqueNfts.allCollections,
//     //   ...statemineNfts.allCollections,
//     //   ...karuraNfts.allCollections,
//     //   ...acalaNfts.allCollections
//     // ];
//
//     // const [statemineNfts] = await Promise.all([_statemineNfts]);
//     // let total = statemineNfts.total;
//     // let allCollections = [...statemineNfts.allCollections]
//
//     console.log('promise')
//     console.log(_rmrkNfts)
//     const total = 0
//     const allCollections: any[] = []
//     console.log(`Fetched ${total} nfts from api for account ${account}`);
//
//     return {
//       total,
//       nftList: allCollections
//     } as NftJson;
//   } catch (e) {
//     console.error('Failed to fetch nft from api', e);
//     throw e;
//   }
// };
