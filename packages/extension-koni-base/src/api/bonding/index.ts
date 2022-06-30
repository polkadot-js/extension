// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, NetworkJson, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { getAstarBondingBasics, getAstarBondingExtrinsic, getAstarDappsInfo, getAstarUnbondingExtrinsic, handleAstarBondingTxInfo, handleAstarUnbondingTxInfo } from '@subwallet/extension-koni-base/api/bonding/astar';
import { getDarwiniaBondingExtrinsic, getDarwiniaValidatorsInfo, handleDarwiniaBondingTxInfo } from '@subwallet/extension-koni-base/api/bonding/darwinia';
import { getParaBondingBasics, getParaBondingExtrinsic, getParaCollatorsInfo, getParaUnbondingExtrinsic, getParaWithdrawalExtrinsic, handleParaBondingTxInfo, handleParaUnbondingTxInfo, handleParaUnlockingInfo, handleParaWithdrawalTxInfo } from '@subwallet/extension-koni-base/api/bonding/paraChain';
import { getRelayBondingExtrinsic, getRelayChainBondingBasics, getRelayUnbondingExtrinsic, getRelayValidatorsInfo, getRelayWithdrawalExtrinsic, getTargetValidators, handleRelayBondingTxInfo, handleRelayUnbondingTxInfo, handleRelayUnlockingInfo, handleRelayWithdrawalTxInfo } from '@subwallet/extension-koni-base/api/bonding/relayChain';
import Web3 from 'web3';

const CHAIN_TYPES: Record<string, string[]> = {
  relay: ['polkadot', 'kusama', 'hydradx', 'aleph', 'edgeware', 'darwinia', 'crab', 'polkadex'],
  para: ['moonbeam', 'moonriver', 'moonbase', 'turing', 'turingStaging'],
  darwinia: ['darwinia', 'crab', 'pangolin'],
  astar: ['astar', 'shiden', 'shibuya']
};

export async function getChainBondingBasics (networkKey: string, dotSamaApi: ApiProps) {
  if (CHAIN_TYPES.astar.includes(networkKey)) {
    return getAstarBondingBasics(networkKey);
  } else if (CHAIN_TYPES.para.includes(networkKey)) {
    return getParaBondingBasics(networkKey, dotSamaApi);
  }

  return getRelayChainBondingBasics(networkKey, dotSamaApi);
}

export async function getValidatorsInfo (networkKey: string, dotSamaApi: ApiProps, decimals: number, address: string) {
  if (CHAIN_TYPES.para.includes(networkKey)) {
    return getParaCollatorsInfo(networkKey, dotSamaApi, decimals, address);
  } else if (CHAIN_TYPES.darwinia.includes(networkKey)) {
    return getDarwiniaValidatorsInfo(networkKey, dotSamaApi, decimals, address);
  } else if (CHAIN_TYPES.astar.includes(networkKey)) {
    return getAstarDappsInfo(networkKey, dotSamaApi, decimals, address);
  }

  return getRelayValidatorsInfo(networkKey, dotSamaApi, decimals, address);
}

export async function getBondingTxInfo (networkJson: NetworkJson, amount: number, bondedValidators: string[], isBondedBefore: boolean, networkKey: string, nominatorAddress: string, validatorInfo: ValidatorInfo, dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, lockPeriod?: number) {
  if (CHAIN_TYPES.para.includes(networkKey)) {
    return handleParaBondingTxInfo(networkJson, amount, networkKey, nominatorAddress, validatorInfo, dotSamaApiMap, web3ApiMap, bondedValidators.length);
  } else if (CHAIN_TYPES.darwinia.includes(networkKey)) {
    const targetValidators: string[] = getTargetValidators(bondedValidators, validatorInfo.address);

    return handleDarwiniaBondingTxInfo(networkJson, amount, targetValidators, isBondedBefore, networkKey, nominatorAddress, dotSamaApiMap, web3ApiMap, lockPeriod as number);
  } else if (CHAIN_TYPES.astar.includes(networkKey)) {
    return handleAstarBondingTxInfo(networkJson, amount, networkKey, nominatorAddress, validatorInfo, dotSamaApiMap, web3ApiMap);
  }

  const targetValidators: string[] = getTargetValidators(bondedValidators, validatorInfo.address);

  return handleRelayBondingTxInfo(networkJson, amount, targetValidators, isBondedBefore, networkKey, nominatorAddress, dotSamaApiMap, web3ApiMap);
}

