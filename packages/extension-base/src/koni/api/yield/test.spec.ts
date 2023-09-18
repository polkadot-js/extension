// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import fetch from 'cross-fetch';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { BifrostLiquidStakingMeta } from '@subwallet/extension-base/koni/api/yield/bifrostLiquidStaking';

jest.setTimeout(50000);

describe('test earning APIs', () => {
  test('acala liquid staking', async () => {
    const providerUrl = 'wss://acala-rpc-0.aca-api.network';
    const provider = new WsProvider(providerUrl);
    const apiPromise = new ApiPromise({ provider });

    const api = await apiPromise.isReady;

    const [_bumpEraFrequency, _commissionRate, _estimatedRewardRatePerEra] = await Promise.all([
      api.query.homa.bumpEraFrequency(),
      api.query.homa.commissionRate(),
      api.query.homa.estimatedRewardRatePerEra()
    ]);

    const decimals = 10 ** 10;

    const eraFrequency = _bumpEraFrequency.toPrimitive() as number;
    const commissionRate = _commissionRate.toPrimitive() as number / decimals;
    const estimatedRewardRate = _estimatedRewardRatePerEra.toPrimitive() as number / decimals;

    console.log('here', eraFrequency, commissionRate, estimatedRewardRate);

    const YEAR = 365 * 24 * 60 * 60 * 1000;
    const estimatedBlockTime = 6 * 1000;

    const eraCountOneYear = Math.floor(YEAR / (estimatedBlockTime || 0) / eraFrequency);

    console.log('eraCountOneYear', eraCountOneYear);

    const apy = Math.pow(estimatedRewardRate - commissionRate + 1, eraCountOneYear) - 1;

    console.log('apy', apy);
  });

  test('bifrost liquid staking', async () => {
    const url = 'https://api.bifrost.app/api/site';

    const _data = await fetch(url, {
      method: 'GET'
    })
      .then((res) => res.json()) as Record<string, BifrostLiquidStakingMeta>;

    console.log(_data.vDOT);


  });
});
