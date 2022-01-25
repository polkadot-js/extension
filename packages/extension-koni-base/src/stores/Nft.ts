import SubscribableStore from "@polkadot/extension-koni-base/stores/SubcribableStore";
import {NftJson} from "@polkadot/extension-koni-base/stores/types";
import {EXTENSION_PREFIX} from "@polkadot/extension-base/defaults";

export default class NftStore extends SubscribableStore<NftJson> {
  constructor () {
    super(EXTENSION_PREFIX ? `${EXTENSION_PREFIX}nft` : null);
  }
}
