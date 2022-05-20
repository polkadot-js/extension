// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { assetFromToken } from '@equilab/api';
import { SignedBalance } from '@equilab/api/genshiro/interfaces';
import { APIItemState, ApiProps, BalanceChildItem, BalanceItem, TokenBalanceRaw, TokenInfo } from '@subwallet/extension-base/background/KoniTypes';
import { moonbeamBaseChains } from '@subwallet/extension-koni-base/api/dotsama/api-helper';
import { getRegistry, getTokenInfo } from '@subwallet/extension-koni-base/api/dotsama/registry';
import { getEVMBalance } from '@subwallet/extension-koni-base/api/web3/balance';
import { getERC20Contract } from '@subwallet/extension-koni-base/api/web3/web3';
import { state } from '@subwallet/extension-koni-base/background/handlers';
import { ASTAR_REFRESH_BALANCE_INTERVAL, IGNORE_GET_SUBSTRATE_FEATURES_LIST, MOONBEAM_REFRESH_BALANCE_INTERVAL } from '@subwallet/extension-koni-base/constants';
import { categoryAddresses, sumBN } from '@subwallet/extension-koni-base/utils/utils';
import { Observable } from 'rxjs';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';

import { ApiPromise } from '@polkadot/api';
import { DeriveBalancesAll } from '@polkadot/api-derive/types';
import { AccountInfo } from '@polkadot/types/interfaces';
import { BN } from '@polkadot/util';
import { isEthereumAddress } from '@polkadot/util-crypto';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
// @ts-ignore
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

function subscribeERC20Interval (addresses: string[], networkKey: string, api: ApiPromise, originBalanceItem: BalanceItem, web3ApiMap: Record<string, Web3>, callback: (networkKey: string, rs: BalanceItem) => void): () => void {
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

  getRegistry(networkKey, api, state.getErc20Tokens()).then(({ tokenMap }) => {
    tokenList = Object.values(tokenMap).filter(({ erc20Address }) => (!!erc20Address));
    tokenList.forEach(({ erc20Address, symbol }) => {
      if (erc20Address) {
        ERC20ContractMap[symbol] = getERC20Contract(networkKey, erc20Address, web3ApiMap);
      }
    });
    getTokenBalances();
  }).catch(console.error);

  const interval = setInterval(getTokenBalances, MOONBEAM_REFRESH_BALANCE_INTERVAL);

  return () => {
    clearInterval(interval);
  };
}

async function subscribeGenshiroTokenBalance (addresses: string[], networkKey: string, api: ApiPromise, originBalanceItem: BalanceItem, callback: (rs: BalanceItem) => void, includeMainToken?: boolean): Promise<() => void> {
  originBalanceItem.children = originBalanceItem.children || {};

  const { tokenMap } = await getRegistry(networkKey, api);

  let tokenList = Object.values(tokenMap);

  if (!includeMainToken) {
    tokenList = tokenList.filter((t) => !t.isMainToken);
  }

  if (tokenList.length > 0) {
    console.log('Get tokens balance of', networkKey, tokenList);
  }

  const unsubList = tokenList.map(({ decimals, symbol }) => {
    const asset = networkKey === 'equilibrium_parachain' ? assetFromToken(symbol)[0] : assetFromToken(symbol);
    const observable = new Observable<BalanceChildItem>((subscriber) => {
      // Get Token Balance
      // @ts-ignore
      const apiCall = api.query.eqBalances.account.multi(addresses.map((address) => [address, asset]), (balances: SignedBalance[]) => {
        const tokenBalance = {
          reserved: '0',
          frozen: '0',
          free: sumBN(balances.map((b) => (b.asPositive))).toString(),
          decimals
        };

        subscriber.next(tokenBalance);
      });
    });

    return observable.subscribe({
      next: (childBalance) => {
        if (includeMainToken && tokenMap[symbol].isMainToken) {
          originBalanceItem.state = APIItemState.READY;
          originBalanceItem.free = childBalance.free;
        } else {
          // @ts-ignore
          originBalanceItem.children[symbol] = childBalance;
        }

        callback(originBalanceItem);
      }
    });
  });

  return () => {
    unsubList.forEach((unsub) => {
      unsub && unsub.unsubscribe();
    });
  };
}

