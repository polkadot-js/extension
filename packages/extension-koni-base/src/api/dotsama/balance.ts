// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise } from '@polkadot/api';
import { DeriveBalancesAll } from '@polkadot/api-derive/types';
import { APIItemState, ApiProps, BalanceChildItem, BalanceItem, BalanceRPCResponse } from '@polkadot/extension-base/background/KoniTypes';
import { ethereumChains } from '@polkadot/extension-koni-base/api/dotsama/api-helper';
import { ACALA_REFRESH_BALANCE_INTERVAL } from '@polkadot/extension-koni-base/constants';
import { categoryAddresses, sumBN } from '@polkadot/extension-koni-base/utils/utils';
import { BN } from '@polkadot/util';

function subscribeWithDerive (addresses: string[], networkKey: string, networkAPI: ApiProps, callback: (networkKey: string, rs: BalanceItem) => void) {
  const freeMap: Record<string, BN> = {};
  const reservedMap: Record<string, BN> = {};
  const miscFrozenMap: Record<string, BN> = {};
  const feeFrozenMap: Record<string, BN> = {};

  const unsubProms = addresses.map((address) => {
    return networkAPI.api.derive.balances?.all(address, (balance: DeriveBalancesAll) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      freeMap[address] = balance.freeBalance?.toBn() || new BN(0);
      reservedMap[address] = balance.reservedBalance?.toBn() || new BN(0);
      miscFrozenMap[address] = balance.frozenMisc?.toBn() || new BN(0);
      feeFrozenMap[address] = balance.frozenFee?.toBn() || new BN(0);

      const balanceItem = {
        state: APIItemState.READY,
        free: sumBN(Object.values(freeMap)).toString(),
        reserved: sumBN(Object.values(reservedMap)).toString(),
        miscFrozen: sumBN(Object.values(miscFrozenMap)).toString(),
        feeFrozen: sumBN(Object.values(feeFrozenMap)).toString()
      } as BalanceItem;

      callback(networkKey, balanceItem);
    });
  });

  return async () => {
    const unsubs = await Promise.all(unsubProms);

    unsubs.forEach((unsub) => {
      unsub && unsub();
    });
  };
}

async function getTokenBalance (address: string, api: ApiPromise, option: any) {
  return await api.query.tokens.accounts(address, option);
}

function getBalanceChildItem (rawBalanceItems: any[], decimals: number): BalanceChildItem {
  const storeObj = {
    reserved: new BN(0),
    frozen: new BN(0),
    free: new BN(0)
  };

  rawBalanceItems.forEach((b) => {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    storeObj.free = storeObj.free.add(b?.free?.toBn() || new BN(0));
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    storeObj.frozen = storeObj.frozen.add(b?.frozen?.toBn() || new BN(0));
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    storeObj.reserved = storeObj.reserved.add(b?.reserved?.toBn() || new BN(0));
  });

  return ({
    reserved: storeObj.reserved.toString(),
    frozen: storeObj.frozen.toString(),
    free: storeObj.free.toString(),
    decimals
  });
}

function subcribleAcalaTokenBalanceInterval (addresses: string[], api: ApiPromise, originBalanceItem: BalanceItem, callback: (networkKey: string, rs: BalanceItem) => void): () => void {
  const getTokenBalances = () => {
    (async () => {
      const [dotBalances, ldotBalances, ausdBalances, lcdotBalances] = await Promise.all(['DOT', 'LDOT', 'AUSD', 'LCDOT'].map((token) => {
        if (token === 'LCDOT') {
          return Promise.all(addresses.map((address) => getTokenBalance(address, api, {
            LiquidCrowdloan: 13
          })));
        }

        return Promise.all(addresses.map((address) => getTokenBalance(address, api, { Token: token })));
      }));

      originBalanceItem.children = {
        DOT: getBalanceChildItem(dotBalances, 10),
        LDOT: getBalanceChildItem(ldotBalances, 10),
        AUSD: getBalanceChildItem(ausdBalances, 12),
        LCDOT: getBalanceChildItem(lcdotBalances, 10)
      };

      // eslint-disable-next-line node/no-callback-literal
      callback('acala', originBalanceItem);
    })().catch((e) => {
      console.log('There is problem when fetching Acaca token balance', e);
    });
  };

  getTokenBalances();
  const interval = setInterval(getTokenBalances, ACALA_REFRESH_BALANCE_INTERVAL);

  return () => {
    clearInterval(interval);
  };
}

