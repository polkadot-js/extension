// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ValidatorInfo } from '@subwallet/extension-base/background/KoniTypes';
import { parseRawNumber } from '@subwallet/extension-koni-base/api/bonding/utils';
import { PREDEFINED_NETWORKS } from '@subwallet/extension-koni-base/api/predefinedNetworks';
import { DOTSAMA_AUTO_CONNECT_MS } from '@subwallet/extension-koni-base/constants';
import { getCurrentProvider, isUrl } from '@subwallet/extension-koni-base/utils/utils';
import fetch from 'cross-fetch';

import { ApiPromise, WsProvider } from '@polkadot/api';
import {BN} from "@polkadot/util";

jest.setTimeout(5000000);

describe('test DotSama APIs', () => {
  test('test get Validator', async () => {
    const provider = new WsProvider(getCurrentProvider(PREDEFINED_NETWORKS.shibuya), DOTSAMA_AUTO_CONNECT_MS);
    const api = new ApiPromise({ provider });
    const apiPromise = await api.isReady;
    const address = 'b6dCDjD46DHpikSDoAPt8Hw1r1SZfbwpi2AkX8z3xunvD4A';
    const decimals = 18;

    const rawMaxStakerPerContract = (apiPromise.consts.dappsStaking.maxNumberOfStakersPerContract).toHuman() as string;
    const rawMinStake = (apiPromise.consts.dappsStaking.minimumStakingAmount).toHuman() as string;

    const result: ValidatorInfo[] = [];
    const minStake = parseRawNumber(rawMinStake);
    const maxStakerPerContract = parseRawNumber(rawMaxStakerPerContract);

    console.log(maxStakerPerContract);
    const allDappsReq = new Promise(function (resolve) {
      fetch('https://api.astar.network/api/v1/shibuya/dapps-staking/dapps', {
        method: 'GET'
      }).then((resp) => {
        resolve(resp.json());
      }).catch(console.error);
    });

    const [_stakedDapps, _era, _allDapps] = await Promise.all([
      apiPromise.query.dappsStaking.generalStakerInfo.entries(address),
      apiPromise.query.dappsStaking.currentEra(),
      allDappsReq
    ]);

    const stakedDappsList: string[] = [];

    for (const item of _stakedDapps) {
      const data = item[0].toHuman() as any[];
      const stakedDapp = data[1] as Record<string, string>;

      stakedDappsList.push(stakedDapp.Evm);
    }

    const era = parseRawNumber(_era.toHuman() as string);
    const allDapps = _allDapps as Record<string, any>[];

    await Promise.all(allDapps.map(async (dapp) => {
      const dappName = dapp.name as string;
      const dappAddress = dapp.address as string;
      const dappIcon = isUrl(dapp.iconUrl as string) ? dapp.iconUrl as string : undefined;
      const _contractInfo = await apiPromise.query.dappsStaking.contractEraStake({ Evm: dappAddress }, era);
      const contractInfo = _contractInfo.toHuman() as Record<string, any>;
      const totalStake = parseRawNumber(contractInfo.total as string);
      const stakerCount = parseRawNumber(contractInfo.numberOfStakers as string);

      result.push({
        address: dappAddress,
        totalStake,
        ownStake: 0,
        otherStake: totalStake,
        nominatorCount: stakerCount,
        // to be added later
        commission: 0,
        expectedReturn: 0,
        blocked: false,
        isVerified: false,
        minBond: (minStake / 10 ** decimals),
        isNominated: stakedDappsList.includes(address),
        icon: dappIcon,
        identity: dappName
      });
    }));

    console.log(result);
  });

  test('test get APR', async () => {
    const resp = await fetch('https://api.astar.network/api/v1/shibuya/dapps-staking/apr', {
      method: 'GET'
    }).then((resp) => resp.json()) as number;

    console.log(resp);
  });

  test('test get bonding extrinsic', async () => {
    const provider = new WsProvider(getCurrentProvider(PREDEFINED_NETWORKS.shibuya), DOTSAMA_AUTO_CONNECT_MS);
    const api = new ApiPromise({ provider });
    const apiPromise = await api.isReady;
    const dappAddress = '0x1CeE94a11eAf390B67Aa346E9Dda3019DfaD4f6A';
    const address = 'b6dCDjD46DHpikSDoAPt8Hw1r1SZfbwpi2AkX8z3xunvD4A';

    const extrinsic = apiPromise.tx.dappsStaking.bondAndStake({Evm: dappAddress}, new BN(1));
    console.log(extrinsic.paymentInfo(address));
  });
});
