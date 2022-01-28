import SubscribableStore from "@polkadot/extension-koni-base/stores/SubcribableStore";
import {StakingJson} from "@polkadot/extension-koni-base/stores/types";
import {EXTENSION_PREFIX} from "@polkadot/extension-base/defaults";

export default class StakingStore extends SubscribableStore<StakingJson> {
  constructor () {
    super(EXTENSION_PREFIX ? `${EXTENSION_PREFIX}staking` : null);
  }
}
