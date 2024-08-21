// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { GearApi } from '@gear-js/api';

import { ApiPromise } from '@polkadot/api';
import { HexString } from '@polkadot/util/types';

import { GRC20 } from './grc20';
import { VFT } from './vft';

export const DEFAULT_GEAR_ADDRESS = {
  ALICE: '5GrwvaEF5zXb26Fz9rcQpDWS57CtERHpNehXCPcNoHGKutQY',
  BOB: '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty'
};

export const GEAR_DEFAULT_ADDRESS = '5EYCAe5ijiYfAXEth5DGRKiKuVjTXQKr877tUPz6eLz2t9aG';

export function getGRC20ContractPromise (apiPromise: ApiPromise, contractAddress: string) {
  const gearApi = apiPromise as GearApi;

  return new GRC20(gearApi, contractAddress as HexString);
}

export function getVFTContractPromise (apiPromise: ApiPromise, contractAddress: string) {
  const gearApi = apiPromise as GearApi;

  return new VFT(gearApi, contractAddress as HexString);
}
