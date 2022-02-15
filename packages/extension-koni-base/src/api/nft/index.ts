// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {ApiProps} from '@polkadot/extension-base/background/KoniTypes';
import NETWORKS from "@polkadot/extension-koni-base/api/endpoints";
import {BaseNftApi} from "@polkadot/extension-koni-base/api/nft/nft";
import KaruraNftApi from "@polkadot/extension-koni-base/api/nft/karura_nft";

const SUPPORTED_NFT_NETWORKS = {
  'karura': NETWORKS.karura,
  'acala': NETWORKS.acala,
  'rmrk': NETWORKS.rmrk,
  'statemine': NETWORKS.statemine,
  'quartz': NETWORKS.quartz
}

function createNftApi(chain: string, api: ApiProps, addresses: string[]): BaseNftApi | null {
  switch (chain) {
    case 'karura':
      return new KaruraNftApi(api, addresses, chain);
  }

  return null;
}

export class NftHandler {
  apiPromises: Record<string, any>[] = [];
  handlers: BaseNftApi[] = [];
  addresses: string[] = [];

  constructor(dotSamaAPIMap: Record<string, ApiProps>, addresses: string[]) {
    this.addresses = addresses;

    Object.entries(SUPPORTED_NFT_NETWORKS).forEach(([networkKey, networkInfo]) => {
      this.apiPromises.push({chain: networkKey, api: dotSamaAPIMap[networkKey]});
    });
  }

  async connect () {
    await Promise.all(this.apiPromises.map(async ({chain, api: apiPromise}) => {
      const parentApi: ApiProps = await apiPromise.isReady;
      let handler = createNftApi(chain, parentApi, this.addresses);
      if (handler) this.handlers.push(handler);
    }));
  }

  public async handleNfts () {
    await this.connect();

    await Promise.all(this.handlers.map(async (handler) => {
      console.log(handler.getChain());
      handler.handleNfts();
    }));
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
