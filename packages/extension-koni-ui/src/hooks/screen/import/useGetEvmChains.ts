import {useSelector} from "react-redux";
import {RootState} from "@subwallet/extension-koni-ui/stores";

export interface ChainOptions {
  text: string;
  value: string;
}

export default function useGetEvmChains () {
  const { networkMap } = useSelector((state: RootState) => state);
  const result: ChainOptions[] = [];

  for (const [key, network] of Object.entries(networkMap)) {
    if (network.isEthereum && network.isEthereum) {
      result.push({
        text: network.chain,
        value: key
      })
    }
  }

  return result;
}
