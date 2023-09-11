// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { YieldPoolInfo, YieldPoolType, YieldStepDetail } from '@subwallet/extension-base/background/KoniTypes';
import { getYieldStakingCandidates } from '@subwallet/extension-koni-ui/messaging';
import { store } from '@subwallet/extension-koni-ui/stores';
import { SWTransactionResponse } from '@subwallet/extension-base/services/transaction-service/types';

export function fetchEarningChainValidators (
  poolInfo: YieldPoolInfo,
  unmount: boolean,
  setPoolLoading: (value: boolean) => void,
  setValidatorLoading: (value: boolean) => void,
  setForceFetchValidator: (value: boolean) => void
) {
  if (!unmount) {
    setValidatorLoading(true);
    getYieldStakingCandidates(poolInfo)
      .then((result) => {
        if (poolInfo.type === YieldPoolType.NATIVE_STAKING) {
          store.dispatch({ type: 'bonding/updateChainValidators', payload: { chain: poolInfo.chain, validators: result } });
        } else {
          store.dispatch({ type: 'bonding/updateNominationPools', payload: { chain: poolInfo.chain, pools: result } });
        }
      })
      .catch(console.error)
      .finally(() => {
        if (!unmount) {
          if (poolInfo.type === YieldPoolType.NATIVE_STAKING) {
            setValidatorLoading(false);
          } else {
            setPoolLoading(false);
          }

          setForceFetchValidator(false);
        }
      });
  }
}

// export async function handleYieldProcess (
//   yieldPoolInfo: YieldPoolInfo,
//   steps: YieldStepDetail[],
//   currentStep: number
// ): Promise<SWTransactionResponse> {
//
// }
