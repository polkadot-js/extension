// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { BifrostLiquidStakingMeta } from '@subwallet/extension-base/koni/api/yield/bifrostLiquidStaking';
import fetch from 'cross-fetch';

import { ApiPromise, WsProvider } from '@polkadot/api';

jest.setTimeout(50000);

interface AcalaExchangeRate {
  exchangeRate: string,
  timestamp: string
}

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

  test('acala LDOT APY', async () => {
    const url = 'https://api.polkawallet.io/acala-liquid-staking-subql';
    const resp = await fetch(url, {
      method: 'post',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        // eslint-disable-next-line
        query: 'query{dailySummaries(first:30,orderBy:TIMESTAMP_DESC){nodes{exchangeRate timestamp}}}'
      })
    });

    const result = await resp.json() as Record<string, any>;

    // console.log('result', result);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const rateList = result.data.dailySummaries.nodes as AcalaExchangeRate[];

    console.log(rateList);

    let _30dAvgRate = 0;

    rateList.forEach(({ exchangeRate }) => {
      _30dAvgRate += parseFloat(exchangeRate);
    });

    _30dAvgRate = Math.floor(_30dAvgRate / 30);

    console.log('30d avg rate', _30dAvgRate, _30dAvgRate * 12);

    const annualRate = (_30dAvgRate / (10 ** 10)) ** 12;

    // const annualAPY = annualRate - 1;

    console.log('annualAPY', annualRate);

    console.log((0.1304197986 - 0.13037338530) ** 365);

    // const _30dAPR = _30dAvgRate / 10 ** 10;
    //
    // console.log('fuck', _30dAPR * 12);
    //
    // console.log('_30dApr', _30dAPR * 100);
    //
    // const dailyAPR = _30dAPR / 30;
    //
    // console.log('daily', dailyAPR * 365);
    //
    // const apy = calculateReward((accrueSpeed * 365) / 10 ** 10);
    //
    // console.log(apy.rewardInToken);
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
