// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftCollection, NftItem } from '@subwallet/extension-base/background/KoniTypes';
import { AVAIL_LIGHT_CLIENT_NFT } from '@subwallet/extension-base/koni/api/nft/config';
import { BaseNftApi, HandleNftParams } from '@subwallet/extension-base/koni/api/nft/nft';

interface NftResponse {
  data: {
    dataAvailabilities: NftData[]
  }
}

const COLLECT_ID = 'ALC_NFT';

interface NftData {
  isJson: boolean,
  id: string,
  extrinsicHash: string,
  dataValue: string,
  dataRaw: string,
  sender: {
    address: string
  }
}

interface ALC { // need confirm
  p: string,
  op: string,
  tick: string,
  imgUrl: string,
  name: string,
  traits: Record<string, any>
}

export class BlobInscriptionApi extends BaseNftApi {
  endpoint = AVAIL_LIGHT_CLIENT_NFT;

  constructor (chain: string, addresses: string[]) {
    super(chain, undefined, addresses);
  }

  private static parseNftRequest (address: string, isJson = true) {
    return {
      query: `
        query MyQuery {
          dataAvailabilities(where: {sender: {address_eq: "${address}"}, isJson_eq: ${isJson}}) {
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

  public async handleNfts (params: HandleNftParams) {
    try {
      await Promise.all(this.addresses.map(async (address) => {
        const balances = await this.getBalances(address);

        if (balances.length > 0) {
          const collectionMap: Record <string, NftCollection> = {};

          for (const nft of balances) {
            try {
              if (nft.isJson) {
                const _data = JSON.parse(nft.dataValue) as ALC | number;

                if (_data === Infinity) { // check truly json
                  continue;
                }

                const data = _data as ALC;

                if (data.op === 'create_collection') { // skip extrinsic creat collection
                  continue;
                }

                const propertiesMap = this.handleProperties(data);

                const parsedNft: NftItem = {
                  id: nft.id, // is distinct?
                  chain: this.chain,
                  owner: address, // is submitter = owner? '5Hawkn8oUeSTB3LesTh5nGjfnpor2ZWBArdQ64d6BxgD5Pgm'
                  name: data.tick,
                  image: data.imgUrl, // recheck
                  collectionId: COLLECT_ID,
                  properties: propertiesMap
                };

                params.updateItem(this.chain, parsedNft, address); // '5Hawkn8oUeSTB3LesTh5nGjfnpor2ZWBArdQ64d6BxgD5Pgm'

                if (!collectionMap[COLLECT_ID]) {
                  const parsedCollection: NftCollection = {
                    collectionId: COLLECT_ID,
                    chain: this.chain,
                    collectionName: COLLECT_ID
                  };

                  collectionMap[COLLECT_ID] = parsedCollection;
                  params.updateCollection(this.chain, parsedCollection);
                }
              }
            } catch (e) {
              console.error(`Failed to fetch blob inscription ${nft.dataValue}`, e);
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
