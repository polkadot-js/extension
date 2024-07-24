// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftCollection, NftItem } from '@subwallet/extension-base/background/KoniTypes';
import { COLLECT_ID } from '@subwallet/extension-base/koni/api/nft/blobinscription/consts';
import { ALC, getNftDetail, NftResponse, RemarkData, transferPayload } from '@subwallet/extension-base/koni/api/nft/blobinscription/types';
import { AVAIL_LIGHT_CLIENT_NFT } from '@subwallet/extension-base/koni/api/nft/config';
import { BaseNftApi, HandleNftParams } from '@subwallet/extension-base/koni/api/nft/nft';

import { hexToString } from '@polkadot/util';

export class BlobInscriptionApi extends BaseNftApi {
  endpoint = AVAIL_LIGHT_CLIENT_NFT;

  constructor (chain: string, addresses: string[]) {
    super(chain, undefined, addresses);
  }

  // Get all NFTs //

  private static parseNftRequestRemark () {
    return {
      query: `
        query MyQuery {
          remarks(where: {sender: {address_eq: "5CvsA5aWiDLfnxg7fdyvXzPx6tdrNp2rcqigTMKCSEZTHaWn"}}, limit: 9000) {
            dataRaw
          }
        }
      `
    };
  }

  private async getAllInscriptions () {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(BlobInscriptionApi.parseNftRequestRemark())
    });

    const result = await response.json() as RemarkData;

    return result.data.remarks;
  }

  private async getNftMap () {
    const nftMap: Record<string, string[]> = {};
    const rawList = await this.getAllInscriptions();

    rawList.forEach((item) => {
      const jsonData = JSON.parse(hexToString(item.dataRaw)) as transferPayload;

      if (nftMap[jsonData.to]) {
        nftMap[jsonData.to].push(jsonData.tick);
      }

      nftMap[jsonData.to] = [jsonData.tick];
    });

    return nftMap;
  }

  // Get all NFTs //

  // Deprecated: Old get NFTs balance //

  private static parseNftRequest (address: string, isJson = true) {
    // noted: check to handle isJson
    return {
      query: `
        query MyQuery {
          dataAvailabilities(where: {sender: {address_eq: "${address}"}, isJson_eq: ${isJson.toString()}}) {
            id
            extrinsicHash
            dataRaw
            dataValue
            isJson
            sender {
              address
            }
          }
        }
      `
    };
  }

  // @ts-ignore
  private async getBalances (address: string) {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(BlobInscriptionApi.parseNftRequest(address))
    });

    const result = await response.json() as NftResponse;

    return result?.data?.dataAvailabilities;
  }

  private handleProperties (data: ALC) {
    const propertiesMap: Record<string, any> = {};
    const attRecord = data.traits;

    if (attRecord) {
      for (const [name, value] of Object.entries(attRecord)) {
        console.log(name, value);
        propertiesMap[name] = {
          value: value as string
        };
      }
    }

    return propertiesMap;
  }

  public async handleNfts (params: HandleNftParams) {
    const allInscriptionsMap = await this.getNftMap();

    try {
      // eslint-disable-next-line array-callback-return
      await Promise.all(this.addresses.map((address) => {
        const nfts = allInscriptionsMap[address];

        if (nfts) {
          const collectionMap: Record <string, NftCollection> = {};

          for (const nft of nfts) {
            const nftDetail = getNftDetail(nft);

            if (!nftDetail) {
              continue;
            }

            const propertiesMap = this.handleProperties(nftDetail);

            const parsedNft: NftItem = {
              id: address, // is distinct?
              chain: this.chain,
              owner: address,
              name: nftDetail.name,
              image: nftDetail.imgUrl,
              collectionId: nftDetail.tick,
              properties: propertiesMap
            };

            params.updateItem(this.chain, parsedNft, address);

            if (!collectionMap[nftDetail.tick]) {
              const parsedCollection: NftCollection = {
                collectionId: nftDetail.tick,
                chain: this.chain,
                collectionName: COLLECT_ID
              };

              collectionMap[nftDetail.tick] = parsedCollection;
              params.updateCollection(this.chain, parsedCollection);
            }
          }
        }
      }));
    } catch (error) {
      console.error('Failed to fetch blob inscription', error);
    }
  }

  public async fetchNfts (params: HandleNftParams): Promise<number> {
    try {
      await this.handleNfts(params);
    } catch (e) {
      return 0;
    }

    return 1;
  }
}
