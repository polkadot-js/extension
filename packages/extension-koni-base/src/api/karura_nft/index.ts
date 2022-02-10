import { ApiPromise } from '@polkadot/api';
import { wsProvider } from '../connector';
import networks from '../endpoints';
import fetch from "node-fetch";
import {CLOUDFALRE_SERVER} from "@polkadot/extension-koni-base/api/rmrk_nft/config";

interface AssetId {
  classId: string | number,
  tokenId: string | number
}

interface Collection {
  name: string,
  description: string,
  image: string
}

interface Token {
  metadata: string | undefined,
  owner: string,
  data: Record<string, any>
}

export default class KaruraNftApi {
  api : ApiPromise| null = null;

  constructor() {
  }

  public async connect() {
      this.api = await wsProvider(networks.karura);
  }

  public async disconnect() {
    if(this.api)
      await this.api.disconnect();
  }

  /**
   * Retrieve id of NFTs
   *
   * @param owner: address of account
   * @returns the array of NFT Ids
   */
  public async getNfts(address: string): Promise<AssetId[]> {
    if(!this.api) return [];
    const accountAssets = await this.api.query.ormlNFT.tokensByOwner.keys(address);
    let assetIds: AssetId[] = [];
    for (let key of accountAssets) {
      const data = key.toHuman() as string[];
      assetIds.push({ classId: data[1], tokenId: data[2]});
    }
    return assetIds;
  }

  public async getCollectionDetails(collectionId: number | string): Promise<any> {
    if(!this.api) return null;

    const metadataCollection = (await this.api.query.ormlNFT.classes(collectionId)).toHuman() as any;
    if (!metadataCollection?.metadata) return null;

    const data = await getMetadata(metadataCollection?.metadata) as unknown as Collection;

    return {...data, image: parseIpfsLink(data.image)}

  }

  public async getTokenDetails(assetId: AssetId): Promise<any> {
    if(!this.api) return null;
    const rs = (await this.api.query.ormlNFT.tokens(assetId.classId, assetId.tokenId)).toHuman() as unknown as Token;
    return rs;
  }
}

const headers = {
  'Content-Type': 'application/json'
};

const getMetadata = (metadata_url: string) => {
  let url: string | null = metadata_url;
  if (!metadata_url) return null;
  url = CLOUDFALRE_SERVER + metadata_url + '/metadata.json';

  return fetch(url, {
    method: 'GET',
    headers
  })
    .then((res) => res.json());
};


const parseIpfsLink = (ipfsLink: string) => {
  if (!ipfsLink || ipfsLink.length === 0) return null;

  if (!ipfsLink.includes('ipfs://'))
    return CLOUDFALRE_SERVER + ipfsLink;

  return CLOUDFALRE_SERVER + ipfsLink.split('ipfs://')[1];

}
