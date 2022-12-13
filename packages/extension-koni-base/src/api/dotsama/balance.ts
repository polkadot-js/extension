// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { assetFromToken } from '@equilab/api';
import { SignedBalance } from '@equilab/api/genshiro/interfaces';
import { APIItemState, ApiProps, BalanceChildItem, BalanceItem, TokenBalanceRaw, TokenInfo } from '@subwallet/extension-base/background/KoniTypes';
import { moonbeamBaseChains } from '@subwallet/extension-koni-base/api/dotsama/api-helper';
import { getRegistry, getTokenInfo } from '@subwallet/extension-koni-base/api/dotsama/registry';
import { getEVMBalance } from '@subwallet/extension-koni-base/api/tokens/evm/balance';
import { getERC20Contract } from '@subwallet/extension-koni-base/api/tokens/evm/web3';
import { getPSP22ContractPromise } from '@subwallet/extension-koni-base/api/tokens/wasm';
import { state } from '@subwallet/extension-koni-base/background/handlers';
import { ASTAR_REFRESH_BALANCE_INTERVAL, IGNORE_GET_SUBSTRATE_FEATURES_LIST, SUB_TOKEN_REFRESH_BALANCE_INTERVAL, SUBSCRIBE_BALANCE_FAST_INTERVAL } from '@subwallet/extension-koni-base/constants';
import { categoryAddresses, sumBN } from '@subwallet/extension-koni-base/utils';
import Web3 from 'web3';
import { Contract } from 'web3-eth-contract';

import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { DeriveBalancesAll } from '@polkadot/api-derive/types';
import { AccountInfo, Balance } from '@polkadot/types/interfaces';
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

  return () => {
    Promise.all(unsubProms).then((unsubs) => {
      unsubs.forEach((unsub) => {
        unsub && unsub();
      });
    }).catch(console.error);
  };
}

function subscribeERC20Interval (addresses: string[], networkKey: string, api: ApiPromise, web3ApiMap: Record<string, Web3>, subCallback: (rs: Record<string, BalanceChildItem>) => void): () => void {
  let tokenList = {} as TokenInfo[];
  const ERC20ContractMap = {} as Record<string, Contract>;

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

        subCallback({
          [symbol]: {
            reserved: '0',
            frozen: '0',
            free: free.toString(),
            decimals
          }
        });
      } catch (err) {
        console.log('There is problem when fetching ' + symbol + ' token balance', err);
      }
    });
  };

  getRegistry(networkKey, api, state.getActiveErc20Tokens())
    .then(({ tokenMap }) => {
      tokenList = Object.values(tokenMap).filter(({ contractAddress }) => (!!contractAddress));
      tokenList.forEach(({ contractAddress, symbol }) => {
        if (contractAddress) {
          ERC20ContractMap[symbol] = getERC20Contract(networkKey, contractAddress, web3ApiMap);
        }
      });
      getTokenBalances();
    }).catch(console.warn);

  const interval = setInterval(getTokenBalances, SUB_TOKEN_REFRESH_BALANCE_INTERVAL);

  return () => {
    clearInterval(interval);
  };
}

function subscribePSP22Balance (addresses: string[], networkKey: string, api: ApiPromise, subCallback: (rs: Record<string, BalanceChildItem>) => void) {
  let tokenList = [] as TokenInfo[];
  const PSP22ContractMap = {} as Record<string, ContractPromise>;

  const getTokenBalances = () => {
    tokenList.map(async ({ decimals, symbol }) => {
      let free = new BN(0);

      try {
        const contract = PSP22ContractMap[symbol];
        const balances = await Promise.all(addresses.map(async (address): Promise<string> => {
          const _balanceOf = await contract.query['psp22::balanceOf'](address, { gasLimit: -1 }, address);

          return _balanceOf.output ? _balanceOf.output.toString() : '0';
        }));

        free = sumBN(balances.map((bal) => new BN(bal || 0)));

        subCallback({
          [symbol]: {
            reserved: '0',
            frozen: '0',
            free: free.toString(),
            decimals
          }
        });
      } catch (err) {
        console.log('There is problem when fetching ' + symbol + ' PSP-22 token balance', err);
      }
    });
  };

  getRegistry(networkKey, api)
    .then(({ tokenMap }) => {
      tokenList = Object.values(tokenMap).filter(({ contractAddress, isMainToken }) => (!!contractAddress && !isMainToken));
      tokenList.forEach(({ contractAddress, symbol }) => {
        if (contractAddress) {
          PSP22ContractMap[symbol] = getPSP22ContractPromise(api, contractAddress);
        }
      });
      getTokenBalances();
    })
    .catch(console.warn);

  const interval = setInterval(getTokenBalances, SUB_TOKEN_REFRESH_BALANCE_INTERVAL);

  return () => {
    clearInterval(interval);
  };
}

