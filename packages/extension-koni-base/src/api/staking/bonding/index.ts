// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { StakingType, UnlockingStakeInfo, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/chain-service/constants';
import { _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { getAmplitudeBondingBasics, getAmplitudeBondingExtrinsic, getAmplitudeClaimRewardExtrinsic, getAmplitudeCollatorsInfo, getAmplitudeDelegationInfo, getAmplitudeUnbondingExtrinsic, getAmplitudeWithdrawalExtrinsic, handleAmplitudeBondingTxInfo, handleAmplitudeClaimRewardTxInfo, handleAmplitudeUnbondingTxInfo, handleAmplitudeUnlockingInfo, handleAmplitudeWithdrawalTxInfo } from '@subwallet/extension-koni-base/api/staking/bonding/amplitude';
import { getAstarBondingBasics, getAstarBondingExtrinsic, getAstarClaimRewardExtrinsic, getAstarDappsInfo, getAstarDelegationInfo, getAstarUnbondingExtrinsic, getAstarWithdrawalExtrinsic, handleAstarBondingTxInfo, handleAstarClaimRewardTxInfo, handleAstarUnbondingTxInfo, handleAstarUnlockingInfo, handleAstarWithdrawalTxInfo } from '@subwallet/extension-koni-base/api/staking/bonding/astar';
import { getParaBondingBasics, getParaBondingExtrinsic, getParaCollatorsInfo, getParaDelegationInfo, getParaUnbondingExtrinsic, getParaWithdrawalExtrinsic, handleParaBondingTxInfo, handleParaUnbondingTxInfo, handleParaUnlockingInfo, handleParaWithdrawalTxInfo } from '@subwallet/extension-koni-base/api/staking/bonding/paraChain';
import { getPoolingClaimRewardExtrinsic, getRelayBondingExtrinsic, getRelayChainBondingBasics, getRelayUnbondingExtrinsic, getRelayValidatorsInfo, getRelayWithdrawalExtrinsic, getTargetValidators, handlePoolingClaimRewardTxInfo, handleRelayBondingTxInfo, handleRelayUnbondingTxInfo, handleRelayUnlockingInfo, handleRelayWithdrawalTxInfo } from '@subwallet/extension-koni-base/api/staking/bonding/relayChain';

export const CHAIN_TYPES: Record<string, string[]> = {
  relay: ['polkadot', 'kusama', 'aleph', 'polkadex', 'ternoa', 'ternoa_alphanet', 'alephTest', 'polkadexTest', 'westend'],
  para: ['moonbeam', 'moonriver', 'moonbase', 'turing', 'turingStaging', 'bifrost', 'bifrost_testnet', 'calamari_test', 'calamari'],
  astar: ['astar', 'shiden', 'shibuya'],
  amplitude: ['amplitude', 'amplitude_test', 'kilt', 'kilt_peregrine']
};

export async function getChainBondingBasics (networkKey: string, substrateApi: _SubstrateApi) {
  if (_STAKING_CHAIN_GROUP.astar.includes(networkKey)) {
    return getAstarBondingBasics(networkKey);
  } else if (_STAKING_CHAIN_GROUP.para.includes(networkKey)) {
    return getParaBondingBasics(networkKey, substrateApi);
  } else if (_STAKING_CHAIN_GROUP.amplitude.includes(networkKey)) {
    return getAmplitudeBondingBasics(networkKey, substrateApi);
  }

  return getRelayChainBondingBasics(networkKey, substrateApi);
}

export async function getValidatorsInfo (networkKey: string, substrateApi: _SubstrateApi, decimals: number, address: string, extraCollatorAddress?: string) {
  if (_STAKING_CHAIN_GROUP.para.includes(networkKey)) {
    return getParaCollatorsInfo(networkKey, substrateApi, decimals, address);
  } else if (_STAKING_CHAIN_GROUP.astar.includes(networkKey)) {
    return getAstarDappsInfo(networkKey, substrateApi, decimals, address);
  } else if (_STAKING_CHAIN_GROUP.amplitude.includes(networkKey)) {
    return getAmplitudeCollatorsInfo(networkKey, substrateApi, decimals, address, extraCollatorAddress);
  }

  return getRelayValidatorsInfo(networkKey, substrateApi, decimals, address);
}

export async function getBondingTxInfo (chainInfo: _ChainInfo, amount: number, bondedValidators: string[], isBondedBefore: boolean, networkKey: string, nominatorAddress: string, validatorInfo: ValidatorInfo, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>) {
  if (_STAKING_CHAIN_GROUP.para.includes(networkKey)) {
    return handleParaBondingTxInfo(chainInfo, amount, networkKey, nominatorAddress, validatorInfo, substrateApiMap, evmApiMap, bondedValidators.length);
  } else if (_STAKING_CHAIN_GROUP.astar.includes(networkKey)) {
    return handleAstarBondingTxInfo(chainInfo, amount, networkKey, nominatorAddress, validatorInfo, substrateApiMap, evmApiMap);
  } else if (_STAKING_CHAIN_GROUP.amplitude.includes(networkKey)) {
    return handleAmplitudeBondingTxInfo(chainInfo, amount, networkKey, nominatorAddress, validatorInfo, substrateApiMap, evmApiMap);
  }

  const targetValidators: string[] = getTargetValidators(bondedValidators, validatorInfo.address);

  return handleRelayBondingTxInfo(chainInfo, amount, targetValidators, isBondedBefore, networkKey, nominatorAddress, substrateApiMap, evmApiMap);
}

export async function getBondingExtrinsic (chainInfo: _ChainInfo, networkKey: string, amount: number, bondedValidators: string[], validatorInfo: ValidatorInfo, isBondedBefore: boolean, nominatorAddress: string, substrateApi: _SubstrateApi) {
  if (_STAKING_CHAIN_GROUP.para.includes(networkKey)) {
    return getParaBondingExtrinsic(nominatorAddress, chainInfo, substrateApi, amount, validatorInfo, bondedValidators.length);
  } else if (_STAKING_CHAIN_GROUP.astar.includes(networkKey)) {
    return getAstarBondingExtrinsic(substrateApi, chainInfo, amount, networkKey, nominatorAddress, validatorInfo);
  } else if (_STAKING_CHAIN_GROUP.amplitude.includes(networkKey)) {
    return getAmplitudeBondingExtrinsic(nominatorAddress, chainInfo, substrateApi, amount, validatorInfo);
  }

  const targetValidators: string[] = getTargetValidators(bondedValidators, validatorInfo.address);

  return getRelayBondingExtrinsic(substrateApi, nominatorAddress, amount, targetValidators, isBondedBefore, chainInfo);
}

export async function getUnbondingTxInfo (address: string, amount: number, networkKey: string, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, chainInfo: _ChainInfo, validatorAddress?: string, unstakeAll?: boolean) {
  if (_STAKING_CHAIN_GROUP.para.includes(networkKey)) {
    return handleParaUnbondingTxInfo(address, amount, networkKey, substrateApiMap, evmApiMap, chainInfo, validatorAddress as string, unstakeAll as boolean);
  } else if (_STAKING_CHAIN_GROUP.astar.includes(networkKey)) {
    return handleAstarUnbondingTxInfo(chainInfo, amount, networkKey, address, validatorAddress as string, substrateApiMap, evmApiMap);
  } else if (_STAKING_CHAIN_GROUP.amplitude.includes(networkKey)) {
    return handleAmplitudeUnbondingTxInfo(address, amount, networkKey, substrateApiMap, evmApiMap, chainInfo, validatorAddress as string, unstakeAll as boolean);
  }

  return handleRelayUnbondingTxInfo(address, amount, networkKey, substrateApiMap, evmApiMap, chainInfo);
}

export async function getUnbondingExtrinsic (address: string, amount: number, networkKey: string, chainInfo: _ChainInfo, substrateApi: _SubstrateApi, validatorAddress?: string, unstakeAll?: boolean) {
  if (_STAKING_CHAIN_GROUP.para.includes(networkKey)) {
    return getParaUnbondingExtrinsic(substrateApi, amount, chainInfo, validatorAddress as string, unstakeAll as boolean);
  } else if (_STAKING_CHAIN_GROUP.astar.includes(networkKey)) {
    return getAstarUnbondingExtrinsic(substrateApi, chainInfo, amount, networkKey, address, validatorAddress as string);
  } else if (_STAKING_CHAIN_GROUP.amplitude.includes(networkKey)) {
    return getAmplitudeUnbondingExtrinsic(substrateApi, amount, chainInfo, validatorAddress as string, unstakeAll as boolean);
  }

  return getRelayUnbondingExtrinsic(substrateApi, amount, chainInfo);
}

export async function getUnlockingInfo (substrateApi: _SubstrateApi, chainInfo: _ChainInfo, networkKey: string, address: string, type: StakingType, extraCollatorAddress?: string): Promise<UnlockingStakeInfo> {
  if (_STAKING_CHAIN_GROUP.para.includes(networkKey)) {
    return handleParaUnlockingInfo(substrateApi, chainInfo, networkKey, address, type);
  } else if (_STAKING_CHAIN_GROUP.astar.includes(networkKey)) {
    return handleAstarUnlockingInfo(substrateApi, chainInfo, networkKey, address, type);
  } else if (_STAKING_CHAIN_GROUP.amplitude.includes(networkKey)) {
    return handleAmplitudeUnlockingInfo(substrateApi, chainInfo, networkKey, address, type, extraCollatorAddress as string);
  }

  return handleRelayUnlockingInfo(substrateApi, chainInfo, networkKey, address, type);
}

export async function getWithdrawalTxInfo (address: string, networkKey: string, networkJson: _ChainInfo, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, validatorAddress?: string, action?: string) {
  if (_STAKING_CHAIN_GROUP.para.includes(networkKey)) {
    return handleParaWithdrawalTxInfo(networkKey, networkJson, substrateApiMap, evmApiMap, address, validatorAddress as string, action as string);
  } else if (_STAKING_CHAIN_GROUP.astar.includes(networkKey)) {
    return handleAstarWithdrawalTxInfo(networkKey, networkJson, substrateApiMap, evmApiMap, address);
  } else if (_STAKING_CHAIN_GROUP.amplitude.includes(networkKey)) {
    return handleAmplitudeWithdrawalTxInfo(networkKey, networkJson, substrateApiMap, evmApiMap, address);
  }

  return handleRelayWithdrawalTxInfo(address, networkKey, networkJson, substrateApiMap, evmApiMap);
}

export async function getWithdrawalExtrinsic (dotSamaApi: _SubstrateApi, networkKey: string, address: string, validatorAddress?: string, action?: string) {
  if (_STAKING_CHAIN_GROUP.para.includes(networkKey)) {
    return getParaWithdrawalExtrinsic(dotSamaApi, address, validatorAddress as string, action as string);
  } else if (_STAKING_CHAIN_GROUP.astar.includes(networkKey)) {
    return getAstarWithdrawalExtrinsic(dotSamaApi);
  } else if (_STAKING_CHAIN_GROUP.amplitude.includes(networkKey)) {
    return getAmplitudeWithdrawalExtrinsic(dotSamaApi, address);
  }

  return getRelayWithdrawalExtrinsic(dotSamaApi, address);
}

export async function getClaimRewardTxInfo (address: string, networkKey: string, chainInfo: _ChainInfo, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, stakingType: StakingType) {
  if (stakingType === StakingType.POOLED) {
    return handlePoolingClaimRewardTxInfo(address, networkKey, chainInfo, substrateApiMap, evmApiMap);
  } else if (_STAKING_CHAIN_GROUP.amplitude.includes(networkKey)) {
    return handleAmplitudeClaimRewardTxInfo(address, networkKey, chainInfo, substrateApiMap, evmApiMap);
  }

  return handleAstarClaimRewardTxInfo(address, networkKey, chainInfo, substrateApiMap, evmApiMap);
}

export async function getClaimRewardExtrinsic (substrateApi: _SubstrateApi, networkKey: string, address: string, stakingType: StakingType, validatorAddress?: string) {
  if (stakingType === StakingType.POOLED) {
    return getPoolingClaimRewardExtrinsic(substrateApi);
  } else if (_STAKING_CHAIN_GROUP.amplitude.includes(networkKey)) {
    return getAmplitudeClaimRewardExtrinsic(substrateApi);
  }

  return getAstarClaimRewardExtrinsic(substrateApi, validatorAddress as string, address);
}

export async function getDelegationInfo (substrateApi: _SubstrateApi, address: string, networkKey: string) {
  if (_STAKING_CHAIN_GROUP.para.includes(networkKey)) {
    return getParaDelegationInfo(substrateApi, address, networkKey);
  } else if (_STAKING_CHAIN_GROUP.amplitude.includes(networkKey)) {
    return getAmplitudeDelegationInfo(substrateApi, address);
  }

  return getAstarDelegationInfo(substrateApi, address, networkKey);
}
