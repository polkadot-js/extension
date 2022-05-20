import {useSelector} from "react-redux";
import {RootState} from "@subwallet/extension-koni-ui/stores";

export default function useGetNetworkJson (networkKey: string) {
  const { networkMap } = useSelector((state: RootState) => state);

  return networkMap[networkKey];
}
