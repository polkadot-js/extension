// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

export const GET_EVENT_LIST_API = 'https://{{chain}}.api.subscan.io/api/v2/scan/events';
export const GET_EXTRINSIC_PARAMS_API = 'https://{{chain}}.api.subscan.io/api/scan/extrinsic/params';

export const BASE_FETCH_ORDINAL_EVENT_DATA = {
  event_id: 'Remarked',
  module: 'system',
  order: 'desc',
  success: true,
  row: 100
};
