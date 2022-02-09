import {StakingJson} from "@polkadot/extension-base/background/KoniTypes";
import {useEffect} from "react";
import {subscribeStaking} from "@polkadot/extension-koni-ui/messaging";
import {store} from "@polkadot/extension-koni-ui/stores";

function updateStaking (stakingData: StakingJson): void {
  store.dispatch({type: 'staking', payload: stakingData})
}

export default function useSetupStaking (): void {
  useEffect((): void => {
    console.log('--- Setup redux: staking');
    subscribeStaking(null, updateStaking)
      .then(updateStaking)
      .catch(console.error);
  }, []);
}