async function subscribeGenshiroTokenBalance (addresses: string[], networkKey: string, api: ApiPromise, mainCallback: (rs: BalanceItem) => void,
  subCallback: (rs: Record<string, BalanceChildItem>) => void, includeMainToken?: boolean): Promise<() => void> {
  const { tokenMap } = await getRegistry(networkKey, api);

  let tokenList = Object.values(tokenMap);

  if (!includeMainToken) {
    tokenList = tokenList.filter((t) => !t.isMainToken);
  }

  if (tokenList.length > 0) {
    console.log('Get tokens balance of', networkKey, tokenList);
  }

  const unsubList = tokenList.map(async ({ decimals, symbol }) => {
    try {
      const asset = networkKey === 'equilibrium_parachain' ? assetFromToken(symbol)[0] : assetFromToken(symbol);
      // Get Token Balance
      // @ts-ignore
      const unsub = await api.query.eqBalances.account.multi(addresses.map((address) => [address, asset]), (balances: SignedBalance[]) => {
        const tokenBalance = {
          reserved: '0',
          frozen: '0',
          free: sumBN(balances.map((b) => (b.asPositive))).toString(),
          decimals
        };

        if (includeMainToken && tokenMap[symbol].isMainToken) {
          mainCallback({
            state: APIItemState.READY,
            free: tokenBalance.free
          });
        } else {
          subCallback({ [symbol]: tokenBalance });
        }
      });

      return unsub;
    } catch (err) {
      console.warn(err);

      return undefined;
    }
  });

  return () => {
    unsubList.forEach((subProm) => {
      subProm.then((unsub) => {
        unsub && unsub();
      }).catch(console.error);
    });
  };
}

async function subscribeTokensBalance (addresses: string[], networkKey: string, api: ApiPromise, mainCallback: (rs: BalanceItem) => void,
  subCallback: (rs: Record<string, BalanceChildItem>) => void, includeMainToken?: boolean) {
  const { tokenMap } = await getRegistry(networkKey, api);
  let tokenList = Object.values(tokenMap);

  if (!includeMainToken) {
    tokenList = tokenList.filter((t) => !t.isMainToken);
  }

  if (tokenList.length > 0) {
    console.log('Get tokens balance of', networkKey, tokenList);
  }

  const unsubList = await Promise.all(tokenList.map(async ({ decimals, specialOption, symbol }) => {
    try {
      const options = specialOption || { Token: symbol.toUpperCase() };
      // Get Token Balance
      // @ts-ignore
      const unsub = await api.query.tokens.accounts.multi(addresses.map((address) => [address, options]), (balances: TokenBalanceRaw[]) => {
        const tokenBalance = {
          reserved: sumBN(balances.map((b) => (b.reserved || new BN(0)))).toString(),
          frozen: sumBN(balances.map((b) => (b.frozen || new BN(0)))).toString(),
          free: sumBN(balances.map((b) => (b.free || new BN(0)))).toString(),
          decimals
        };

        if (includeMainToken && tokenMap[symbol].isMainToken) {
          mainCallback({
            state: APIItemState.READY,
            free: tokenBalance.free,
            reserved: tokenBalance.reserved,
            feeFrozen: tokenBalance.frozen
          });
        } else {
        // @ts-ignore
          subCallback({ [symbol]: tokenBalance });
        }
      });

      return unsub;
    } catch (err) {
      console.warn(err);
    }

    return undefined;
  }));

  return () => {
    unsubList.forEach((unsub) => {
      unsub && unsub();
    });
  };
}

