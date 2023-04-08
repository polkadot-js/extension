// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakingType } from "@subwallet/extension-base/background/KoniTypes"
import { ALL_KEY } from "@subwallet-webapp/constants/common"
import {
  getBondingOptions,
  getNominationPoolOptions,
} from "@subwallet-webapp/messaging"
import { store } from "@subwallet-webapp/stores"

export function getUnstakingPeriod(unstakingPeriod?: number) {
  if (unstakingPeriod) {
    const days = unstakingPeriod / 24

    if (days < 1) {
      return `${unstakingPeriod} hours`
    } else {
      return `${days} days`
    }
  }

  return ""
}

export function getWaitingTime(waitingTime?: number) {
  const days = waitingTime ? +Number(waitingTime / 24).toFixed(2) : 0

  if (days < 1) {
    if (days) {
      return "Withdraw in <1 day"
    } else {
      return "Available for withdraw"
    }
  } else {
    return `Withdraw in ${days} days`
  }
}

const fetchChainValidator = (
  chain: string,
  unmount: boolean,
  setValidatorLoading: (value: boolean) => void
) => {
  if (!unmount) {
    setValidatorLoading(true)
    getBondingOptions(chain, StakingType.NOMINATED)
      .then((result) => {
        store.dispatch({
          type: "bonding/updateChainValidators",
          payload: { chain, validators: result },
        })
      })
      .catch(console.error)
      .finally(() => {
        if (!unmount) {
          setValidatorLoading(false)
        }
      })
  }
}

const fetchChainPool = (
  chain: string,
  unmount: boolean,
  setPoolLoading: (value: boolean) => void
) => {
  if (!unmount) {
    setPoolLoading(true)
    getNominationPoolOptions(chain)
      .then((result) => {
        store.dispatch({
          type: "bonding/updateNominationPools",
          payload: { chain, pools: result },
        })
      })
      .catch(console.error)
      .finally(() => {
        if (!unmount) {
          setPoolLoading(false)
        }
      })
  }
}

export function fetchChainValidators(
  chain: string,
  stakingType: string,
  unmount: boolean,
  setPoolLoading: (value: boolean) => void,
  setValidatorLoading: (value: boolean) => void
) {
  if (stakingType === ALL_KEY) {
    fetchChainValidator(chain, unmount, setValidatorLoading)
    fetchChainPool(chain, unmount, setPoolLoading)
  } else if (stakingType === StakingType.NOMINATED) {
    fetchChainValidator(chain, unmount, setValidatorLoading)
  } else if (stakingType === StakingType.POOLED) {
    fetchChainPool(chain, unmount, setPoolLoading)
  }
}
