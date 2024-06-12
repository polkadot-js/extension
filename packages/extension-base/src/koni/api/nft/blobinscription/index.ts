// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NftCollection, NftItem } from '@subwallet/extension-base/background/KoniTypes';
import { AVAIL_LIGHT_CLIENT_NFT } from '@subwallet/extension-base/koni/api/nft/config';
import { BaseNftApi, HandleNftParams } from '@subwallet/extension-base/koni/api/nft/nft';
import BigNumber from 'bignumber.js';

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
  amt: BigNumber,
  val: BigNumber
}

export class BlobInscriptionApi extends BaseNftApi {
  endpoint = AVAIL_LIGHT_CLIENT_NFT;

  constructor (chain: string, addresses: string[]) {
    super(chain, undefined, addresses);
  }

  // @typescript-eslint/restrict-template-expressions
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

    // const testResult = [
    //   {
    //     isJson: false,
    //     id: '0000116353-c5fc0-000001',
    //     extrinsicHash: '0x2b0a2945216f79032606a2cb10b7f846931f8016ff786e3eee3f0a15463e4548',
    //     dataValue: 'example data',
    //     dataRaw: '0x6578616d706c652064617461',
    //     blockNumber: 116353,
    //     action: 'DataAvailability.submit_data',
    //     sender: {
    //       address: '5GgRqSNN1zTsjA6N7cofcdP9yewA6JG83S649HbuBut8MG4o'
    //     }
    //   },
    //   {
    //     isJson: true,
    //     id: '0000116822-9e7a8-000001',
    //     extrinsicHash: '0x45489cf02dd047f95242576829a5373231049b290c8354a4d8615bae02e5c05b',
    //     dataValue: '{"p":"pdc-20","op":"LIST","tick":"TEST","val":"100","amt":"100000"}',
    //     dataRaw: '0x6578616d706c652064617461',
    //     blockNumber: 116822,
    //     action: 'DataAvailability.submit_data',
    //     sender: {
    //       address: '5GgRqSNN1zTsjA6N7cofcdP9yewA6JG83S649HbuBut8MG4o'
    //     }
    //   }
    // ];
    //
    // return testResult;
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

                if (_data === Infinity) {
                  continue;
                }

                const data = _data as ALC;

                const parsedNft: NftItem = {
                  id: data.tick, // is distinct?
                  chain: this.chain,
                  owner: address, // is submitter = owner? '5Hawkn8oUeSTB3LesTh5nGjfnpor2ZWBArdQ64d6BxgD5Pgm'
                  name: data.tick,
                  image: 'https://ipfs.uniquenetwork.dev/ipfs/Qmap7uz7JKZNovCdLfdDE3p4XA6shghdADS7EsHvLjL6jT/nft_image_43.png', // recheck
                  description: 'abc', // recheck
                  collectionId: COLLECT_ID
                  // properties: data
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
