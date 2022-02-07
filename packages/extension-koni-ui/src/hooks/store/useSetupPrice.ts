import {store} from "@polkadot/extension-koni-ui/stores";
import {PriceJson} from "@polkadot/extension-base/background/KoniTypes";
import {useEffect} from "react";
import {subscribePrice} from "@polkadot/extension-koni-ui/messaging";

function updatePrice (priceData: PriceJson): void {
  store.dispatch({type: 'price/update', payload: priceData});
}

export default function useSetupPrice (): void {
  useEffect((): void => {
    console.log('--- Setup redux: price');
    subscribePrice(null, updatePrice)
      .then(updatePrice)
      .catch(console.error);
  }, []);
}
