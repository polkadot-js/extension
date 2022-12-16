/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: DotSamaHistory
// ====================================================

export interface DotSamaHistory_historyElements_nodes {
  __typename: "HistoryElement";
  id: string;
  blockNumber: number;
  extrinsicIdx: number | null;
  extrinsicHash: string | null;
  timestamp: any;
  address: string;
  reward: any | null;
  extrinsic: any | null;
  transfer: any | null;
}

export interface DotSamaHistory_historyElements {
  __typename: "HistoryElementsConnection";
  /**
   * A list of `HistoryElement` objects.
   */
  nodes: (DotSamaHistory_historyElements_nodes | null)[];
}

export interface DotSamaHistory_transfers_nodes {
  __typename: "SubsquidTransfersElement";

  from: { id: string };
  to: { id: string };
  asset: { amount: string };
  success: boolean | false;
  fee: string;
  id: string;
  blockNumber: number;
  extrinsicHash: string | null;
  timestamp: any;
  address: string;
  reward: any | null;
  extrinsic: any | null;
  transfer: any | null;
}

export interface DotSamaHistory_transfers {
  __typename: "SubsquidTransfersConnection";
  /**
   * A list of `HistoryElement` objects.
   */
  transfers: (DotSamaHistory_transfers_nodes | null)[];
}

export interface DotSamaHistory {
  /**
   * Reads and enables pagination through a set of `HistoryElement`.
   */
  historyElements: DotSamaHistory_historyElements | null;
}

export interface DotSamaHistoryVariables {
  last?: number | null;
  address?: string | null;
}
