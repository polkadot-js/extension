// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { ChainStakingMetadata, NominatorMetadata, StakingType, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/chain-service/constants';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { getAmplitudeBondingExtrinsic, getAmplitudeClaimRewardExtrinsic, getAmplitudeCollatorsInfo, getAmplitudeNominatorMetadata, getAmplitudeStakingMetadata, getAmplitudeUnbondingExtrinsic, getAmplitudeWithdrawalExtrinsic } from '@subwallet/extension-koni-base/api/staking/bonding/amplitude';
import { getAstarBondingExtrinsic, getAstarClaimRewardExtrinsic, getAstarDappsInfo, getAstarNominatorMetadata, getAstarStakingMetadata, getAstarUnbondingExtrinsic, getAstarWithdrawalExtrinsic } from '@subwallet/extension-koni-base/api/staking/bonding/astar';
import { getParaBondingExtrinsic, getParachainCollatorsInfo, getParaChainNominatorMetadata, getParaChainStakingMetadata, getParaUnbondingExtrinsic, getParaWithdrawalExtrinsic } from '@subwallet/extension-koni-base/api/staking/bonding/paraChain';
import { getPoolingClaimRewardExtrinsic, getRelayBondingExtrinsic, getRelayChainNominatorMetadata, getRelayChainStakingMetadata, getRelayPoolsInfo, getRelayUnbondingExtrinsic, getRelayValidatorsInfo, getRelayWithdrawalExtrinsic } from '@subwallet/extension-koni-base/api/staking/bonding/relayChain';

// all addresses must be converted to its chain format

export async function getChainStakingMetadata (chain: string, substrateApi: _SubstrateApi): Promise<ChainStakingMetadata> {
  if (_STAKING_CHAIN_GROUP.astar.includes(chain)) {
    return getAstarStakingMetadata(chain, substrateApi);
  } else if (_STAKING_CHAIN_GROUP.para.includes(chain)) {
    return getParaChainStakingMetadata(chain, substrateApi);
  } else if (_STAKING_CHAIN_GROUP.amplitude.includes(chain)) {
    return getAmplitudeStakingMetadata(chain, substrateApi);
  }

  return getRelayChainStakingMetadata(chain, substrateApi);
}

export async function getNominatorMetadata (chainInfo: _ChainInfo, address: string, substrateApi: _SubstrateApi): Promise<NominatorMetadata | undefined> {
  if (_STAKING_CHAIN_GROUP.astar.includes(chainInfo.slug)) {
    return getAstarNominatorMetadata(chainInfo, address, substrateApi);
  } else if (_STAKING_CHAIN_GROUP.para.includes(chainInfo.slug)) {
    return getParaChainNominatorMetadata(chainInfo, address, substrateApi);
  } else if (_STAKING_CHAIN_GROUP.amplitude.includes(chainInfo.slug)) {
    return getAmplitudeNominatorMetadata(chainInfo, address, substrateApi);
  }

  return getRelayChainNominatorMetadata(chainInfo, address, substrateApi);
}

export async function getValidatorsInfo (networkKey: string, substrateApi: _SubstrateApi, decimals: number, chainStakingMetadata: ChainStakingMetadata): Promise<ValidatorInfo[]> {
  if (_STAKING_CHAIN_GROUP.para.includes(networkKey)) {
    return getParachainCollatorsInfo(networkKey, substrateApi);
  } else if (_STAKING_CHAIN_GROUP.astar.includes(networkKey)) {
    return getAstarDappsInfo(networkKey, substrateApi);
  } else if (_STAKING_CHAIN_GROUP.amplitude.includes(networkKey)) {
    return getAmplitudeCollatorsInfo(networkKey, substrateApi);
  }

  return getRelayValidatorsInfo(networkKey, substrateApi, decimals, chainStakingMetadata);
}

export async function getNominationPoolsInfo (chain: string, substrateApi: _SubstrateApi) {
  return getRelayPoolsInfo(chain, substrateApi);
}

export async function getBondingExtrinsic (chainInfo: _ChainInfo, chain: string, amount: string, nominatorMetadata: NominatorMetadata, selectedValidators: ValidatorInfo[], substrateApi: _SubstrateApi) {
  if (_STAKING_CHAIN_GROUP.para.includes(chain)) {
    return getParaBondingExtrinsic(nominatorMetadata, chainInfo, substrateApi, amount, selectedValidators[0]); // only select 1 validator at a time
  } else if (_STAKING_CHAIN_GROUP.astar.includes(chain)) {
    return getAstarBondingExtrinsic(substrateApi, amount, selectedValidators[0]);
  } else if (_STAKING_CHAIN_GROUP.amplitude.includes(chain)) {
    return getAmplitudeBondingExtrinsic(nominatorMetadata, substrateApi, amount, selectedValidators[0]);
  }

  return getRelayBondingExtrinsic(substrateApi, amount, selectedValidators, nominatorMetadata, chainInfo);
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

export async function getClaimRewardExtrinsic (substrateApi: _SubstrateApi, networkKey: string, address: string, stakingType: StakingType, validatorAddress?: string) {
  if (stakingType === StakingType.POOLED) {
    return getPoolingClaimRewardExtrinsic(substrateApi);
  } else if (_STAKING_CHAIN_GROUP.amplitude.includes(networkKey)) {
    return getAmplitudeClaimRewardExtrinsic(substrateApi);
  }

  return getAstarClaimRewardExtrinsic(substrateApi, validatorAddress as string, address);
}
