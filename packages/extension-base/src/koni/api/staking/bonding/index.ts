// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { ChainStakingMetadata, NominatorMetadata, StakingType, UnstakingInfo, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { getAmplitudeBondingExtrinsic, getAmplitudeCancelWithdrawalExtrinsic, getAmplitudeClaimRewardExtrinsic, getAmplitudeCollatorsInfo, getAmplitudeNominatorMetadata, getAmplitudeStakingMetadata, getAmplitudeUnbondingExtrinsic, getAmplitudeWithdrawalExtrinsic } from '@subwallet/extension-base/koni/api/staking/bonding/amplitude';
import { getAstarBondingExtrinsic, getAstarClaimRewardExtrinsic, getAstarDappsInfo, getAstarNominatorMetadata, getAstarStakingMetadata, getAstarUnbondingExtrinsic, getAstarWithdrawalExtrinsic } from '@subwallet/extension-base/koni/api/staking/bonding/astar';
import { getParaBondingExtrinsic, getParaCancelWithdrawalExtrinsic, getParachainCollatorsInfo, getParaChainNominatorMetadata, getParaChainStakingMetadata, getParaUnbondingExtrinsic, getParaWithdrawalExtrinsic } from '@subwallet/extension-base/koni/api/staking/bonding/paraChain';
import { getPoolingClaimRewardExtrinsic, getPoolingWithdrawalExtrinsic, getRelayBondingExtrinsic, getRelayCancelWithdrawalExtrinsic, getRelayChainNominatorMetadata, getRelayChainStakingMetadata, getRelayPoolsInfo, getRelayUnbondingExtrinsic, getRelayValidatorsInfo, getRelayWithdrawalExtrinsic } from '@subwallet/extension-base/koni/api/staking/bonding/relayChain';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/chain-service/constants';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';

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

export async function getBondingExtrinsic (chainInfo: _ChainInfo, amount: string, nominatorMetadata: NominatorMetadata, selectedValidators: ValidatorInfo[], substrateApi: _SubstrateApi) {
  if (_STAKING_CHAIN_GROUP.para.includes(chainInfo.slug)) {
    return getParaBondingExtrinsic(nominatorMetadata, chainInfo, substrateApi, amount, selectedValidators[0]); // only select 1 validator at a time
  } else if (_STAKING_CHAIN_GROUP.astar.includes(chainInfo.slug)) {
    return getAstarBondingExtrinsic(substrateApi, amount, selectedValidators[0]);
  } else if (_STAKING_CHAIN_GROUP.amplitude.includes(chainInfo.slug)) {
    return getAmplitudeBondingExtrinsic(nominatorMetadata, substrateApi, amount, selectedValidators[0]);
  }

  return getRelayBondingExtrinsic(substrateApi, amount, selectedValidators, nominatorMetadata, chainInfo);
}

export async function getUnbondingExtrinsic (nominatorMetadata: NominatorMetadata, amount: string, chain: string, substrateApi: _SubstrateApi, selectedValidator?: string) {
  if (_STAKING_CHAIN_GROUP.para.includes(chain)) {
    return getParaUnbondingExtrinsic(substrateApi, amount, nominatorMetadata, selectedValidator as string);
  } else if (_STAKING_CHAIN_GROUP.astar.includes(chain)) {
    return getAstarUnbondingExtrinsic(substrateApi, amount, selectedValidator as string);
  } else if (_STAKING_CHAIN_GROUP.amplitude.includes(chain)) {
    return getAmplitudeUnbondingExtrinsic(substrateApi, amount, nominatorMetadata, selectedValidator as string);
  }

  return getRelayUnbondingExtrinsic(substrateApi, amount, nominatorMetadata);
}

export async function getWithdrawalExtrinsic (substrateApi: _SubstrateApi, chain: string, nominatorMetadata: NominatorMetadata, validatorAddress?: string) {
  if (nominatorMetadata.type === StakingType.POOLED) {
    return getPoolingWithdrawalExtrinsic(substrateApi, nominatorMetadata);
  }

  if (_STAKING_CHAIN_GROUP.para.includes(chain)) {
    return getParaWithdrawalExtrinsic(substrateApi, nominatorMetadata.address, validatorAddress as string);
  } else if (_STAKING_CHAIN_GROUP.astar.includes(chain)) {
    return getAstarWithdrawalExtrinsic(substrateApi);
  } else if (_STAKING_CHAIN_GROUP.amplitude.includes(chain)) {
    return getAmplitudeWithdrawalExtrinsic(substrateApi, nominatorMetadata.address);
  }

  return getRelayWithdrawalExtrinsic(substrateApi, nominatorMetadata.address);
}

export async function getClaimRewardExtrinsic (substrateApi: _SubstrateApi, chain: string, address: string, stakingType: StakingType, validatorAddress?: string) {
  if (stakingType === StakingType.POOLED) {
    return getPoolingClaimRewardExtrinsic(substrateApi); // TODO
  } else if (_STAKING_CHAIN_GROUP.amplitude.includes(chain)) {
    return getAmplitudeClaimRewardExtrinsic(substrateApi);
  }

  return getAstarClaimRewardExtrinsic(substrateApi, validatorAddress as string, address);
}

export async function getCancelWithdrawalExtrinsic (substrateApi: _SubstrateApi, chain: string, selectedUnstaking: UnstakingInfo) {
  if (_STAKING_CHAIN_GROUP.para.includes(chain)) {
    return getParaCancelWithdrawalExtrinsic(substrateApi, selectedUnstaking);
  } else if (_STAKING_CHAIN_GROUP.amplitude.includes(chain)) {
    return getAmplitudeCancelWithdrawalExtrinsic(substrateApi);
  }

  return getRelayCancelWithdrawalExtrinsic(substrateApi, selectedUnstaking);
}
