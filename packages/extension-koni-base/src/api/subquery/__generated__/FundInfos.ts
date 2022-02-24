/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: FundInfos
// ====================================================

export interface FundInfos_crowdloans_nodes {
  __typename: "Crowdloan";
  id: string;
  parachainId: string;
  depositor: string;
  verifier: string | null;
  cap: any;
  raised: any;
  lockExpiredBlock: number;
  blockNum: number | null;
  firstSlot: number;
  lastSlot: number;
  status: string;
  leaseExpiredBlock: number | null;
  dissolvedBlock: number | null;
  updatedAt: any | null;
  createdAt: any | null;
  isFinished: boolean | null;
  wonAuctionId: string | null;
}

export interface FundInfos_crowdloans {
  __typename: "CrowdloansConnection";
  /**
   * A list of `Crowdloan` objects.
   */
  nodes: (FundInfos_crowdloans_nodes | null)[];
}

export interface FundInfos {
  /**
   * Reads and enables pagination through a set of `Crowdloan`.
   */
  crowdloans: FundInfos_crowdloans | null;
}

export interface FundInfosVariables {
  first?: number | null;
  offset?: number | null;
}
