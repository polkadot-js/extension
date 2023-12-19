// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

export const GET_EXTRINSIC_LIST_API = 'https://{{chain}}.api.subscan.io/api/v2/scan/extrinsics';
export const GET_EXTRINSIC_PARAMS_API = 'https://{{chain}}.api.subscan.io/api/scan/extrinsic/params';

export const BASE_FETCH_ORDINAL_EXTRINSIC_DATA = {
  call: 'remark_with_event',
  module: 'system',
  order: 'desc',
  success: true,
  row: 100
};
