import {BalanceValueType} from "@polkadot/extension-koni-ui/util";
import {BalanceInfo} from "@polkadot/extension-koni-ui/util/types";
import BigN from "bignumber.js";
import {CrowdloanParaState, NftJson, StakingJson} from "@polkadot/extension-base/background/KoniTypes";

export type CrowdloanContributeValueType = {
  paraState?: CrowdloanParaState;
  contribute: BalanceValueType;
}

export type AccountBalanceType = {
  totalBalanceValue: BigN;
  networkBalanceMaps: Record<string, BalanceInfo>;
  crowdloanContributeMap: Record<string, CrowdloanContributeValueType>;
  nftData: NftJson,
  stakingData: StakingJson
}
