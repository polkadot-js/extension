import {BalanceJson} from "@polkadot/extension-base/background/KoniTypes";
import {store} from "@polkadot/extension-koni-ui/stores";
import {useEffect} from "react";
import {subscribeBalance} from "@polkadot/extension-koni-ui/messaging";

function updateBalance(balanceData: BalanceJson): void {
  store.dispatch({type: 'balance/update', payload: balanceData});
}

export default function useSetupBalance(): void {
  useEffect((): void => {
    console.log('--- Setup redux: balance');
    subscribeBalance(null, updateBalance)
      .then(updateBalance)
      .catch(console.error);
  }, []);
}
