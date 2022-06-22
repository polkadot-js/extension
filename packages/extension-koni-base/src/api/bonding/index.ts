// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, NetworkJson, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { getMoonbeamBondingBasics, getMoonbeamCollatorsInfo, handleMoonbeamBondingTxInfo } from '@subwallet/extension-koni-base/api/bonding/moonbeam';
import {
  getRelayChainBondingBasics,
  getRelayValidatorsInfo,
  getTargetValidators,
  handleRelayBondingTxInfo
} from '@subwallet/extension-koni-base/api/bonding/relayChain';
import Web3 from 'web3';

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

export async function getBondingTxInfo (networkJson: NetworkJson, amount: number, bondedValidators: string[], isBondedBefore: boolean, networkKey: string, nominatorAddress: string, validatorInfo: ValidatorInfo, dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, currentNominationCount: number) {
  if (CHAIN_TYPES.moonbeam.includes(networkKey)) {

    return handleMoonbeamBondingTxInfo(amount, networkKey, nominatorAddress, validatorInfo, dotSamaApiMap, web3ApiMap, currentNominationCount);
  }

  const targetValidators: string[] = getTargetValidators(bondedValidators, validatorInfo.address);

  return handleRelayBondingTxInfo(networkJson, amount, targetValidators, isBondedBefore, networkKey, nominatorAddress, dotSamaApiMap, web3ApiMap);
}
