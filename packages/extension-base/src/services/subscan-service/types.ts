// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

export interface SubscanRequest<T> {
  id: number,
  retry: number, // retry < 1 not start, retry === 0 start, retry > 0 number of retry
  /** Serve smaller first  */
  ordinal: number,
  status: 'pending' | 'running',
  run: () => Promise<any>;
  resolve: (value: any) => T;
  reject: (error?: any) => void;
}

export interface SubscanResponse<T = any> {
  code: number;
  message: string;
  data: T;
}

export interface IMultiChainBalance {
  network: string,
  symbol: string,
  decimal: number,
  price: string,
  category: string,
  balance: string,
  locked: string,
  reserved: string,
  bonded: string,
  unbonding: string,
  democracy_lock: string,
  election_lock: string
}

export interface CrowdloanContributionItem {
  fund_id: string,
  para_id: number,
  contributed: string,
  block_num: number,
  block_timestamp: number,
  extrinsic_index: string,
  event_index: string,
  status: number,
  memo: string,
  fund_status: number,
  fund_event_index: string,
  unlocking_block: number,
  fund_auction_status: number
}

export interface CrowdloanContributionsResponse {
  count: number,
  list: null | CrowdloanContributionItem[],
  total: string
}

export interface ExtrinsicItem {
  id?: number,
  block_num: number,
  block_timestamp: number,
  extrinsic_index: string,
  call_module_function: string,
  /** Need be called from another api */
  params: string,
  /** Deprecated */
  account_id: string,
  /** Deprecated */
  account_index: string,
  /** Deprecated */
  signature: string,
  call_module: string,
  nonce: number,
  extrinsic_hash: string,
  success: boolean,
  fee: string,
  fee_used: string,
  /** Deprecated */
  from_hex: string,
  tip: string,
  finalized: boolean,
  account_display: {
    address: string
  }
}

export interface ExtrinsicsListResponse {
  count: number,
  extrinsics: null | ExtrinsicItem[]
}

export interface ExtrinsicParam {
  name: string,
  type: string,
  type_name: string,
  value: any
}

export interface ExtrinsicDetailEvent {
  event_index: string,
  block_num: number,
  extrinsic_idx: number,
  module_id: string,
  event_id: string,
  params: string,
  phase: number,
  event_idx: number,
  extrinsic_hash: string,
  finalized: boolean,
  block_timestamp: number
}

export interface ExtrinsicDetailError {
  module: string,
  name: string,
  doc: string,
  value: string,
  batch_index: number
}

export interface ExtrinsicDetail {
  block_timestamp: number,
  block_num: number,
  extrinsic_index: string,
  call_module_function: string, // may be enum
  call_module: string, // may be enum
  account_id: string,
  signature: string,
  nonce: number,
  extrinsic_hash: string,
  success: boolean,
  params: ExtrinsicParam[],
  transfer: {
    from: string,
    to: string,
    module: string, // may be enum
    amount: string,
    hash: string,
    success: boolean,
    asset_symbol: string,
    to_account_display: {
      address: string
    }
  },
  event: ExtrinsicDetailEvent[],
  event_count: number,
  fee: string,
  fee_used: string,
  error: null | ExtrinsicDetailError,
  finalized: boolean,
  lifetime: {
    birth: number,
    death: number
  },
  tip: string,
  account_display: {
    address: string
  },
  block_hash: string,
  pending: boolean
}

export interface TransferItem {
  from: string,
  to: string,
  extrinsic_index: string,
  success: boolean,
  hash: string,
  block_num: number,
  block_timestamp: number,
  module: string,
  amount: string,
  amount_v2: string,
  usd_amount: string,
  fee: string,
  nonce: number,
  asset_symbol: string,
  asset_unique_id: string,
  asset_type: string,
  item_id: number | null,
  from_account_display: {
    address: string,
    display?: string
  },
  to_account_display: {
    address: string,
    display?: string
  },
  event_idx: 0
}

export interface TransfersListResponse {
  count: number,
  transfers: null | TransferItem[]
}

export type RequestBlockRange = {
  from: number | null,
  to: number | null
}

export interface RewardHistoryItem {
  block_num: number;
  extrinsic_idx: number;
  stash: string;
  account: string;
  module_id: string;
  event_id: string;
  event_method: string;
  params: string;
  extrinsic_hash: string;
  event_idx: number;
  amount: string;
  block_timestamp: number;
  event_index: string;
  extrinsic_index: string;
}

export interface RewardHistoryListResponse {
  count: number,
  list: null | RewardHistoryItem[]
}
