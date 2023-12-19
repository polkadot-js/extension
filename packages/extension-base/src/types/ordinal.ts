// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

export interface OrdinalItem {
  chain: string;
  address: string;
  data: Record<string, any>;
}

export interface SubscanExtrinsicBaseItemData {
  id: number;
  block_num: number;
  block_timestamp: number;
  extrinsic_index: string;
  call_module_function: string;
  call_module: string;
  nonce: number;
  extrinsic_hash: string;
  success: boolean;
  fee: string;
  fee_used: string;
  tip: string;
  finalized: boolean;
  account_display: {
    address: string;
  }
}

export interface SubscanExtrinsicListResponse {
  code: number,
  message: string,
  generated_at: number,
  data: {
    count: number,
    extrinsics: SubscanExtrinsicBaseItemData[]
  }
}

export interface SubscanExtrinsicDetail {
  name: string;
  type: string;
  type_name: string;
  value: string;
}

export interface SubscanExtrinsicParam {
  extrinsic_index: string,
  params: SubscanExtrinsicDetail[]
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
  p: {
    value: string;
  };
  op: {
    value: string;
  };
  tick: {
    value: string;
  };
}