async function subscribeAssetsBalance (addresses: string[], networkKey: string, api: ApiPromise, subCallback: (rs: Record<string, BalanceChildItem>) => void) {
  const { tokenMap } = await getRegistry(networkKey, api);
  let tokenList = Object.values(tokenMap);

  tokenList = tokenList.filter((t) => !t.isMainToken && t.assetIndex);

  if (tokenList.length > 0) {
    console.log('Get tokens assets of', networkKey, tokenList);
  }

  const unsubList = await Promise.all(tokenList.map(async ({ assetIndex, decimals, symbol }) => {
    try {
    // Get Token Balance
      const unsub = await api.query.assets.account.multi(addresses.map((address) => [assetIndex, address]), (balances) => {
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

        subCallback({ [symbol]: tokenBalance });
      });

      return unsub;
    } catch (err) {
      console.warn(err);
    }

    return undefined;
  }));

  return () => {
    unsubList.forEach((unsub) => {
      unsub && unsub();
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

  if (!['kintsugi', 'interlay', 'kintsugi_test', 'genshiro_testnet', 'genshiro', 'equilibrium_parachain', 'crab', 'pangolin'].includes(networkKey)) {
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

  if (['crab', 'pangolin'].includes(networkKey)) {
    const { chainDecimals, chainTokens } = await getRegistry(networkKey, networkAPI.api);

    let totalBalance: BN = new BN(0);
    let freeBalance: BN = new BN(0);
    let miscFrozen: BN = new BN(0);
    let reservedKtonBalance: BN = new BN(0);
    let freeKtonBalance: BN = new BN(0);

    const unsubProms = addresses.map((address) => {
      return networkAPI.api.derive.balances?.all(address, async (balance: DeriveBalancesAll) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        freeBalance = freeBalance.add(balance.availableBalance?.toBn() || new BN(0));
        miscFrozen = miscFrozen.add(balance.lockedBalance?.toBn() || new BN(0));
        totalBalance = totalBalance.add(balance.freeBalance?.toBn() || new BN(0));

        const _systemBalance = await networkAPI.api.query.system.account(address);
        const systemBalance = _systemBalance.toHuman() as unknown as AccountInfo;

        // @ts-ignore
        const rawFreeKton = (systemBalance.data?.freeKton as string).replaceAll(',', '');
        // @ts-ignore
        const rawReservedKton = (systemBalance.data?.reservedKton as string).replaceAll(',', '');

        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        freeKtonBalance = freeKtonBalance.add(new BN(rawFreeKton) || new BN(0));
        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        reservedKtonBalance = reservedKtonBalance.add(new BN(rawReservedKton) || new BN(0));

        const balanceItem = {
          state: APIItemState.READY,
          free: totalBalance.toString(),
          miscFrozen: miscFrozen.toString(),
          feeFrozen: '0',
          reserved: '0'
        } as BalanceItem;

        if (chainTokens.length > 1) {
          balanceItem.children = {
            [chainTokens[1]]: {
              reserved: reservedKtonBalance.toString(),
              free: freeKtonBalance.toString(),
              frozen: '0',
              decimals: chainDecimals[1]
            }
          };
        }

        callback(networkKey, balanceItem);
      });
    });

    unsub = () => {
      Promise.all(unsubProms).then((unsubs) => {
        unsubs.forEach((unsub) => {
          unsub && unsub();
        });
      }).catch(console.error);
    };
  }

  function mainCallback (item = {}) {
    Object.assign(balanceItem, item);
    callback(networkKey, balanceItem);
  }

  function subCallback (children: Record<string, BalanceChildItem>) {
    if (!Object.keys(children).length) {
      return;
    }

    balanceItem.children = { ...balanceItem.children, ...children };
    callback(networkKey, balanceItem);
  }

  let unsub2: () => void;
  let unsub3: () => void;

  try {
    if (['bifrost', 'acala', 'karura', 'acala_testnet', 'pioneer', 'bitcountry'].includes(networkKey)) {
      unsub2 = await subscribeTokensBalance(addresses, networkKey, networkAPI.api, mainCallback, subCallback);
    } else if (['kintsugi', 'interlay', 'kintsugi_test'].includes(networkKey)) {
      unsub2 = await subscribeTokensBalance(addresses, networkKey, networkAPI.api, mainCallback, subCallback, true);
    } else if (['statemine', 'astar', 'shiden', 'statemint'].indexOf(networkKey) > -1) {
      unsub2 = await subscribeAssetsBalance(addresses, networkKey, networkAPI.api, subCallback);
    } else if (['genshiro_testnet', 'genshiro', 'equilibrium_parachain'].includes(networkKey)) {
      unsub2 = await subscribeGenshiroTokenBalance(addresses, networkKey, networkAPI.api, mainCallback, subCallback, true);
    } else if (moonbeamBaseChains.includes(networkKey) || networkAPI.isEthereum) {
      unsub2 = subscribeERC20Interval(addresses, networkKey, networkAPI.api, web3ApiMap, subCallback);
    }

    if (!networkAPI.isEthereum && networkAPI.api.query.contracts) { // Get sub-token for substrate-based chains
      unsub3 = subscribePSP22Balance(addresses, networkKey, networkAPI.api, subCallback);
    }
  } catch (err) {
    console.warn(err);
  }

  return () => {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    unsub && unsub();
    unsub2 && unsub2();
    unsub3 && unsub3();
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
      .catch(console.warn);
  }

  function subCallback (children: Record<string, BalanceChildItem>) {
    if (!Object.keys(children).length) {
      return;
    }

    balanceItem.children = { ...balanceItem.children, ...children };
    callback(networkKey, balanceItem);
  }

  getBalance();
  const interval = setInterval(getBalance, ASTAR_REFRESH_BALANCE_INTERVAL);
  const unsub2 = subscribeERC20Interval(addresses, networkKey, api, web3ApiMap, subCallback);

  return () => {
    clearInterval(interval);
    unsub2 && unsub2();
  };
}

export function subscribeBalance (addresses: string[], dotSamaAPIMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, callback: (networkKey: string, rs: BalanceItem) => void) {
  const [substrateAddresses, evmAddresses] = categoryAddresses(addresses);

  const unsubList = Object.entries(dotSamaAPIMap).map(async ([networkKey, apiProps]) => {
    const networkAPI = await apiProps.isReady;
    const useAddresses = apiProps.isEthereum ? evmAddresses : substrateAddresses;

    if (['binance', 'binance_test', 'ethereum', 'ethereum_goerli', 'astarEvm', 'shidenEvm', 'shibuyaEvm', 'crabEvm', 'pangolinEvm', 'cloverEvm', 'boba_rinkeby', 'boba', 'bobabase', 'bobabeam', 'watr_network_evm'].includes(networkKey)) {
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

  return () => {
    unsubList.forEach((subProm) => {
      subProm.then((unsub) => {
        unsub && unsub();
      }).catch(console.error);
    });
  };
}

export async function getFreeBalance (networkKey: string, address: string, dotSamaApiMap: Record<string, ApiProps>, web3ApiMap: Record<string, Web3>, token?: string): Promise<string> {
  const apiProps = await dotSamaApiMap[networkKey].isReady;
  const api = apiProps.api;
  const web3Api = web3ApiMap[networkKey];
  const tokenInfo = token ? await getTokenInfo(networkKey, api, token) : undefined;
  const isMainToken = tokenInfo ? tokenInfo.isMainToken : true;

  // Only EVM Address use with EVM network
  if (Boolean(web3Api || apiProps.isEthereum) !== isEthereumAddress(address)) {
    if (!isEthereumAddress(address)) {
      return '0';
    }
  }

  // web3Api support mean isEthereum Network support
  if (web3Api) {
    if (isMainToken) {
      return await web3Api?.eth.getBalance(address) || '0';
    } else {
      if (!tokenInfo?.contractAddress) {
        return '0';
      }

      const contract = getERC20Contract(networkKey, tokenInfo.contractAddress, web3ApiMap);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const free = await contract.methods.balanceOf(address).call();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
      return free?.toString() || '0';
    }
  } else {
    if (token) {
      if (tokenInfo && tokenInfo.type) {
        if (!tokenInfo?.contractAddress) {
          return '0';
        }

        const contractPromise = getPSP22ContractPromise(api, tokenInfo.contractAddress);

        const balanceOf = await contractPromise.query['psp22::balanceOf'](address, { gasLimit: -1 }, address);

        return balanceOf.output ? balanceOf.output.toString() : '0';
      } else if (['genshiro_testnet', 'genshiro', 'equilibrium_parachain'].includes(networkKey)) {
        const asset = networkKey === 'equilibrium_parachain' ? assetFromToken(token)[0] : assetFromToken(token);
        const balance = await api.query.eqBalances.account(address, asset);

        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return
        return balance.asPositive?.toString() || '0';
      } else if (tokenInfo && ((networkKey === 'crab' && tokenInfo.symbol === 'CKTON') || (networkKey === 'pangolin' && tokenInfo.symbol === 'PKTON'))) {
        // @ts-ignore
        const balance = await api.query.system.account(address) as { data: { freeKton: Balance } };

        return balance.data?.freeKton?.toString() || '0';
      } else if (!isMainToken && ['astar', 'shiden', 'statemint', 'statemine'].includes(networkKey)) {
        const balanceInfo = (await api.query.assets.account(tokenInfo?.assetIndex, address)).toHuman() as Record<string, string>;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return
        return balanceInfo?.balance?.replaceAll(',', '') || '0';
      } else if (!isMainToken || ['kintsugi', 'kintsugi_test', 'interlay'].includes(networkKey)) {
        // @ts-ignore
        const balance = await api.query.tokens.accounts(address, tokenInfo?.specialOption || { Token: token }) as TokenBalanceRaw;

        return balance.free?.toString() || '0';
      }
    }

    if (['kusama'].includes(networkKey)) {
      // @ts-ignore
      const _balance = await api.query.system.account(address);

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
      const balance = _balance.toHuman();

      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const freeBalance = new BN(balance.data?.free.replaceAll(',', ''));

      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const miscFrozen = new BN(balance.data?.miscFrozen.replaceAll(',', ''));

      const transferable = freeBalance.sub(miscFrozen);

      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return
      return transferable.toString() || '0';
    }

    const balance = await api.derive.balances.all(address);

    return balance.availableBalance?.toBn()?.toString() || '0';
  }
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
  const web3Api = web3ApiMap[networkKey];
  const tokenInfo = token ? await getTokenInfo(networkKey, api, token) : undefined;
  const isMainToken = tokenInfo ? tokenInfo.isMainToken : true;

  // Only EVM Address use with EVM network
  if (Boolean(web3Api || apiProps.isEthereum) !== isEthereumAddress(address)) {
    if (!isEthereumAddress(address)) {
      update('0');

      return () => undefined;
    }
  }

  const responseIntervalSubscription = (method: () => void) => {
    method();
    const interval = setInterval(method, SUBSCRIBE_BALANCE_FAST_INTERVAL);

    return () => {
      clearInterval(interval);
    };
  };

  // web3Api support mean isEthereum Network support
  if (web3Api) {
    if (isMainToken) {
      const getEvmMainBalance = () => {
        web3Api.eth.getBalance(address).then(update).catch(console.log);
      };

      return responseIntervalSubscription(getEvmMainBalance);
    } else {
      const getERC20FreeBalance = () => {
        if (!tokenInfo?.contractAddress) {
          return;
        }

        const contract = getERC20Contract(networkKey, tokenInfo.contractAddress, web3ApiMap);

        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        contract.methods.balanceOf(address).call().then((free) => {
          // eslint-disable-next-line node/no-callback-literal,@typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          update(free?.toString() || '0');
        });
      };

      return responseIntervalSubscription(getERC20FreeBalance);
    }
  } else {
    // Handle WASM tokens
    if (token) {
      if (tokenInfo && tokenInfo.type) {
        const getPSP22FreeBalance = () => {
          if (!tokenInfo?.contractAddress) {
            return;
          }

          const contractPromise = getPSP22ContractPromise(api, tokenInfo.contractAddress);

          contractPromise.query['psp22::balanceOf'](address, { gasLimit: -1 }, address)
            .then((balanceOf) => {
              update(balanceOf.output ? balanceOf.output.toString() : '0');
            }).catch(console.error);
        };

        return responseIntervalSubscription(getPSP22FreeBalance);
      } else if (['genshiro_testnet', 'genshiro', 'equilibrium_parachain'].includes(networkKey)) {
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
      } else if (tokenInfo && ((networkKey === 'crab' && tokenInfo.symbol === 'CKTON') || (networkKey === 'pangolin' && tokenInfo.symbol === 'PKTON'))) {
        // @ts-ignore
        const unsub = await api.query.system.account(address, (balance: DeriveBalancesAll) => {
          // @ts-ignore
          // eslint-disable-next-line node/no-callback-literal,@typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          update(balance.data?.freeKton?.toBn()?.toString() || '0');
        });

        return () => {
          // @ts-ignore
          unsub && unsub();
        };
      } else if (!isMainToken && ['astar', 'shiden', 'statemint', 'statemine'].includes(networkKey)) {
        // @ts-ignore
        const unsub = await api.query.assets.account(tokenInfo?.assetIndex, address, (_balanceInfo) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          const balanceInfo = _balanceInfo.toHuman() as Record<string, string>;

          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          update(balanceInfo?.balance?.replaceAll(',', '') || '0');
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

    if (['kusama'].includes(networkKey)) {
      // @ts-ignore
      const unsub = await api.query.system.account(address, (_balance) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
        const balance = _balance.toHuman();
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        const freeBalance = new BN(balance.data?.free.replaceAll(',', ''));
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        const miscFrozen = new BN(balance.data?.miscFrozen.replaceAll(',', ''));

        const transferable = freeBalance.sub(miscFrozen);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        update(transferable.toString() || '0');
      });

      return () => {
        // @ts-ignore
        unsub && unsub();
      };
    }

    const unsub = await api.derive.balances?.all(address, (balance: DeriveBalancesAll) => {
      update(balance.availableBalance?.toBn()?.toString() || '0');
    });

    return () => {
      unsub && unsub();
    };
  }
}
