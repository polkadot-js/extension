// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { TERNOA_MAINNET_CLIENT_NFT } from '../config';
import { BaseNftApi, HandleNftParams } from '../nft';

interface NftMetadata {
  nftId: string;
  owner: string;
  creator: string;
  collectionId: string;
  offchainData: string;
}

export class TernoaNftApi extends BaseNftApi {
  endpoint = TERNOA_MAINNET_CLIENT_NFT;

  constructor (chain: string, addresses: string[]) {
    super(chain, undefined, addresses);
  }

  private static getNftsQuery (address: string) {
    return {
      query: `
            query {
                nftEntities(
                    filter: {
                        owner: { equalTo: "${address}" }
                    }
                ) {
                  totalCount
                    nodes {
                        nftId
                        owner
                        creator
                        collectionId
                        offchainData
                    }
                  }
                }`
    };
  }

  public async fetchGetNfts (address: string): Promise<NftMetadata[] | null> {
    const query = TernoaNftApi.getNftsQuery(address);

    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(query)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const result = await response.json();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const nftEntities = result?.data?.nftEntities?.nodes;

      if (nftEntities && Array.isArray(nftEntities)) {
        return nftEntities as NftMetadata[];
      }

      return null;
    } catch (error) {
      console.error('Error fetching NFTs:', error);

      return null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public async handleNfts (params: HandleNftParams): Promise<void> {
    throw new Error('Method not implemented.');
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
