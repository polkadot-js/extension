import {NftType} from "@polkadot/extension-koni-ui/hooks/screen/home/types";
import {useSelector} from "react-redux";
import {RootState} from "@polkadot/extension-koni-ui/stores";

export default function useFetchNft (): NftType {
  const { nft: nftReducer } = useSelector((state: RootState) => state);

  return {
    nftList: nftReducer?.nftList,
    nftJson: nftReducer,
    totalCollection: nftReducer?.nftList.length,
    loading: !nftReducer.ready // ready = not loading
  } as NftType;
}
