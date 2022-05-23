import {useSelector} from "react-redux";
import {RootState} from "@subwallet/extension-koni-ui/stores";
import {isSupportScanExplorer} from "@subwallet/extension-koni-ui/util";

export default function useSupportScanExplorer (networkKey: string) {
  const { networkMap } = useSelector((state: RootState) => state);

  if (networkMap[networkKey].blockExplorer) {
    return true;
  } else {
    return isSupportScanExplorer(networkKey);
  }
}
