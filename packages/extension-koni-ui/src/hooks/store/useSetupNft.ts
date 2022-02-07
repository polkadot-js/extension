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
    console.log('--- Setup redux: nft');
    subscribeNft(null, updateNft)
      .then(updateNft)
      .catch(console.error);
  }, []);
}
