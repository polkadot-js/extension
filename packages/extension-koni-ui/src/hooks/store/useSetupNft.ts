import {NftJson} from "@polkadot/extension-base/background/KoniTypes";
import {useEffect} from "react";
import {subscribeNft} from "@polkadot/extension-koni-ui/messaging";
import {store} from "@polkadot/extension-koni-ui/stores";

function updateNft (nftData: NftJson): void {
  console.log('got it', nftData)
  store.dispatch({type: 'nft', payload: nftData});
}

export default function useSetupNft (): void {
  useEffect((): void => {
    const currentAccount = store.getState().currentAccount.account;
    if (currentAccount) {
      console.log('--- Setup redux: nft');
      subscribeNft(currentAccount.address, updateNft)
        .then(updateNft)
        .catch(console.error);
    }
  }, []);
}
