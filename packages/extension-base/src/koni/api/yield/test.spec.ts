// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { ChainAssetMap, ChainInfoMap } from '@subwallet/chain-list';
import { _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { OptimalYieldPath, YieldPoolInfo, YieldStepType } from '@subwallet/extension-base/background/KoniTypes';
import { BifrostLiquidStakingMeta } from '@subwallet/extension-base/koni/api/yield/bifrostLiquidStaking';
import { YIELD_POOLS_INFO } from '@subwallet/extension-base/koni/api/yield/data';
import { DEFAULT_YIELD_FIRST_STEP } from '@subwallet/extension-base/koni/api/yield/helper/utils';
import fetch from 'cross-fetch';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { BN, BN_ZERO } from '@polkadot/util';

jest.setTimeout(50000);

interface AcalaExchangeRate {
  exchangeRate: string,
  timestamp: string
}

function testPath (params: {
  amount: string,
  poolInfo: YieldPoolInfo,

  assetInfoMap: Record<string, _ChainAsset>,
  chainInfoMap: Record<string, _ChainInfo>
  balanceMap: Record<string, string>,
}) {
  const bnAmount = new BN(params.amount);
  const result: OptimalYieldPath = {
    totalFee: [],
    steps: [DEFAULT_YIELD_FIRST_STEP]
  };

  const inputTokenSlug = params.poolInfo.inputAssets[0]; // assume that the pool only has 1 input token, will update later
  const inputTokenInfo = params.assetInfoMap[inputTokenSlug];

  const altInputTokenSlug = params.poolInfo.altInputAssets ? params.poolInfo?.altInputAssets[0] : '';
  const altInputTokenInfo = params.assetInfoMap[altInputTokenSlug];

  const inputTokenBalance = params.balanceMap[inputTokenSlug];
  const altInputTokenBalance = params.balanceMap[altInputTokenSlug];

  const bnInputTokenBalance = new BN(inputTokenBalance);

  if (!bnInputTokenBalance.gte(bnAmount)) {
    if (params.poolInfo.altInputAssets) {
      const bnAltInputTokenBalance = new BN(altInputTokenBalance || '0');

      if (bnAltInputTokenBalance.gt(BN_ZERO)) {
        result.steps.push({
          id: result.steps.length,
          metadata: {
            sendingValue: bnAmount.toString(),
            originTokenInfo: altInputTokenInfo,
            destinationTokenInfo: inputTokenInfo
          },
          name: 'Transfer DOT from Polkadot',
          type: YieldStepType.XCM
        });
      }
    }
  }

  if (params.poolInfo.slug === 'DOT___bifrost_liquid_staking') {
    result.steps.push({
      id: result.steps.length,
      name: 'Mint vDOT',
      type: YieldStepType.MINT_VDOT
    });
  } else if (params.poolInfo.slug === 'DOT___acala_liquid_staking') {
    result.steps.push({
      id: result.steps.length,
      name: 'Mint LDOT',
      type: YieldStepType.MINT_LDOT
    });
  } else if (params.poolInfo.slug === 'DOT___interlay_lending') {
    result.steps.push({
      id: result.steps.length,
      name: 'Mint qDOT',
      type: YieldStepType.MINT_QDOT
    });
  } else if (params.poolInfo.slug === 'DOT___parallel_liquid_staking') {
    result.steps.push({
      id: result.steps.length,
      name: 'Mint sDOT',
      type: YieldStepType.MINT_SDOT
    });
  }

  return result;
}

function validateProcess (params: {
  amount: string,
  poolInfo: YieldPoolInfo,

  assetInfoMap: Record<string, _ChainAsset>,
  chainInfoMap: Record<string, _ChainInfo>
  balanceMap: Record<string, string>
}, path: OptimalYieldPath) {
  for (let i = 0; i < path.steps.length; i++) {
    if (i !== 0) {
      if (path.steps[i].type === YieldStepType.XCM) {
        const decimals = (10 ** 10);
        const formattedAmount = parseInt(path.totalFee[i].amount || '0') / decimals;

        console.log('XCM fee: ', formattedAmount, path.totalFee[i].slug);
      } else {
        const decimals = (10 ** 12);
        const formattedAmount = parseInt(path.totalFee[i].amount || '0') / decimals;

        console.log('Tx fee: ', formattedAmount, path.totalFee[i].slug);
      }
    }
  }

  const bnAmount = new BN(params.amount);
  const inputTokenSlug = params.poolInfo.inputAssets[0]; // TODO
  const bnInputTokenBalance = new BN(params.balanceMap[inputTokenSlug] || '0');

  let isXcmOk = false;

  if (path.steps[1].type === YieldStepType.XCM && params.poolInfo.altInputAssets) { // if xcm
    const missingAmount = bnAmount.sub(bnInputTokenBalance); // TODO: what if input token is not LOCAL ??
    const xcmFee = new BN(path.totalFee[0].amount || '0');
    const xcmAmount = missingAmount.add(xcmFee);

    const altInputTokenSlug = params.poolInfo.altInputAssets[0];
    const bnAltInputTokenBalance = new BN(params.balanceMap[altInputTokenSlug] || '0');
    const altInputTokenMinAmount = new BN(params.assetInfoMap[altInputTokenSlug].minAmount || '0');

    if (!bnAltInputTokenBalance.sub(xcmAmount).gte(altInputTokenMinAmount)) {
      console.log('Validation result: not enough balance to XCM');

      return;
    }

    isXcmOk = true;
  }

  const submitStep = path.steps[1].type === YieldStepType.XCM ? path.steps[2] : path.steps[1];
  const feeTokenSlug = path.totalFee[submitStep.id].slug;
  const defaultFeeTokenSlug = params.poolInfo.feeAssets[0];

  if (params.poolInfo.feeAssets.length === 1 && feeTokenSlug === defaultFeeTokenSlug) {
    const bnFeeAmount = new BN(path.totalFee[submitStep.id]?.amount || '0');
    const bnFeeTokenBalance = new BN(params.balanceMap[feeTokenSlug] || '0');
    const bnFeeTokenMinAmount = new BN(params.assetInfoMap[feeTokenSlug]?.minAmount || '0');

    if (!bnFeeTokenBalance.sub(bnFeeAmount).gte(bnFeeTokenMinAmount)) {
      console.log('Validation result: not enough fee to join pool');

      return;
    }
  }

  if (!bnAmount.gte(new BN(params.poolInfo.stats?.minJoinPool || '0'))) {
    console.log('Validation result: amount not enough min join pool');

    return;
  }

  if (!isXcmOk && bnAmount.gt(bnInputTokenBalance)) {
    console.log('Validation result: not enough input token balance');

    return;
  }

  console.log('Validation result: ok');
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

  test('validate earning steps', () => {
    const testCases = [
      {
        amount: '100000',
        balanceMap: {
          'bifrost_dot-NATIVE-BNC': '1000000000000',
          'bifrost_dot-LOCAL-DOT': '10000000000000',
          'polkadot-NATIVE-DOT': '0'
        }
      }, // amount = 0
      {
        amount: '1000000000000',
        balanceMap: {
          'bifrost_dot-NATIVE-BNC': '1000000000000',
          'bifrost_dot-LOCAL-DOT': '10000000000000',
          'polkadot-NATIVE-DOT': '0'
        }
      }, // amount < available balance, enough fee
      {
        amount: '1000000000000',
        balanceMap: {
          'bifrost_dot-NATIVE-BNC': '0',
          'bifrost_dot-LOCAL-DOT': '10000000000000',
          'polkadot-NATIVE-DOT': '0'
        }
      }, // amount < available balance, not enough fee
      {
        amount: '10000000000000',
        balanceMap: {
          'bifrost_dot-NATIVE-BNC': '1000000000000',
          'bifrost_dot-LOCAL-DOT': '10000000000',
          'polkadot-NATIVE-DOT': '10000000000000000'
        }
      }, // amount > available balance
      {
        amount: '10000000000000',
        balanceMap: {
          'bifrost_dot-NATIVE-BNC': '0',
          'bifrost_dot-LOCAL-DOT': '10000000000',
          'polkadot-NATIVE-DOT': '10000000000000000'
        }
      }, // amount > available balance, not enough fee
      {
        amount: '1000000000000',
        balanceMap: {
          'bifrost_dot-NATIVE-BNC': '1000000000000',
          'bifrost_dot-LOCAL-DOT': '0',
          'polkadot-NATIVE-DOT': '1000000000'
        }
      }, // amount > available balance + has alt token
      {
        amount: '1000000000000',
        balanceMap: {
          'bifrost_dot-NATIVE-BNC': '1000000000000',
          'bifrost_dot-LOCAL-DOT': '0',
          'polkadot-NATIVE-DOT': '0'
        }
      } // amount > available balance + has no alt token
    ];
    const testPaths: OptimalYieldPath[] = [
      {
        totalFee: [
          { slug: '' },
          {
            slug: 'bifrost_dot-NATIVE-BNC',
            amount: '500000000000'
          }
        ],
        steps: [
          DEFAULT_YIELD_FIRST_STEP,
          {
            id: 1,
            name: 'Mint vDOT',
            type: YieldStepType.MINT_VDOT
          }
        ]
      },
      {
        totalFee: [
          { slug: '' },
          {
            slug: 'polkadot-NATIVE-DOT',
            amount: '5000000000'
          },
          {
            slug: 'bifrost_dot-NATIVE-BNC',
            amount: '500000000000'
          }
        ],
        steps: [
          DEFAULT_YIELD_FIRST_STEP,
          {
            id: 1,
            name: 'Transfer DOT from Polkadot',
            type: YieldStepType.XCM
          },
          {
            id: 2,
            name: 'Mint vDOT',
            type: YieldStepType.MINT_VDOT
          }
        ]
      }
    ];

    const poolInfo: YieldPoolInfo = {
      ...YIELD_POOLS_INFO.DOT___bifrost_liquid_staking,
      stats: {
        assetEarning: [
          { slug: 'bifrost_dot-LOCAL-DOT', exchangeRate: 1.19, apy: 20.05 }
        ],
        maxCandidatePerFarmer: 1,
        maxWithdrawalRequestPerFarmer: 1,
        minJoinPool: '50000000000',
        minWithdrawal: '0',
        totalApy: 20.05
      }
    };

    for (const test of testCases) {
      const result = testPath({
        amount: test.amount,
        assetInfoMap: ChainAssetMap,
        balanceMap: test.balanceMap,
        chainInfoMap: ChainInfoMap,
        poolInfo
      });

      const decimals = (10 ** 10);
      const formattedAmount = parseInt(test.amount) / decimals;
      const balance = parseInt(test.balanceMap['bifrost_dot-LOCAL-DOT']) / decimals;
      const altBalance = parseInt(test.balanceMap['polkadot-NATIVE-DOT']) / decimals;
      const defaultFeeTokenBalance = parseInt(test.balanceMap['bifrost_dot-NATIVE-BNC']) / (10 ** 12);

      console.log('Amount: ', formattedAmount);
      console.log('DOT - Bifrost: ', balance);
      console.log('DOT - Polkadot: ', altBalance);
      console.log('BNC - Bifrost: ', defaultFeeTokenBalance);
      console.log('Min stake: ', poolInfo.stats?.minJoinPool);

      console.log('Result: ', result.steps);

      validateProcess({
        amount: test.amount,
        assetInfoMap: ChainAssetMap,
        balanceMap: test.balanceMap,
        chainInfoMap: ChainInfoMap,
        poolInfo
      }, result.steps.length === 2 ? testPaths[0] : testPaths[1]);

      console.log('------------------------------------');
    }
  });
});