async function subscribeTokensBalance (addresses: string[], networkKey: string, api: ApiPromise, originBalanceItem: BalanceItem, callback: (rs: BalanceItem) => void, includeMainToken?: boolean) {
  originBalanceItem.children = originBalanceItem.children || {};

  const { tokenMap } = await getRegistry(networkKey, api);
  let tokenList = Object.values(tokenMap);

  if (!includeMainToken) {
    tokenList = tokenList.filter((t) => !t.isMainToken);
  }

  if (tokenList.length > 0) {
    console.log('Get tokens balance of', networkKey, tokenList);
  }

  const unsubList = tokenList.map(({ decimals, specialOption, symbol }) => {
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
        if (includeMainToken && tokenMap[symbol].isMainToken) {
          originBalanceItem.state = APIItemState.READY;
          originBalanceItem.free = childBalance.free;
          originBalanceItem.reserved = childBalance.reserved;
          originBalanceItem.feeFrozen = childBalance.frozen;
        } else {
          // @ts-ignore
          originBalanceItem.children[symbol] = childBalance;
        }

        callback(originBalanceItem);
      }
    });
  });

  return () => {
    unsubList.forEach((unsub) => {
      unsub && unsub.unsubscribe();
    });
  };
}

async function subscribeAssetsBalance (addresses: string[], networkKey: string, api: ApiPromise, originBalanceItem: BalanceItem, callback: (rs: BalanceItem) => void) {
  originBalanceItem.children = originBalanceItem.children || {};
  const { tokenMap } = await getRegistry(networkKey, api);
  let tokenList = Object.values(tokenMap);

  tokenList = tokenList.filter((t) => !t.isMainToken && t.assetIndex);

  if (tokenList.length > 0) {
    console.log('Get tokens assets of', networkKey, tokenList);
  }

  const unsubList = tokenList.map(({ assetIndex, decimals, symbol }) => {
    const observable = new Observable<BalanceChildItem>((subscriber) => {
      // Get Token Balance
      // @ts-ignore
      const apiCall = api.query.assets.account.multi(addresses.map((address) => [assetIndex, address]), (balances) => {
        let free = new BN(0);
        let frozen = new BN(0);

        balances.forEach((b) => {
          // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
          const bdata = b?.toJSON();

          if (bdata) {
            // @ts-ignore
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
            const addressBalance = new BN(String(bdata?.balance) || '0');

            // @ts-ignore
            if (bdata?.isFrozen) {
              frozen = frozen.add(addressBalance);
            } else {
              free = free.add(addressBalance);
            }
          }
        });

        const tokenBalance = {
          reserved: '0',
          frozen: frozen.toString(),
          free: free.toString(),
          decimals
        };

        subscriber.next(tokenBalance);
      });
    });

    return observable.subscribe({
      next: (childBalance) => {
        // @ts-ignore
        originBalanceItem.children[symbol] = childBalance;

        callback(originBalanceItem);
      }
    });
  });

  return () => {
    unsubList.forEach((unsub) => {
      unsub && unsub.unsubscribe();
    });
  };
}

