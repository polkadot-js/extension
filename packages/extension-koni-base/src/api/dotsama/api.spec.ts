// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise } from '@polkadot/api';
import { DeriveBalancesAll } from '@polkadot/api-derive/types';
import { APIItemState, BalanceItem } from '@polkadot/extension-base/background/KoniTypes';
import { initApi } from '@polkadot/extension-koni-base/api/dotsama/api';
import NETWORKS from '@polkadot/extension-koni-base/api/endpoints';
import { sumBN } from '@polkadot/extension-koni-base/utils/utils';
import { AccountInfo } from '@polkadot/types/interfaces';
import { BN } from '@polkadot/util';

jest.setTimeout(50000);
describe('test DotSama APIs', () => {
  let api: ApiPromise;

  beforeAll(async () => {
    const koniProp = await initApi(NETWORKS.kintsugi.provider).isReady;

    api = koniProp.api;
  });

  afterAll(async () => {
    await api.disconnect();
  });

  it('test get Balances', async () => {
    const balances = await api.query.system.account.multi(['5HBHLZ4xs3UPf3fMqVTp9XJnHHmTHdXP7QbRxdzmX8Pu7ogn']);

    balances.forEach((rs) => {
      // @ts-ignore
      const balanceInfo = rs as AccountInfo;

      console.log(balanceInfo.data.free.toNumber());
      expect(balanceInfo.data.free.toNumber()).toBeGreaterThanOrEqual(0);
    });
  });

  it('test get Balances 2', async () => {
    const freeMap: Record<string, BN> = {};
    const reservedMap: Record<string, BN> = {};
    const miscFrozenMap: Record<string, BN> = {};
    const feeFrozenMap: Record<string, BN> = {};

    const unsubProms = ['5HBHLZ4xs3UPf3fMqVTp9XJnHHmTHdXP7QbRxdzmX8Pu7ogn'].map((address) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      return api.derive.balances?.all(address, (balance: DeriveBalancesAll) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        freeMap[address] = balance.freeBalance.toBn() || new BN(0);
        reservedMap[address] = balance.reservedBalance.toBn() || new BN(0);
        miscFrozenMap[address] = balance.frozenMisc.toBn() || new BN(0);
        feeFrozenMap[address] = balance.frozenFee.toBn() || new BN(0);

        const balanceItem = {
          state: APIItemState.READY,
          free: sumBN(Object.values(freeMap)).toString(),
          reserved: sumBN(Object.values(reservedMap)).toString(),
          miscFrozen: sumBN(Object.values(miscFrozenMap)).toString(),
          feeFrozen: sumBN(Object.values(feeFrozenMap)).toString()
        } as BalanceItem;

        console.log('balanceItem', balanceItem);
      });
    });

    const rx = await Promise.all(unsubProms);

    console.log(rx);
  });
});
