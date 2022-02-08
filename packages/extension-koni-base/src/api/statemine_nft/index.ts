import { ApiPromise } from '@polkadot/api';
import { wsProvider } from '../connector';
import networks from '../endpoints';
import {getMetadata} from "@polkadot/extension-koni-base/api/rmrk_nft";

interface AssetId {
  classId: string | number,
  tokenId: string | number
}

export default class StatemineNftApi {
  api : ApiPromise| null = null

  constructor() {
  }

  public async connect() {
      this.api = await wsProvider(networks.statemine)
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
    if(!this.api) return []
    const accountAssets = await this.api.query.uniques.account.keys(address);

    let assetIds: AssetId[] = [];
    for (let key of accountAssets) {
      const data = key.toHuman() as string[];
      assetIds.push({ classId: data[1], tokenId: data[2]});
    }
    return assetIds
  }

  public async getTokenDetails(assetId: AssetId): Promise<any> {
    if(!this.api) return
    const { classId, tokenId } = assetId
    const metadataNft = (await this.api.query.uniques.instanceMetadataOf(classId, tokenId)).toHuman() as any;
    const result = await getMetadata(metadataNft.data)
    return result
  }

}
