// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SubscanExtrinsicListResponse, SubscanExtrinsicParamResponse } from '@subwallet/extension-base/types';

import { BASE_FETCH_ORDINAL_EXTRINSIC_DATA, GET_EXTRINSIC_LIST_API, GET_EXTRINSIC_PARAMS_API } from './constants';

export const fetchEventRemarkExtrinsic = async (chain: string, address: string) => {
  const params = {
    ...BASE_FETCH_ORDINAL_EXTRINSIC_DATA,
    address
  };

  const response = await fetch(GET_EXTRINSIC_LIST_API.replace('{{chain}}', chain), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });

  const data = await response.json() as SubscanExtrinsicListResponse;

  return data.data.extrinsics;
};

export const fetchExtrinsicParams = async (chain: string, extrinsicIndexes: string[]) => {
  const params = {
    extrinsic_index: extrinsicIndexes
  };

  const response = await fetch(GET_EXTRINSIC_PARAMS_API.replace('{{chain}}', chain), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(params)
  });

  const data = await response.json() as SubscanExtrinsicParamResponse;

  return data.data;
};
