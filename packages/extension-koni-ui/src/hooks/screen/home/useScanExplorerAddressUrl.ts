import {useSelector} from "react-redux";
import {RootState} from "@subwallet/extension-koni-ui/stores";
import {getScanExplorerAddressInfoUrl} from "@subwallet/extension-koni-ui/util";

export default function useScanExplorerAddressUrl (networkKey: string, hash: string) {
  const { networkMap } = useSelector((state: RootState) => state);

  if (networkMap[networkKey].blockExplorer) {
    return `${networkMap[networkKey].blockExplorer}/account/${hash}`;
  } else {
    return getScanExplorerAddressInfoUrl(networkKey, hash);
  }
}
