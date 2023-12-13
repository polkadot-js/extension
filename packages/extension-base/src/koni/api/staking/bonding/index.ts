// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { _ChainInfo } from '@subwallet/chain-list/types';
import { TransactionError } from '@subwallet/extension-base/background/errors/TransactionError';
import { ChainStakingMetadata, NominatorMetadata, StakingType, UnstakingInfo, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { getAmplitudeBondingExtrinsic, getAmplitudeClaimRewardExtrinsic, getAmplitudeCollatorsInfo, getAmplitudeNominatorMetadata, getAmplitudeStakingMetadata, getAmplitudeUnbondingExtrinsic, getAmplitudeWithdrawalExtrinsic, subscribeAmplitudeStakingMetadata } from '@subwallet/extension-base/koni/api/staking/bonding/amplitude';
import { getAstarBondingExtrinsic, getAstarClaimRewardExtrinsic, getAstarDappsInfo, getAstarNominatorMetadata, getAstarStakingMetadata, getAstarUnbondingExtrinsic, getAstarWithdrawalExtrinsic, subscribeAstarStakingMetadata } from '@subwallet/extension-base/koni/api/staking/bonding/astar';
import { getParaBondingExtrinsic, getParaCancelWithdrawalExtrinsic, getParachainCollatorsInfo, getParaChainNominatorMetadata, getParaChainStakingMetadata, getParaUnbondingExtrinsic, getParaWithdrawalExtrinsic, subscribeParaChainStakingMetadata, validateParaChainBondingCondition, validateParaChainUnbondingCondition } from '@subwallet/extension-base/koni/api/staking/bonding/paraChain';
import { getPoolingClaimRewardExtrinsic, getPoolingWithdrawalExtrinsic, getRelayBondingExtrinsic, getRelayCancelWithdrawalExtrinsic, getRelayChainNominatorMetadata, getRelayChainStakingMetadata, getRelayPoolsInfo, getRelayUnbondingExtrinsic, getRelayValidatorsInfo, getRelayWithdrawalExtrinsic, subscribeRelayChainStakingMetadata, validateRelayBondingCondition, validateRelayUnbondingCondition } from '@subwallet/extension-base/koni/api/staking/bonding/relayChain';
import { _STAKING_CHAIN_GROUP } from '@subwallet/extension-base/services/chain-service/constants';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';

// all addresses must be converted to its chain format

export function validateUnbondingCondition (nominatorMetadata: NominatorMetadata, amount: string, chain: string, chainStakingMetadata: ChainStakingMetadata, selectedValidator?: string): TransactionError[] {
  if (nominatorMetadata.type === StakingType.LIQUID_STAKING) {
    return [];
  }

  if (_STAKING_CHAIN_GROUP.relay.includes(chain)) {
    return validateRelayUnbondingCondition(amount, chainStakingMetadata, nominatorMetadata);
  }

  return validateParaChainUnbondingCondition(amount, nominatorMetadata, chainStakingMetadata, selectedValidator as string);
}

export function validateBondingCondition (chainInfo: _ChainInfo, amount: string, selectedValidators: ValidatorInfo[], address: string, chainStakingMetadata: ChainStakingMetadata, nominatorMetadata?: NominatorMetadata): TransactionError[] {
  if (_STAKING_CHAIN_GROUP.relay.includes(chainInfo.slug)) {
    return validateRelayBondingCondition(chainInfo, amount, selectedValidators, address, chainStakingMetadata, nominatorMetadata);
  }

  return validateParaChainBondingCondition(chainInfo, amount, selectedValidators, address, chainStakingMetadata, nominatorMetadata);
}

export async function getChainStakingMetadata (chainInfo: _ChainInfo, substrateApi: _SubstrateApi): Promise<ChainStakingMetadata> {
  if (_STAKING_CHAIN_GROUP.astar.includes(chainInfo.slug)) {
    return getAstarStakingMetadata(chainInfo.slug, substrateApi);
  } else if (_STAKING_CHAIN_GROUP.para.includes(chainInfo.slug)) {
    return getParaChainStakingMetadata(chainInfo.slug, substrateApi);
  } else if (_STAKING_CHAIN_GROUP.amplitude.includes(chainInfo.slug)) {
    return getAmplitudeStakingMetadata(chainInfo.slug, substrateApi);
  }

  return getRelayChainStakingMetadata(chainInfo, substrateApi);
}

/**
 * Deprecated
 * */
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

export async function getBondingExtrinsic (chainInfo: _ChainInfo, amount: string, selectedValidators: ValidatorInfo[], substrateApi: _SubstrateApi, address: string, nominatorMetadata?: NominatorMetadata) {
  if (_STAKING_CHAIN_GROUP.para.includes(chainInfo.slug)) {
    return getParaBondingExtrinsic(chainInfo, substrateApi, amount, selectedValidators[0], nominatorMetadata); // only select 1 validator at a time
  } else if (_STAKING_CHAIN_GROUP.astar.includes(chainInfo.slug)) {
    return getAstarBondingExtrinsic(substrateApi, amount, selectedValidators[0]);
  } else if (_STAKING_CHAIN_GROUP.amplitude.includes(chainInfo.slug)) {
    return getAmplitudeBondingExtrinsic(substrateApi, amount, selectedValidators[0], nominatorMetadata);
  }

  return getRelayBondingExtrinsic(substrateApi, amount, selectedValidators, chainInfo, address, nominatorMetadata);
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

export async function getClaimRewardExtrinsic (substrateApi: _SubstrateApi, chain: string, address: string, stakingType: StakingType, bondReward = true) {
  if (stakingType === StakingType.POOLED) {
    return getPoolingClaimRewardExtrinsic(substrateApi, bondReward);
  } else if (_STAKING_CHAIN_GROUP.amplitude.includes(chain)) {
    return getAmplitudeClaimRewardExtrinsic(substrateApi);
  }

  return getAstarClaimRewardExtrinsic(substrateApi, address);
}

export async function getCancelWithdrawalExtrinsic (substrateApi: _SubstrateApi, chain: string, selectedUnstaking: UnstakingInfo) {
  if (_STAKING_CHAIN_GROUP.para.includes(chain)) {
    return getParaCancelWithdrawalExtrinsic(substrateApi, selectedUnstaking);
  }

  return getRelayCancelWithdrawalExtrinsic(substrateApi, selectedUnstaking);
}

export function subscribeEssentialChainStakingMetadata (substrateApiMap: Record<string, _SubstrateApi>, chainInfoMap: Record<string, _ChainInfo>, callback: (chain: string, rs: ChainStakingMetadata) => void) {
  const unsubList: VoidFunction[] = [];

  // TODO: replace with for of to improve performance
  // eslint-disable-next-line @typescript-eslint/no-misused-promises
  Object.values(chainInfoMap).forEach(async (chainInfo: _ChainInfo) => {
    if (!substrateApiMap[chainInfo.slug]) {
      return;
    }

    const substrateApi = await substrateApiMap[chainInfo.slug].isReady;

    if (_STAKING_CHAIN_GROUP.astar.includes(chainInfo.slug)) {
      const unsub = await subscribeAstarStakingMetadata(chainInfo.slug, substrateApi, callback);

      // @ts-ignore
      unsubList.push(unsub);
    } else if (_STAKING_CHAIN_GROUP.para.includes(chainInfo.slug)) {
      const unsub = await subscribeParaChainStakingMetadata(chainInfo.slug, substrateApi, callback);

      // @ts-ignore
      unsubList.push(unsub);
    } else if (_STAKING_CHAIN_GROUP.amplitude.includes(chainInfo.slug)) {
      const unsub = await subscribeAmplitudeStakingMetadata(chainInfo.slug, substrateApi, callback);

      // @ts-ignore
      unsubList.push(unsub);
    } else if (_STAKING_CHAIN_GROUP.relay.includes(chainInfo.slug)) {
      const unsub = await subscribeRelayChainStakingMetadata(chainInfo, substrateApi, callback);

      // @ts-ignore
      unsubList.push(unsub);
    }
  });

  return () => {
    unsubList.forEach((unsub) => {
      unsub && unsub();
    });
  };
}
