import {store} from "@polkadot/extension-koni-ui/stores";
import {useEffect} from "react";
import {getAllNetworkMetadata} from "@polkadot/extension-koni-ui/messaging";
import {NetWorkMetadataDef} from "@polkadot/extension-base/background/KoniTypes";

function updateNetworkMetadata (metadataDefs: NetWorkMetadataDef[]): void {
  store.dispatch({ type: 'networkMetadata/update', payload: metadataDefs });
}

export default function useSetupNetworkMetadata (): void {
  useEffect(() => {
    console.log('--- Setup redux: networkMetadata');
    getAllNetworkMetadata().then((metadataDefs) => {
      updateNetworkMetadata(metadataDefs);
    }).catch(console.error);
  }, []);
}
