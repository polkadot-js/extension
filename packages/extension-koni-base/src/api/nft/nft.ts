import {ApiProps, NftCollection} from "@polkadot/extension-base/background/KoniTypes";
import {isUrl} from "@polkadot/extension-koni-base/utils/utils";
import {PINATA_SERVER} from "@polkadot/extension-koni-base/api/nft/rmrk_nft/config";

export abstract class BaseNftApi {
  chain: string | null = null;
  dotSamaApi: ApiProps | null = null;
  data: NftCollection[] | null = null;
  total: number = 0;
  addresses: string[] = [];

  protected constructor (api: ApiProps, addresses: string[], chain?: string) {
    this.dotSamaApi = api;
    this.addresses = addresses;
    if (chain) this.chain = chain;
  };

  getChain() {
    return this.chain;
  }

  getData () {
    return this.data;
  }

  setApi (api: ApiProps) {
    this.dotSamaApi = api;
  };

  setAddresses (addresses: string[]) {
    this.addresses = addresses;
  };

  parseUrl(input: string): string | undefined {
    if (!input || input.length === 0) return undefined;

    if (isUrl(input)) return input;

    if (!input.includes('ipfs://')) {
      return PINATA_SERVER + input;
    }

    return PINATA_SERVER + input.split('ipfs://ipfs/')[1];
  };

  // Sub-class implements this function to parse data into prop result
  abstract handleNfts(): void;
}
