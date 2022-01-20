import { ApiPromise } from '@polkadot/api';
import { wsProvider } from '../connector';
import networks from '../endpoints';
import { deserializeNft } from './protobuf';
import unique_types from './runtime_types';

interface Collection {
   SchemaVersion: string,
   OffchainSchema: string,
   ConstOnChainSchema: string,
   TokenPrefix: string,
   Description: number[],
   Name: number[]
}

interface Token {
   ConstData: string,
   Owner: string
}

function hexToStr(buf: String): string {
   let str = "";
   let hexStart = buf.indexOf("0x");
   if (hexStart < 0) hexStart = 0;
   else hexStart = 2;
   for (let i = hexStart, strLen = buf.length; i < strLen; i += 2) {
      let ch = buf[i] + buf[i + 1];
      let num = parseInt(ch, 16);
      if (num != 0) str += String.fromCharCode(num);
      else break;
   }
   return str;
}

function utf16ToString(uint16_array: Array<number>): string {
   let str = "";
   for (var i = 0; i < uint16_array.length; i++)
      str += String.fromCharCode(uint16_array[i]);
   return str;
}

function hexToUTF16(hex: string): Uint8Array {
   let buf = [];
   let hexStart = hex.indexOf("0x");
   if (hexStart < 0) hexStart = 0;
   else hexStart = 2;
   for (let i = hexStart, strLen = hex.length; i < strLen; i += 2) {
      let ch = hex[i] + hex[i + 1];
      let num = parseInt(ch, 16);
      buf.push(num);
   }
   return new Uint8Array(buf);
}

export default class UniqueNftApi {
   api: ApiPromise = new ApiPromise();

   constructor() {
   }

   public async connect() {
     if(unique_types.types)
        this.api = await wsProvider(networks.uniqueNft, unique_types.types[0]?.types)
   }

   public async disconnect() {
      this.api.disconnect();
   }

   /**
    * Retrieve address of NFTs
    *
    * @param collectionId: Id of the collection
    * @param owner: address of account
    * @returns the array of NFTs
    */
   public async getAddressTokens(collectionId: number, owner: string): Promise<any> {
      const data = (await this.api.query.nft.addressTokens(collectionId, owner)).toJSON();
      return data;
   }

   /**
    * Retrieve NFT image URL according to the collection offchain schema
    *
    * @param collectionId: Id of the collection
    * @param tokenId: Token ID
    * @returns the URL of the token image
    */
   public async getNftImageUrl(collectionId: number, tokenId: string) {
      const collection = (await this.api.query.nft.collectionById(collectionId)).toJSON() as unknown as Collection

      let url = '';

      // Get schema version and off-chain schema
      if (!collection) return
      const schemaVersion = collection.SchemaVersion;
      const offchainSchema = hexToStr(collection.OffchainSchema);
      if (schemaVersion == "ImageURL") {
         // Replace {id} with token ID
         url = offchainSchema;
         url = url.replace("{id}", `${tokenId}`);
      } else {
         // TBD: Query image URL from the RESTful service
      }
     console.log(`NFT ${collectionId}-${tokenId} Image URL: `, url);
      return url;
   }

   /**
    * Retrieve and deserialize properties
    *
    *
    * @param collectionId: Id of the collection
    * @param tokenId: Token ID
    * @param locale: Output locale (default is "en")
    * @returns tokenData: Token data object
    */
   public async getNftData(collectionId: number, tokenId: string, locale = "en") {
      const collection = (await this.api.query.nft.collectionById(collectionId)).toJSON() as unknown as Collection;
      const schemaRead = hexToStr(collection.ConstOnChainSchema);
      const token = (await this.api.query.nft.nftItemList(collectionId, tokenId)).toJSON() as unknown as Token;
      const nftProps = hexToUTF16(token.ConstData);
      const properties = deserializeNft(schemaRead, nftProps, locale);

      let url = '';

      // Get schema version and off-chain schema
      if (!collection) return
      const schemaVersion = collection.SchemaVersion;
      const offchainSchema = hexToStr(collection.OffchainSchema);
      if (schemaVersion == "ImageURL") {
         // Replace {id} with token ID
         url = offchainSchema;
         url = url.replace("{id}", `${tokenId}`);
      } else {
         // TBD: Query image URL from the RESTful service
      }

      let tokenData = {
         owner: token.Owner,
         prefix: hexToStr(collection.TokenPrefix),
         collectionName: utf16ToString(collection.Name),
         collectionDescription: utf16ToString(collection.Description),
         properties: properties,
         image: url
      };

      console.log(`NFT ${collectionId}-${tokenId} data: `, tokenData);
      return tokenData;
   }
}
