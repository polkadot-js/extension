// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, NetworkJson, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { getMoonbeamBondingBasics, getMoonbeamBondingExtrinsic, getMoonbeamCollatorsInfo, getMoonbeamUnbondingExtrinsic, handleMoonbeamBondingTxInfo, handleMoonbeamUnbondingTxInfo, handleMoonbeamUnlockingInfo, handleMoonbeamWithdrawalTxInfo } from '@subwallet/extension-koni-base/api/bonding/moonbeam';
import { getRelayBondingExtrinsic, getRelayChainBondingBasics, getRelayUnbondingExtrinsic, getRelayValidatorsInfo, getTargetValidators, handleRelayBondingTxInfo, handleRelayUnbondingTxInfo, handleRelayUnlockingInfo, handleRelayWithdrawalTxInfo } from '@subwallet/extension-koni-base/api/bonding/relayChain';
import Web3 from 'web3';

const CHAIN_TYPES: Record<string, string[]> = {
  relay: ['polkadot', 'kusama', 'hydradx', 'aleph', 'edgeware', 'darwinia', 'crab'],
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

export async function getBondingTxInfo (networkJson: NetworkJson, amount: number, bondedValidators: string[], isBondedBefore: boolean, networkKey: string, nominatorAddress: string, validatorInfo: ValidatorInfo, dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>) {
  if (CHAIN_TYPES.moonbeam.includes(networkKey)) {
    return handleMoonbeamBondingTxInfo(networkJson, amount, networkKey, nominatorAddress, validatorInfo, dotSamaApiMap, web3ApiMap, bondedValidators.length);
  }

  const targetValidators: string[] = getTargetValidators(bondedValidators, validatorInfo.address);

  return handleRelayBondingTxInfo(networkJson, amount, targetValidators, isBondedBefore, networkKey, nominatorAddress, dotSamaApiMap, web3ApiMap);
}

export async function getBondingExtrinsic (networkJson: NetworkJson, networkKey: string, amount: number, bondedValidators: string[], validatorInfo: ValidatorInfo, isBondedBefore: boolean, nominatorAddress: string, dotSamaApi: ApiProps) {
  if (CHAIN_TYPES.moonbeam.includes(networkKey)) {
    return getMoonbeamBondingExtrinsic(networkJson, dotSamaApi, amount, validatorInfo, bondedValidators.length);
  }

  const targetValidators: string[] = getTargetValidators(bondedValidators, validatorInfo.address);

  return getRelayBondingExtrinsic(dotSamaApi, nominatorAddress, amount, targetValidators, isBondedBefore, networkJson);
}

export async function getUnbondingTxInfo (address: string, amount: number, networkKey: string, dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, networkJson: NetworkJson, validatorAddress?: string) {
  if (CHAIN_TYPES.moonbeam.includes(networkKey)) {
    return handleMoonbeamUnbondingTxInfo(address, amount, networkKey, dotSamaApiMap, web3ApiMap, networkJson, validatorAddress as string);
  }

  return handleRelayUnbondingTxInfo(address, amount, networkKey, dotSamaApiMap, web3ApiMap, networkJson);
}

export async function getUnbondingExtrinsic (address: string, amount: number, networkKey: string, networkJson: NetworkJson, dotSamaApi: ApiProps, validatorAddress?: string) {
  if (CHAIN_TYPES.moonbeam.includes(networkKey)) {
    return getMoonbeamUnbondingExtrinsic(dotSamaApi, amount, networkJson, validatorAddress as string);
  }

  return getRelayUnbondingExtrinsic(dotSamaApi, amount, networkJson);
}

export async function getUnlockingInfo (dotSamaApi: ApiProps, networkJson: NetworkJson, networkKey: string, address: string, validatorList?: string[]) {
  if (CHAIN_TYPES.moonbeam.includes(networkKey)) {
    return handleMoonbeamUnlockingInfo(dotSamaApi, networkJson, networkKey, address, validatorList as string[]);
  }

  return handleRelayUnlockingInfo(dotSamaApi, networkJson, networkKey, address);
}

export async function getWithdrawalTxInfo (address: string, networkKey: string, dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, validatorAddress?: string) {
  if (CHAIN_TYPES.moonbeam.includes(networkKey)) {
    return handleMoonbeamWithdrawalTxInfo(networkKey, dotSamaApiMap, web3ApiMap, address, validatorAddress as string);
  }

  return handleRelayWithdrawalTxInfo(address, networkKey, dotSamaApiMap, web3ApiMap);
}
