import {ChainRegistry} from "@polkadot/extension-base/background/KoniTypes";
import {store} from "@polkadot/extension-koni-ui/stores";
import {useEffect} from "react";
import {subscribeChainRegistry} from "@polkadot/extension-koni-ui/messaging";

function updateChainRegistry(map: Record<string, ChainRegistry>): void {
  console.log('ChainRegistry', map);
  store.dispatch({type: 'chainRegistry/update', payload: map});
}

export default function useSetupChainRegistry(): void {
  useEffect((): void => {
    console.log('--- Setup redux: ChainRegistry');
    subscribeChainRegistry(updateChainRegistry)
      .then(updateChainRegistry)
      .catch(console.error);
  }, []);
}
