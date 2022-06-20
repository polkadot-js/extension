// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PREDEFINED_NETWORKS } from '@subwallet/extension-koni-base/api/predefinedNetworks';
import { DOTSAMA_AUTO_CONNECT_MS } from '@subwallet/extension-koni-base/constants';
import { getCurrentProvider } from '@subwallet/extension-koni-base/utils/utils';

import { ApiPromise, WsProvider } from '@polkadot/api';

jest.setTimeout(50000);

function calculateChainStakedReturn (inflation: number, totalEraStake: number, totalIssuance: number, networkKey: string) {
  const stakedFraction = totalEraStake / totalIssuance;
  let stakedReturn = inflation / stakedFraction;

  if (networkKey === 'aleph') {
    stakedReturn *= 0.9; // 10% goes to treasury
  }

  return stakedReturn;
}

describe('test DotSama APIs', () => {
  test('test get Validator', async () => {
    const provider = new WsProvider(getCurrentProvider(PREDEFINED_NETWORKS.moonbeam), DOTSAMA_AUTO_CONNECT_MS);
    const api = new ApiPromise({ provider });
    const apiPromise = await api.isReady;

    const resp = await apiPromise.query.parachainStaking.candidatePool();

    console.log(resp.toHuman());

    const validatorInfo = await apiPromise.query.parachainStaking.candidateInfo('0x10023fA70Ed528E4F28915bf210f6e87b057c08E');

    console.log(validatorInfo.toHuman());
  });

  test('get chain APY', async () => {
    const provider = new WsProvider(getCurrentProvider(PREDEFINED_NETWORKS.hydradx), DOTSAMA_AUTO_CONNECT_MS);
    const api = new ApiPromise({ provider });
    const apiPromise = await api.isReady;

    const totalStake = await apiPromise.query.parachainStaking.total();
    const _totalStake = totalStake.toHuman() as string;
    const parsedTotalStake = parseFloat(_totalStake.replaceAll(',', ''));

    const totalIssuance = await apiPromise.query.balances.totalIssuance();
    const _totalIssuance = totalIssuance.toHuman() as string;
    const parsedTotalIssuance = parseFloat(_totalIssuance.replaceAll(',', ''));

    const stakedReturn = calculateChainStakedReturn(0.025, parsedTotalStake, parsedTotalIssuance, 'moonbeam');

    console.log(stakedReturn); // might or might not be right
  });
});
