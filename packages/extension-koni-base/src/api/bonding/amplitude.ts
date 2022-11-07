// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {ApiProps, ValidatorInfo} from "@subwallet/extension-base/background/KoniTypes";

export async function getAmplitudeCollatorsInfo (networkKey: string, dotSamaApi: ApiProps, decimals: number, address: string) {
  const apiProps = await dotSamaApi.isReady;

  const allValidators: ValidatorInfo[] = [];

  const [_allCollators, _delegatorState, _collatorCommission] = await Promise.all([
    apiProps.api.query.parachainStaking.candidatePool.entries(),
    apiProps.api.query.parachainStaking.delegatorState(address),
    apiProps.api.query.parachainStaking.collatorCommission()
  ]);

  
}