export async function getBondingExtrinsic (networkJson: NetworkJson, networkKey: string, amount: number, bondedValidators: string[], validatorInfo: ValidatorInfo, isBondedBefore: boolean, nominatorAddress: string, dotSamaApi: ApiProps, lockPeriod?: number) {
  if (CHAIN_TYPES.para.includes(networkKey)) {
    return getParaBondingExtrinsic(nominatorAddress, networkJson, dotSamaApi, amount, validatorInfo, bondedValidators.length);
  } else if (CHAIN_TYPES.darwinia.includes(networkKey)) {
    const targetValidators: string[] = getTargetValidators(bondedValidators, validatorInfo.address);

    return getDarwiniaBondingExtrinsic(dotSamaApi, nominatorAddress, amount, targetValidators, isBondedBefore, networkJson, lockPeriod as number);
  } else if (CHAIN_TYPES.astar.includes(networkKey)) {
    return getAstarBondingExtrinsic(dotSamaApi, networkJson, amount, networkKey, nominatorAddress, validatorInfo);
  }

  const targetValidators: string[] = getTargetValidators(bondedValidators, validatorInfo.address);

  return getRelayBondingExtrinsic(dotSamaApi, nominatorAddress, amount, targetValidators, isBondedBefore, networkJson);
}

export async function getUnbondingTxInfo (address: string, amount: number, networkKey: string, dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, networkJson: NetworkJson, validatorAddress?: string, unstakeAll?: boolean) {
  if (CHAIN_TYPES.para.includes(networkKey)) {
    return handleParaUnbondingTxInfo(address, amount, networkKey, dotSamaApiMap, web3ApiMap, networkJson, validatorAddress as string, unstakeAll as boolean);
  } else if (CHAIN_TYPES.astar.includes(networkKey)) {
    return handleAstarUnbondingTxInfo(networkJson, amount, networkKey, address, validatorAddress as string, dotSamaApiMap, web3ApiMap);
  }

  return handleRelayUnbondingTxInfo(address, amount, networkKey, dotSamaApiMap, web3ApiMap, networkJson);
}

export async function getUnbondingExtrinsic (address: string, amount: number, networkKey: string, networkJson: NetworkJson, dotSamaApi: ApiProps, validatorAddress?: string, unstakeAll?: boolean) {
  if (CHAIN_TYPES.para.includes(networkKey)) {
    return getParaUnbondingExtrinsic(dotSamaApi, amount, networkJson, validatorAddress as string, unstakeAll as boolean);
  } else if (CHAIN_TYPES.astar.includes(networkKey)) {
    return getAstarUnbondingExtrinsic(dotSamaApi, networkJson, amount, networkKey, address, validatorAddress as string);
  }

  return getRelayUnbondingExtrinsic(dotSamaApi, amount, networkJson);
}

export async function getUnlockingInfo (dotSamaApi: ApiProps, networkJson: NetworkJson, networkKey: string, address: string, validatorList?: string[]) {
  if (CHAIN_TYPES.para.includes(networkKey)) {
    return handleParaUnlockingInfo(dotSamaApi, networkJson, networkKey, address, validatorList as string[]);
  }

  return handleRelayUnlockingInfo(dotSamaApi, networkJson, networkKey, address);
}

export async function getWithdrawalTxInfo (address: string, networkKey: string, dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, validatorAddress?: string, action?: string) {
  if (CHAIN_TYPES.para.includes(networkKey)) {
    return handleParaWithdrawalTxInfo(networkKey, dotSamaApiMap, web3ApiMap, address, validatorAddress as string, action as string);
  }

  return handleRelayWithdrawalTxInfo(address, networkKey, dotSamaApiMap, web3ApiMap);
}

export async function getWithdrawalExtrinsic (dotSamaApi: ApiProps, networkKey: string, address: string, validatorAddress?: string, action?: string) {
  if (CHAIN_TYPES.para.includes(networkKey)) {
    return getParaWithdrawalExtrinsic(dotSamaApi, address, validatorAddress as string, action as string);
  }

  return getRelayWithdrawalExtrinsic(dotSamaApi, address);
}