async function subscribeWithAccountMulti (addresses: string[], networkKey: string, networkAPI: ApiProps, web3ApiMap: Record<string, Web3>, callback: (networkKey: string, rs: BalanceItem) => void) {
  const balanceItem: BalanceItem = {
    state: APIItemState.PENDING,
    free: '0',
    reserved: '0',
    miscFrozen: '0',
    feeFrozen: '0',
    children: undefined
  };

  // @ts-ignore
  let unsub;

  if (!['kintsugi', 'interlay', 'kintsugi_test', 'genshiro_testnet', 'genshiro', 'equilibrium_parachain'].includes(networkKey)) {
    unsub = await networkAPI.api.query.system.account.multi(addresses, (balances: AccountInfo[]) => {
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
  }

  let unsub2: () => void;

  if (['bifrost', 'acala', 'karura', 'acala_testnet'].includes(networkKey)) {
    unsub2 = await subscribeTokensBalance(addresses, networkKey, networkAPI.api, balanceItem, (balanceItem) => {
      callback(networkKey, balanceItem);
    });
  } else if (['kintsugi', 'interlay', 'kintsugi_test'].includes(networkKey)) {
    unsub2 = await subscribeTokensBalance(addresses, networkKey, networkAPI.api, balanceItem, (balanceItem) => {
      callback(networkKey, balanceItem);
    }, true);
  } else if (['statemine'].indexOf(networkKey) > -1) {
    unsub2 = await subscribeAssetsBalance(addresses, networkKey, networkAPI.api, balanceItem, (balanceItem) => {
      callback(networkKey, balanceItem);
    });
  } else if (moonbeamBaseChains.indexOf(networkKey) > -1) {
    unsub2 = subscribeERC20Interval(addresses, networkKey, networkAPI.api, balanceItem, web3ApiMap, callback);
  } else if (['genshiro_testnet', 'genshiro', 'equilibrium_parachain'].includes(networkKey)) {
    unsub2 = await subscribeGenshiroTokenBalance(addresses, networkKey, networkAPI.api, balanceItem, (balanceItem) => {
      callback(networkKey, balanceItem);
    }, true);
  }

  return () => {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    unsub && unsub();
    unsub2 && unsub2();
  };
}

export function subscribeEVMBalance (networkKey: string, api: ApiPromise, addresses: string[], web3ApiMap: Record<string, Web3>, callback: (networkKey: string, rs: BalanceItem) => void) {
  const balanceItem = {
    state: APIItemState.PENDING,
    free: '0',
    reserved: '0',
    miscFrozen: '0',
    feeFrozen: '0'
  } as BalanceItem;

  function getBalance () {
    getEVMBalance(networkKey, addresses, web3ApiMap)
      .then((balances) => {
        balanceItem.free = sumBN(balances.map((b) => (new BN(b || '0')))).toString();
        balanceItem.state = APIItemState.READY;
        callback(networkKey, balanceItem);
      })
      .catch(console.error);
  }

  getBalance();
  const interval = setInterval(getBalance, ASTAR_REFRESH_BALANCE_INTERVAL);
  const unsub2 = subscribeERC20Interval(addresses, networkKey, api, balanceItem, web3ApiMap, callback);

  return () => {
    clearInterval(interval);
    unsub2 && unsub2();
  };
}

export function subscribeBalance (addresses: string[], dotSamaAPIMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, callback: (networkKey: string, rs: BalanceItem) => void) {
  const [substrateAddresses, evmAddresses] = categoryAddresses(addresses);

  return Object.entries(dotSamaAPIMap).map(async ([networkKey, apiProps]) => {
    const networkAPI = await apiProps.isReady;
    const useAddresses = apiProps.isEthereum ? evmAddresses : substrateAddresses;

    if (networkKey === 'astarEvm' || networkKey === 'shidenEvm') {
      return subscribeEVMBalance(networkKey, networkAPI.api, useAddresses, web3ApiMap, callback);
    }

    if (!useAddresses || useAddresses.length === 0 || IGNORE_GET_SUBSTRATE_FEATURES_LIST.indexOf(networkKey) > -1) {
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

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    return subscribeWithAccountMulti(useAddresses, networkKey, networkAPI, web3ApiMap, callback);
  });
}

export async function getFreeBalance (networkKey: string, address: string, dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, token?: string): Promise<string> {
  const apiProps = await dotSamaApiMap[networkKey].isReady;
  const api = apiProps.api;

  if (token) {
    const tokenInfo = await getTokenInfo(networkKey, api, token);
    const isMainToken = !!(tokenInfo?.isMainToken);

    if (apiProps.isEthereum && tokenInfo?.erc20Address) {
      if (!isMainToken) {
        const contract = getERC20Contract(networkKey, tokenInfo.erc20Address, web3ApiMap);
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        const free = await contract.methods.balanceOf(address).call();

        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
        return free?.toString() || '0';
      }
    } else {
      if (['genshiro_testnet', 'genshiro', 'equilibrium_parachain'].includes(networkKey)) {
        const asset = networkKey === 'equilibrium_parachain' ? assetFromToken(token)[0] : assetFromToken(token);
        const balance = await api.query.eqBalances.account(address, asset);

        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return
        return balance.asPositive?.toString() || '0';
      } else if (!isMainToken || ['kintsugi', 'kintsugi_test', 'interlay'].includes(networkKey)) {
        // @ts-ignore
        const balance = await api.query.tokens.accounts(address, tokenInfo?.specialOption || { Token: token }) as TokenBalanceRaw;

        return balance.free?.toString() || '0';
      }
    }
  }

  const balance = await api.query.system.account(address) as AccountInfo;

  return balance.data?.free?.toString() || '0';
}

export async function subscribeFreeBalance (
  networkKey: string,
  address: string,
  dotSamaApiMap: Record<string, ApiProps>,
  web3ApiMap: Record<string, Web3>,
  token: string | undefined,
  update: (balance: string) => void): Promise<() => void> {
  const apiProps = await dotSamaApiMap[networkKey].isReady;
  const api = apiProps.api;

  if (apiProps.isEthereum) {
    if (!isEthereumAddress(address)) {
      update('0');

      return () => undefined;
    }
  } else {
    if (isEthereumAddress(address)) {
      update('0');

      return () => undefined;
    }
  }

  if (token) {
    const tokenInfo = await getTokenInfo(networkKey, api, token);
    const isMainToken = !!(tokenInfo?.isMainToken);

    if (apiProps.isEthereum && tokenInfo?.erc20Address) {
      if (!isMainToken) {
        const getFreeBalance = () => {
          if (!tokenInfo?.erc20Address) {
            return;
          }

          const contract = getERC20Contract(networkKey, tokenInfo.erc20Address, web3ApiMap);

          // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          contract.methods.balanceOf(address).call().then((free) => {
            // eslint-disable-next-line node/no-callback-literal,@typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
            update(free?.toString() || '0');
          });
        };

        getFreeBalance();
        const interval = setInterval(getFreeBalance, MOONBEAM_REFRESH_BALANCE_INTERVAL);

        return () => {
          clearInterval(interval);
        };
      }
    } else {
      if (['genshiro_testnet', 'genshiro', 'equilibrium_parachain'].includes(networkKey)) {
        const asset = networkKey === 'equilibrium_parachain' ? assetFromToken(token)[0] : assetFromToken(token);
        // @ts-ignore
        const unsub = await api.query.eqBalances.account(address, asset, (balance) => {
          // eslint-disable-next-line node/no-callback-literal,@typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          update(balance.asPositive.toString() || '0');
        });

        return () => {
          // @ts-ignore
          unsub && unsub();
        };
      } else if (!isMainToken || ['kintsugi', 'kintsugi_test', 'interlay'].includes(networkKey)) {
        // @ts-ignore
        const unsub = await api.query.tokens.accounts(address, tokenInfo?.specialOption || { Token: token }, (balance) => {
          // eslint-disable-next-line node/no-callback-literal,@typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          update(balance.free?.toString() || '0');
        });

        return () => {
          // @ts-ignore
          unsub && unsub();
        };
      }
    }
  }

  // @ts-ignore
  const unsub = await api.query.system.account(address, (balance) => {
    // eslint-disable-next-line node/no-callback-literal,@typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    update(balance.data?.free?.toString() || '0');
  });

  return () => {
    // @ts-ignore
    unsub && unsub();
  };
}
