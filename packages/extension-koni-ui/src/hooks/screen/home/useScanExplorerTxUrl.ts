import {useSelector} from "react-redux";
import {RootState} from "@subwallet/extension-koni-ui/stores";
import {getScanExplorerTransactionHistoryUrl} from "@subwallet/extension-koni-ui/util";

export default function useScanExplorerTxUrl (networkKey: string, hash: string) {
  const { networkMap } = useSelector((state: RootState) => state);

  if (networkMap[networkKey].blockExplorer) {
    return `${networkMap[networkKey].blockExplorer}/extrinsic/${hash}`;
  } else {
    return getScanExplorerTransactionHistoryUrl(networkKey, hash);
  }
}
