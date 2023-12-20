// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

export interface OrdinalItem {
  chain: string;
  address: string;
  data: Record<string, any>;
}

export interface SubscanEventBaseItemData {
  id: number;
  block_timestamp: number;
  extrinsic_index: string;
  extrinsic_hash: string;
  finalized: boolean;
  event_index: string;
  phase: number,
  module_id: string;
  event_id: string;
}

export interface SubscanEventListResponse {
  code: number,
  message: string,
  generated_at: number,
  data: {
    count: number,
    events: SubscanEventBaseItemData[]
  }
}

export interface SubscanBatchChildParam {
  name: string;
  type: string;
  value: string;
}

export interface SubscanBatchChild {
  call_index: string;
  call_module: string;
  call_name: string;
  params: SubscanBatchChildParam[];
}

export interface SubscanExtrinsicParamDetail {
  name: string;
  type: string;
  type_name: string;
  value: string | SubscanBatchChild[];
}

export interface SubscanExtrinsicParam {
  extrinsic_index: string,
  params: SubscanExtrinsicParamDetail[]
}

export interface SubscanExtrinsicParamResponse {
  code: number,
  message: string,
  generated_at: number,
  data: SubscanExtrinsicParam[];
}

export interface OrdinalRemarkData {
  p: string;
  op: string;
  tick: string;
  amt: string;
}

export interface OrdinalNftProperties {
  P: {
    value: string;
  };
  Op: {
    value: string;
  };
  Tick: {
    value: string;
  };
}
