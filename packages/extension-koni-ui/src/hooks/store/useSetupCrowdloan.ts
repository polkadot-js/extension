import {CrowdloanJson} from "@polkadot/extension-base/background/KoniTypes";
import {store} from "@polkadot/extension-koni-ui/stores";
import {useEffect} from "react";
import {subscribeCrowdloan} from "@polkadot/extension-koni-ui/messaging";

function updateCrowdloan (crowdloan: CrowdloanJson): void {
  store.dispatch({ type: 'crowdloan/update', payload: crowdloan });
}

export default function useSetupCrowdloan(): void {
  useEffect((): void => {
    console.log('--- Setup redux: crowdloan');
    subscribeCrowdloan(null, updateCrowdloan)
      .then(updateCrowdloan)
      .catch(console.error);
  }, []);
}
