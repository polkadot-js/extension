import {BalanceValueType} from "@polkadot/extension-koni-ui/util";
import {BalanceInfo} from "@polkadot/extension-koni-ui/util/types";
import BigN from "bignumber.js";

export type AccountBalanceType = {
  totalBalanceValue: BigN;
  networkBalanceMaps: Record<string, BalanceInfo>;
  crowdloanContributeMap: Record<string, BalanceValueType>;
}
