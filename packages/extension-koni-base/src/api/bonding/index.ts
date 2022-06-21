// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps } from '@subwallet/extension-base/background/KoniTypes';
import { getMoonbeamBondingBasics, getMoonbeamCollatorsInfo } from '@subwallet/extension-koni-base/api/bonding/moonbeam';
import { getRelayChainBondingBasics, getRelayValidatorsInfo } from '@subwallet/extension-koni-base/api/bonding/relayChain';

const CHAIN_TYPES: Record<string, string[]> = {
  relay: ['polkadot', 'kusama', 'hydradx', 'aleph'],
  moonbeam: ['moonbeam', 'moonriver', 'moonbase']
};

export async function getChainBondingBasics (networkKey: string, dotSamaApi: ApiProps) {
  if (CHAIN_TYPES.moonbeam.includes(networkKey)) {
    return getMoonbeamBondingBasics(networkKey, dotSamaApi);
  }

  return getRelayChainBondingBasics(networkKey, dotSamaApi);
}

export async function getValidatorsInfo (networkKey: string, dotSamaApi: ApiProps, decimals: number, address: string) {
  if (CHAIN_TYPES.moonbeam.includes(networkKey)) {
    return getMoonbeamCollatorsInfo(networkKey, dotSamaApi, decimals, address);
  }

  return getRelayValidatorsInfo(networkKey, dotSamaApi, decimals, address);
}
