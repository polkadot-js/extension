// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Observable } from 'rxjs';
import { Contract } from 'web3-eth-contract';

import { ApiPromise } from '@polkadot/api';
import { DeriveBalancesAll } from '@polkadot/api-derive/types';
import { APIItemState, ApiProps, BalanceChildItem, BalanceItem, TokenBalanceRaw, TokenInfo } from '@polkadot/extension-base/background/KoniTypes';
import { ethereumChains, moonbeamBaseChains } from '@polkadot/extension-koni-base/api/dotsama/api-helper';
import { getRegistry } from '@polkadot/extension-koni-base/api/dotsama/registry';
import { getERC20Contract } from '@polkadot/extension-koni-base/api/web3/web3';
import { dotSamaAPIMap } from '@polkadot/extension-koni-base/background/handlers';
import { MOONBEAM_REFRESH_BALANCE_INTERVAL } from '@polkadot/extension-koni-base/constants';
import { categoryAddresses, sumBN } from '@polkadot/extension-koni-base/utils/utils';
import { AccountInfo } from '@polkadot/types/interfaces';
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

function subscribeMoonbeamInterval (addresses: string[], networkKey: string, api: ApiPromise, originBalanceItem: BalanceItem, callback: (networkKey: string, rs: BalanceItem) => void): () => void {
  let tokenList = {} as TokenInfo[];
  const ERC20ContractMap = {} as Record<string, Contract>;
  const tokenBalanceMap = {} as Record<string, BalanceChildItem>;

  const getTokenBalances = () => {
    Object.values(tokenList).map(async ({ decimals, symbol }) => {
      let free = new BN(0);

      try {
        const contract = ERC20ContractMap[symbol];
        const bals = await Promise.all(addresses.map((address): Promise<string> => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          return contract.methods.balanceOf(address).call();
        }));

        free = sumBN(bals.map((bal) => new BN(bal || 0)));
        // console.log('TokenBals', symbol, addresses, bals, free);

        tokenBalanceMap[symbol] = {
          reserved: '0',
          frozen: '0',
          free: free.toString(),
          decimals
        };
      } catch (err) {
        console.log('There is problem when fetching ' + symbol + ' token balance', err);
      }
    });

    originBalanceItem.children = tokenBalanceMap;
    callback && callback(networkKey, originBalanceItem);
  };

  getRegistry(networkKey, api).then(({ tokenMap }) => {
    tokenList = Object.values(tokenMap).filter(({ erc20Address }) => (!!erc20Address));
    tokenList.forEach(({ erc20Address, symbol }) => {
      if (erc20Address) {
        ERC20ContractMap[symbol] = getERC20Contract(networkKey, erc20Address);
      }
    });
    getTokenBalances();
  }).catch(console.error);

  const interval = setInterval(getTokenBalances, MOONBEAM_REFRESH_BALANCE_INTERVAL);

  return () => {
    clearInterval(interval);
  };
}

function subscribeTokensBalance (addresses: string[], networkKey: string, api: ApiPromise, originBalanceItem: BalanceItem, callback: (rs: BalanceItem) => void) {
  let forceStop = false;

  let unsubAll = () => {
    forceStop = true;
  };

  originBalanceItem.children = originBalanceItem.children || {};

  getRegistry(networkKey, api)
    .then(({ tokenMap }) => {
      if (forceStop) {
        return;
      }

      const subTokenList = Object.values(tokenMap).filter((t) => !t.isMainToken);

      if (subTokenList.length > 0) {
        console.log('Get tokens balance of', networkKey, subTokenList);
      }

      const unsubList = subTokenList.map(({ decimals, specialOption, symbol }) => {
        const observable = new Observable<BalanceChildItem>((subscriber) => {
          // Get Token Balance
          // @ts-ignore
          const apiCall = api.query.tokens.accounts.multi(addresses.map((address) => [address, options]), (balances: TokenBalanceRaw[]) => {
            const tokenBalance = {
              reserved: sumBN(balances.map((b) => (b.reserved || new BN(0)))).toString(),
              frozen: sumBN(balances.map((b) => (b.frozen || new BN(0)))).toString(),
              free: sumBN(balances.map((b) => (b.free || new BN(0)))).toString(),
              decimals
            };

            subscriber.next(tokenBalance);
          });
        });
        const options = specialOption || { Token: symbol };

        return observable.subscribe({
          next: (childBalance) => {
            // @ts-ignore
            originBalanceItem.children[symbol] = childBalance;
            callback(originBalanceItem);
          }
        });
      });

      unsubAll = () => {
        unsubList.forEach((unsub) => {
          unsub && unsub.unsubscribe();
        });
      };
    })
    .catch(console.error);

  return unsubAll;
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
  const unsub = networkAPI.api.query.system.account.multi(addresses, (balances: AccountInfo[]) => {
    let [free, reserved, miscFrozen, feeFrozen] = [new BN(0), new BN(0), new BN(0), new BN(0)];

    balances.forEach((balance: AccountInfo) => {
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

  if (['bifrost', 'acala', 'karura', 'interlay'].indexOf(networkKey) > -1) {
    unsub2 = subscribeTokensBalance(addresses, networkKey, networkAPI.api, balanceItem, (balanceItem) => {
      callback(networkKey, balanceItem);
    });
  } else if (moonbeamBaseChains.indexOf(networkKey) > -1) {
    unsub2 = subscribeMoonbeamInterval(addresses, networkKey, networkAPI.api, balanceItem, callback);
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

export async function getFreeBalance (networkKey: string, address: string) {
  const apiProps = await dotSamaAPIMap[networkKey].isReady;
  const api = apiProps.api;

  if (networkKey === 'kintsugi') {
    const balance = await api.derive.balances?.all(address) as DeriveBalancesAll;

    return balance.freeBalance?.toString() || '0';
  } else {
    const balance = await api.query.system.account(address) as AccountInfo;

    return balance.data?.free?.toString() || '0';
  }
}
