// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import {getCurrentProvider} from "@subwallet/extension-koni-base/utils/utils";
import {PREDEFINED_NETWORKS} from "@subwallet/extension-koni-base/api/predefinedNetworks";
import {ApiPromise, WsProvider} from "@polkadot/api";
import {DOTSAMA_AUTO_CONNECT_MS} from "@subwallet/extension-koni-base/constants";

interface ValidatorInfo {
  era: number,
  address: string
}

interface ValidatorInfo {
  address: string;
  totalStake: number;
  ownStake: number;
  nominatorCount: number;
  commission: string;
  expectedReturn: number;
}

jest.setTimeout(50000);

describe('test DotSama APIs', () => {
  test('test get Balances', async () => {
    const provider = new WsProvider(getCurrentProvider(PREDEFINED_NETWORKS.polkadot), DOTSAMA_AUTO_CONNECT_MS);
    const api = new ApiPromise({provider});
    const apiProps = await api.isReady;

    const era = await apiProps.query.staking.currentEra();
    const parsedEra = era.toString();

    console.log('era', parsedEra);

    const result: ValidatorInfo[] = [];

    const eraStakers = await apiProps.query.staking.erasStakers.entries(parseInt(parsedEra)) as any[];

    for (const item of eraStakers) {
      const rawValidatorInfo = item[0].toHuman() as any[];
      const validatorAddress = rawValidatorInfo[1] as string;
      console.log();
      console.log(item[1].toHuman());
    }

    console.log('eraStakers', eraStakers);
  });
});
