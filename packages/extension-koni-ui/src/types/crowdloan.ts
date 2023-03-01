import BigN from 'bignumber.js';
import { CrowdloanParaState } from '@subwallet/extension-base/background/KoniTypes';

export type CrowdloanValueInfo = {
  value: BigN,
  convertedValue: BigN,
  symbol: string,
};

export type CrowdloanContributeValueType = {
  paraState?: CrowdloanParaState;
  contribute: CrowdloanValueInfo;
};

export type CrowdloanItemType = {
  slug: string;
  contribute: string | BigN,
  convertedContribute: string | BigN,
  chainDisplayName: string,
  relayParentDisplayName: string,
  symbol: string,
  paraState?: CrowdloanParaState;
  crowdloanUrl?: string | null;
}
