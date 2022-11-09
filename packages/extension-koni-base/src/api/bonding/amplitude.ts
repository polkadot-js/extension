// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { parseRawNumber } from '@subwallet/extension-koni-base/utils';

export async function getAmplitudeBondingBasics (networkKey: string, dotSamaApi: ApiProps) {
  const apiProps = await dotSamaApi.isReady;

  const _round = (await apiProps.api.query.parachainStaking.round()).toHuman() as Record<string, string>;
  const round = parseRawNumber(_round.current);

  const [_totalStake, _totalIssuance, _inflation, _allCollators] = await Promise.all([
    apiProps.api.query.parachainStaking.totalCollatorStake(round),
    apiProps.api.query.balances.totalIssuance(),
    apiProps.api.query.parachainStaking.inflationConfig(),
    apiProps.api.query.parachainStaking.candidatePool()
  ]);


}

export async function getAmplitudeCollatorsInfo (networkKey: string, dotSamaApi: ApiProps, decimals: number, address: string) {
  const apiProps = await dotSamaApi.isReady;

  const _round = (await apiProps.api.query.parachainStaking.round()).toHuman() as Record<string, string>;
  const round = parseRawNumber(_round.current);

  const [_allCollators, _delegatorState] = await Promise.all([
    apiProps.api.query.parachainStaking.candidatePool.entries(),
    apiProps.api.query.parachainStaking.delegatorState(address)
  ]);


}