function subcribleKaruraTokenBalanceInterval (addresses: string[], api: ApiPromise, originBalanceItem: BalanceItem, callback: (networkKey: string, rs: BalanceItem) => void): () => void {
  const getTokenBalances = () => {
    (async () => {
      const [
        kusdBalances,
        ksmBalances,
        lksmBalances,
        bncBalances,
        vsksmBalances,
        phaBalances,
        kintBalances,
        kbtcBalances,
        taiBalances
      ] = await Promise.all([
        'KUSD',
        'KSM',
        'LKSM',
        'BNC',
        'VSKSM',
        'PHA',
        'KINT',
        'KBTC',
        'TAI'
      ].map((token) => {
        return Promise.all(addresses.map((address) => getTokenBalance(address, api, { Token: token })));
      }));

      originBalanceItem.children = {
        KUSD: getBalanceChildItem(kusdBalances, 12),
        KSM: getBalanceChildItem(ksmBalances, 12),
        LKSM: getBalanceChildItem(lksmBalances, 12),
        BNC: getBalanceChildItem(bncBalances, 12),
        VSKSM: getBalanceChildItem(vsksmBalances, 12),
        PHA: getBalanceChildItem(phaBalances, 12),
        KINT: getBalanceChildItem(kintBalances, 12),
        KBTC: getBalanceChildItem(kbtcBalances, 8),
        TAI: getBalanceChildItem(taiBalances, 12)
      };

      // eslint-disable-next-line node/no-callback-literal
      callback('karura', originBalanceItem);
    })().catch((e) => {
      console.log('There is problem when fetching Karura token balance', e);
    });
  };

  getTokenBalances();
  const interval = setInterval(getTokenBalances, ACALA_REFRESH_BALANCE_INTERVAL);

  return () => {
    clearInterval(interval);
  };
}

function subscribeWithAccountMulti (addresses: string[], networkKey: string, networkAPI: ApiProps, callback: (networkKey: string, rs: BalanceItem) => void) {
  const balanceItem: BalanceItem = {
    state: APIItemState.PENDING,
    free: '0',
    reserved: '0',
    miscFrozen: '0',
    feeFrozen: '0',
    children: undefined
  };

  // @ts-ignore
  const unsub = networkAPI.api.query.system.account.multi(addresses, (balances: BalanceRPCResponse[]) => {
    let [free, reserved, miscFrozen, feeFrozen] = [new BN(0), new BN(0), new BN(0), new BN(0)];

    balances.forEach((balance: BalanceRPCResponse) => {
      free = free.add(balance.data?.free?.toBn() || new BN(0));
      reserved = reserved.add(balance.data?.reserved?.toBn() || new BN(0));
      miscFrozen = miscFrozen.add(balance.data?.miscFrozen?.toBn() || new BN(0));
      feeFrozen = feeFrozen.add(balance.data?.feeFrozen?.toBn() || new BN(0));
    });

    balanceItem.state = APIItemState.READY;
    balanceItem.free = free.toString();
    balanceItem.reserved = reserved.toString();
    balanceItem.miscFrozen = miscFrozen.toString();
    balanceItem.feeFrozen = feeFrozen.toString();

    callback(networkKey, balanceItem);
  });

  let unsub2: () => void;

  if (networkKey === 'acala') {
    unsub2 = subcribleAcalaTokenBalanceInterval(addresses, networkAPI.api, balanceItem, callback);
  } else if (networkKey === 'karura') {
    unsub2 = subcribleKaruraTokenBalanceInterval(addresses, networkAPI.api, balanceItem, callback);
  }

  return async () => {
    (await unsub)();
    unsub2 && unsub2();
  };
}

export function subscribeBalance (addresses: string[], dotSamaAPIMap: Record<string, ApiProps>, callback: (networkKey: string, rs: BalanceItem) => void) {
  const [substrateAddresses, evmAddresses] = categoryAddresses(addresses);

  return Object.entries(dotSamaAPIMap).map(async ([networkKey, apiProps]) => {
    const networkAPI = await apiProps.isReady;
    const useAddresses = ethereumChains.indexOf(networkKey) > -1 ? evmAddresses : substrateAddresses;

    if (!useAddresses || useAddresses.length === 0) {
      // Return zero balance if not have any address
      const zeroBalance = {
        state: APIItemState.READY,
        free: '0',
        reserved: '0',
        miscFrozen: '0',
        feeFrozen: '0'
      } as BalanceItem;

      callback(networkKey, zeroBalance);

      return undefined;
    }

    if (networkKey === 'kintsugi') {
      // eslint-disable-next-line @typescript-eslint/no-misused-promises
      return subscribeWithDerive(useAddresses, networkKey, networkAPI, callback);
    } else {
      return subscribeWithAccountMulti(useAddresses, networkKey, networkAPI, callback);
    }
  });
}
