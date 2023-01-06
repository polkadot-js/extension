// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SignedBalance } from '@equilab/api/genshiro/interfaces';
import { _AssetType, _ChainAsset, _ChainInfo } from '@subwallet/chain/types';
import { APIItemState, ApiProps, BalanceChildItem, BalanceItem, TokenBalanceRaw } from '@subwallet/extension-base/background/KoniTypes';
import { _BALANCE_CHAIN_GROUP, _BALANCE_TOKEN_GROUP, _PURE_EVM_CHAINS } from '@subwallet/extension-base/services/chain-service/constants';
import { _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _checkSmartContractSupportByChain, _getContractAddressOfToken, _getTokenOnChainAssetId, _getTokenOnChainInfo, _isChainEvmCompatible, _isNativeToken, _isPureEvmChain, _isSmartContractToken } from '@subwallet/extension-base/services/chain-service/utils';
import { getEVMBalance } from '@subwallet/extension-koni-base/api/tokens/evm/balance';
import { getERC20Contract } from '@subwallet/extension-koni-base/api/tokens/evm/web3';
import { getPSP22ContractPromise } from '@subwallet/extension-koni-base/api/tokens/wasm';
import { state } from '@subwallet/extension-koni-base/background/handlers';
import { ASTAR_REFRESH_BALANCE_INTERVAL, SUB_TOKEN_REFRESH_BALANCE_INTERVAL, SUBSCRIBE_BALANCE_FAST_INTERVAL } from '@subwallet/extension-koni-base/constants';
import { categoryAddresses, sumBN } from '@subwallet/extension-koni-base/utils';
import { Contract } from 'web3-eth-contract';

import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { DeriveBalancesAll } from '@polkadot/api-derive/types';
import { AccountInfo, Balance } from '@polkadot/types/interfaces';
import { BN } from '@polkadot/util';
import { isEthereumAddress } from '@polkadot/util-crypto';

type EqBalanceItem = [number, { positive: number }];

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

function subscribeERC20Interval (addresses: string[], networkKey: string, api: ApiPromise, evmApiMap: Record<string, _EvmApi>, subCallback: (rs: Record<string, BalanceChildItem>) => void): () => void {
  let tokenList = {} as Record<string, _ChainAsset>;
  const erc20ContractMap = {} as Record<string, Contract>;

  const getTokenBalances = () => {
    Object.values(tokenList).map(async (tokenInfo) => {
      let free = new BN(0);

      try {
        const contract = erc20ContractMap[tokenInfo.slug];
        const bals = await Promise.all(addresses.map((address): Promise<string> => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          return contract.methods.balanceOf(address).call();
        }));

        free = sumBN(bals.map((bal) => new BN(bal || 0)));
        // console.log('TokenBals', symbol, addresses, bals, free);

        subCallback({
          [tokenInfo.slug]: {
            reserved: '0',
            frozen: '0',
            free: free.toString(),
            decimals: tokenInfo.decimals || 0
          }
        });
      } catch (err) {
        console.log('There is problem when fetching ' + tokenInfo.slug + ' token balance', err);
      }
    });
  };

  tokenList = state.getAssetByChainAndAsset(networkKey, [_AssetType.ERC20]);
  Object.entries(tokenList).forEach(([slug, tokenInfo]) => {
    erc20ContractMap[slug] = getERC20Contract(networkKey, _getContractAddressOfToken(tokenInfo), evmApiMap);
  });

  getTokenBalances();

  // TODO: remove this
  // getRegistry(networkKey, api, state.getActiveErc20Tokens())
  //   .then(({ tokenMap }) => {
  //     tokenList = Object.values(tokenMap).filter(({ contractAddress }) => (!!contractAddress));
  //     tokenList.forEach(({ contractAddress, symbol }) => {
  //       if (contractAddress) {
  //         erc20ContractMap[symbol] = getERC20Contract(networkKey, contractAddress, evmApiMap);
  //       }
  //     });
  //
  //   }).catch(console.warn);

  const interval = setInterval(getTokenBalances, SUB_TOKEN_REFRESH_BALANCE_INTERVAL);

  return () => {
    clearInterval(interval);
  };
}

function subscribePSP22Balance (addresses: string[], networkKey: string, api: ApiPromise, subCallback: (rs: Record<string, BalanceChildItem>) => void) {
  let tokenList = {} as Record<string, _ChainAsset>;
  const psp22ContractMap = {} as Record<string, ContractPromise>;

  const getTokenBalances = () => {
    Object.values(tokenList).map(async (tokenInfo) => {
      let free = new BN(0);

      try {
        const contract = psp22ContractMap[tokenInfo.slug];
        const balances = await Promise.all(addresses.map(async (address): Promise<string> => {
          const _balanceOf = await contract.query['psp22::balanceOf'](address, { gasLimit: -1 }, address);

          return _balanceOf.output ? _balanceOf.output.toString() : '0';
        }));

        free = sumBN(balances.map((bal) => new BN(bal || 0)));

        subCallback({
          [tokenInfo.slug]: {
            reserved: '0',
            frozen: '0',
            free: free.toString(),
            decimals: tokenInfo.decimals || 0
          }
        });
      } catch (err) {
        console.log('There is problem when fetching ' + tokenInfo.slug + ' PSP-22 token balance', err);
      }
    });
  };

  tokenList = state.getAssetByChainAndAsset(networkKey, [_AssetType.PSP22]);
  Object.entries(tokenList).forEach(([slug, tokenInfo]) => {
    psp22ContractMap[slug] = getPSP22ContractPromise(api, _getContractAddressOfToken(tokenInfo));
  });

  getTokenBalances();

  // getRegistry(networkKey, api)
  //   .then(({ tokenMap }) => {
  //     tokenList = Object.values(tokenMap).filter(({ contractAddress, isMainToken }) => (!!contractAddress && !isMainToken));
  //     tokenList.forEach(({ contractAddress, symbol }) => {
  //       if (contractAddress) {
  //         PSP22ContractMap[symbol] = getPSP22ContractPromise(api, contractAddress);
  //       }
  //     });
  //     getTokenBalances();
  //   })
  //   .catch(console.warn);

  const interval = setInterval(getTokenBalances, SUB_TOKEN_REFRESH_BALANCE_INTERVAL);

  return () => {
    clearInterval(interval);
  };
}

async function subscribeEquilibriumTokenBalance (addresses: string[], networkKey: string, api: ApiPromise, mainCallback: (rs: BalanceItem) => void,
  subCallback: (rs: Record<string, BalanceChildItem>) => void, includeNativeToken?: boolean): Promise<() => void> {
  const tokenTypes = includeNativeToken ? [_AssetType.NATIVE, _AssetType.LOCAL] : [_AssetType.LOCAL];
  const tokenMap = state.getAssetByChainAndAsset(networkKey, tokenTypes);

  if (Object.keys(tokenMap).length > 0) {
    console.log('Get tokens balance of', networkKey, Object.keys(tokenMap));
  }

  const unsub = await api.query.system.account.multi(addresses, (balances: Record<string, any>[]) => {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const balancesData = JSON.parse(balances[0].data.toString()) as EqBalanceItem[];

    Object.values(tokenMap).map((tokenInfo) => {
      const assetId = _getTokenOnChainAssetId(tokenInfo);
      // @ts-ignore
      const freeTokenBalance = balancesData.find((data: EqBalanceItem) => data[0] === assetId);
      const tokenBalance = {
        reserved: '0',
        frozen: '0',
        free: freeTokenBalance ? freeTokenBalance[1].positive.toString() : '0',
        decimals: tokenInfo.decimals || 0
      };

      if (includeNativeToken && _isNativeToken(tokenInfo)) {
        mainCallback({
          state: APIItemState.READY,
          free: tokenBalance.free
        });
      } else {
        subCallback({ [tokenInfo.slug]: tokenBalance });
      }

      return undefined;
    });
  });

  return () => {
    unsub();
  };
}

// eslint-disable-next-line @typescript-eslint/require-await
async function subscribeGenshiroTokenBalance (addresses: string[], networkKey: string, api: ApiPromise, mainCallback: (rs: BalanceItem) => void,
  subCallback: (rs: Record<string, BalanceChildItem>) => void, includeNativeToken?: boolean): Promise<() => void> {
  const tokenTypes = includeNativeToken ? [_AssetType.NATIVE, _AssetType.LOCAL] : [_AssetType.LOCAL];
  const tokenMap = state.getAssetByChainAndAsset(networkKey, tokenTypes);

  if (Object.keys(tokenMap).length > 0) {
    console.log('Get tokens balance of', networkKey, Object.keys(tokenMap));
  }

  const unsubList = Object.values(tokenMap).map(async (tokenInfo) => {
    try {
      const onChainInfo = _getTokenOnChainInfo(tokenInfo);
      const unsub = await api.query.eqBalances.account.multi(addresses.map((address) => [address, onChainInfo]), (balances: SignedBalance[]) => {
        const tokenBalance = {
          reserved: '0',
          frozen: '0',
          free: sumBN(balances.map((b) => (b.asPositive))).toString(),
          decimals: tokenInfo.decimals || 0
        };

        if (includeNativeToken && _isNativeToken(tokenInfo)) {
          mainCallback({
            state: APIItemState.READY,
            free: tokenBalance.free
          });
        } else {
          subCallback({ [tokenInfo.slug]: tokenBalance });
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
  subCallback: (rs: Record<string, BalanceChildItem>) => void, includeNativeToken?: boolean) {
  const tokenTypes = includeNativeToken ? [_AssetType.NATIVE, _AssetType.LOCAL] : [_AssetType.LOCAL];
  const tokenMap = state.getAssetByChainAndAsset(networkKey, tokenTypes);

  if (Object.keys(tokenMap).length > 0) {
    console.log('Get tokens balance of', networkKey, Object.keys(tokenMap));
  }

  const unsubList = await Promise.all(Object.values(tokenMap).map(async (tokenInfo) => {
    try {
      const onChainInfo = _getTokenOnChainInfo(tokenInfo);
      // Get Token Balance
      // @ts-ignore
      const unsub = await api.query.tokens.accounts.multi(addresses.map((address) => [address, onChainInfo]), (balances: TokenBalanceRaw[]) => {
        const tokenBalance = {
          reserved: sumBN(balances.map((b) => (b.reserved || new BN(0)))).toString(),
          frozen: sumBN(balances.map((b) => (b.frozen || new BN(0)))).toString(),
          free: sumBN(balances.map((b) => (b.free || new BN(0)))).toString(),
          decimals: tokenInfo.decimals || 0
        };

        if (includeNativeToken && _isNativeToken(tokenInfo)) {
          mainCallback({
            state: APIItemState.READY,
            free: tokenBalance.free,
            reserved: tokenBalance.reserved,
            feeFrozen: tokenBalance.frozen
          });
        } else {
        // @ts-ignore
          subCallback({ [tokenInfo.slug]: tokenBalance });
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
  const tokenMap = state.getAssetByChainAndAsset(networkKey, [_AssetType.LOCAL]);

  if (Object.keys(tokenMap).length > 0) {
    console.log('Get tokens assets of', networkKey, Object.keys(tokenMap));
  }

  const unsubList = await Promise.all(Object.values(tokenMap).map(async (tokenInfo) => {
    try {
      const assetIndex = _getTokenOnChainAssetId(tokenInfo);
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
          decimals: tokenInfo.decimals || 0
        };

        subCallback({ [tokenInfo.slug]: tokenBalance });
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

async function subscribeWithAccountMulti (addresses: string[], chainInfo: _ChainInfo, networkKey: string, networkAPI: _SubstrateApi, evmApiMap: Record<string, _EvmApi>, callback: (networkKey: string, rs: BalanceItem) => void) {
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

  if (!_BALANCE_CHAIN_GROUP.kintsugi.includes(networkKey) && !_BALANCE_CHAIN_GROUP.crab.includes(networkKey) && !_BALANCE_CHAIN_GROUP.genshiro.includes(networkKey) && !_BALANCE_CHAIN_GROUP.equilibrium_parachain.includes(networkKey)) {
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

  if (_BALANCE_CHAIN_GROUP.crab.includes(networkKey)) {
    const tokenMap = state.getAssetByChainAndAsset(networkKey, [_AssetType.LOCAL]);

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

        if (Object.keys(tokenMap).length > 1) {
          for (const tokenInfo of Object.values(tokenMap)) {
            if (_BALANCE_TOKEN_GROUP.crab.includes(tokenInfo.symbol)) {
              balanceItem.children = {
                [tokenInfo.slug]: {
                  reserved: reservedKtonBalance.toString(),
                  free: freeKtonBalance.toString(),
                  frozen: '0',
                  decimals: tokenInfo.decimals || 0
                }
              };
              break;
            }
          }
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
    if (_BALANCE_CHAIN_GROUP.bifrost.includes(networkKey)) {
      unsub2 = await subscribeTokensBalance(addresses, networkKey, networkAPI.api, mainCallback, subCallback);
    } else if (_BALANCE_CHAIN_GROUP.kintsugi.includes(networkKey)) {
      unsub2 = await subscribeTokensBalance(addresses, networkKey, networkAPI.api, mainCallback, subCallback, true);
    } else if (_BALANCE_CHAIN_GROUP.statemine.indexOf(networkKey) > -1) {
      unsub2 = await subscribeAssetsBalance(addresses, networkKey, networkAPI.api, subCallback);
    } else if (_BALANCE_CHAIN_GROUP.genshiro.includes(networkKey)) {
      unsub2 = await subscribeGenshiroTokenBalance(addresses, networkKey, networkAPI.api, mainCallback, subCallback, true);
    } else if (_BALANCE_CHAIN_GROUP.equilibrium_parachain.includes(networkKey)) {
      unsub2 = await subscribeEquilibriumTokenBalance(addresses, networkKey, networkAPI.api, mainCallback, subCallback, true);
    } else if (chainInfo.evmInfo !== null) {
      unsub2 = subscribeERC20Interval(addresses, networkKey, networkAPI.api, evmApiMap, subCallback);
    }

    if (_checkSmartContractSupportByChain(chainInfo, _AssetType.PSP22)) { // Get sub-token for substrate-based chains
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

export function subscribeEVMBalance (networkKey: string, api: ApiPromise, addresses: string[], evmApiMap: Record<string, _EvmApi>, callback: (networkKey: string, rs: BalanceItem) => void) {
  const balanceItem = {
    state: APIItemState.PENDING,
    free: '0',
    reserved: '0',
    miscFrozen: '0',
    feeFrozen: '0'
  } as BalanceItem;

  function getBalance () {
    getEVMBalance(networkKey, addresses, evmApiMap)
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
  const unsub2 = subscribeERC20Interval(addresses, networkKey, api, evmApiMap, subCallback);

  return () => {
    clearInterval(interval);
    unsub2 && unsub2();
  };
}

export function subscribeBalance (addresses: string[], chainInfoMap: Record<string, _ChainInfo>, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, callback: (networkKey: string, rs: BalanceItem) => void) {
  const [substrateAddresses, evmAddresses] = categoryAddresses(addresses);

  const unsubList = Object.entries(substrateApiMap).map(async ([networkKey, substrateApi]) => {
    const networkAPI = await substrateApi.isReady;
    const chainInfo = chainInfoMap[networkKey];
    const useAddresses = chainInfo.evmInfo !== null ? evmAddresses : substrateAddresses;

    if (_isPureEvmChain(chainInfo)) {
      return subscribeEVMBalance(networkKey, networkAPI.api, useAddresses, evmApiMap, callback);
    }

    if (!useAddresses || useAddresses.length === 0 || _PURE_EVM_CHAINS.indexOf(networkKey) > -1) {
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
    return subscribeWithAccountMulti(useAddresses, chainInfo, networkKey, networkAPI, evmApiMap, callback);
  });

  return () => {
    unsubList.forEach((subProm) => {
      subProm.then((unsub) => {
        unsub && unsub();
      }).catch(console.error);
    });
  };
}

export async function getFreeBalance (networkKey: string, address: string, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, token?: string): Promise<string> {
  const apiProps = await substrateApiMap[networkKey].isReady;
  const api = apiProps.api;
  const web3Api = evmApiMap[networkKey];
  const tokenInfo = token ? state.getAssetBySlug(token) : state.getNativeTokenInfo(networkKey);
  const chainInfo = state.getChainInfoByKey(networkKey);

  // Only EVM Address use with EVM network
  if (Boolean(web3Api || _isChainEvmCompatible(chainInfo)) !== isEthereumAddress(address)) {
    if (!isEthereumAddress(address)) {
      return '0';
    }
  }

  // web3Api support mean isEthereum Network support
  if (web3Api) {
    if (_isNativeToken(tokenInfo)) {
      return await web3Api.api?.eth.getBalance(address) || '0';
    } else {
      if (_getContractAddressOfToken(tokenInfo).length > 0) {
        return '0';
      }

      const contract = getERC20Contract(networkKey, _getContractAddressOfToken(tokenInfo), evmApiMap);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const free = await contract.methods.balanceOf(address).call();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
      return free?.toString() || '0';
    }
  } else {
    if (token) {
      if (_isSmartContractToken(tokenInfo)) {
        if (_getContractAddressOfToken(tokenInfo).length > 0) {
          return '0';
        }

        const contractPromise = getPSP22ContractPromise(api, _getContractAddressOfToken(tokenInfo));

        const balanceOf = await contractPromise.query['psp22::balanceOf'](address, { gasLimit: -1 }, address);

        return balanceOf.output ? balanceOf.output.toString() : '0';
      } else if (_BALANCE_CHAIN_GROUP.genshiro.includes(networkKey)) {
        const onChainInfo = _getTokenOnChainInfo(tokenInfo);
        const balance = await api.query.eqBalances.account(address, onChainInfo);

        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return
        return balance.asPositive?.toString() || '0';
      } else if (_BALANCE_CHAIN_GROUP.equilibrium_parachain.includes(networkKey)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const balance = await api.query.system.account(address) as any;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        const balancesData = JSON.parse(balance.data.toString()) as EqBalanceItem[];
        let freeTokenBalance: EqBalanceItem | undefined;
        const assetId = _getTokenOnChainAssetId(tokenInfo);

        if (!_isNativeToken(tokenInfo)) {
          // @ts-ignore
          freeTokenBalance = balancesData.find((data: EqBalanceItem) => data[0] === assetId);
        } else {
          freeTokenBalance = balancesData[0];
        }

        return freeTokenBalance ? freeTokenBalance[1].positive.toString() : '0';
      } else if (_BALANCE_CHAIN_GROUP.crab.includes(networkKey) && _BALANCE_TOKEN_GROUP.crab.includes(tokenInfo.symbol)) {
        // @ts-ignore
        const balance = await api.query.system.account(address) as { data: { freeKton: Balance } };

        return balance.data?.freeKton?.toString() || '0';
      } else if (!_isNativeToken(tokenInfo) && _BALANCE_CHAIN_GROUP.statemine.includes(networkKey)) {
        const assetId = _getTokenOnChainAssetId(tokenInfo);
        const balanceInfo = (await api.query.assets.account(assetId, address)).toHuman() as Record<string, string>;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return
        return balanceInfo?.balance?.replaceAll(',', '') || '0';
      } else if (!_isNativeToken(tokenInfo) || _BALANCE_CHAIN_GROUP.kintsugi.includes(networkKey)) {
        const onChainInfo = _getTokenOnChainInfo(tokenInfo);
        // @ts-ignore
        const balance = await api.query.tokens.accounts(address, onChainInfo) as TokenBalanceRaw;

        return balance.free?.toString() || '0';
      }
    }

    if (_BALANCE_CHAIN_GROUP.kusama.includes(networkKey)) {
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
  substrateApiMap: Record<string, _SubstrateApi>,
  evmApiMap: Record<string, _EvmApi>,
  token: string | undefined,
  update: (balance: string) => void): Promise<() => void> {
  const apiProps = await substrateApiMap[networkKey].isReady;
  const api = apiProps.api;
  const web3Api = evmApiMap[networkKey];
  const tokenInfo = token ? state.getAssetBySlug(token) : state.getNativeTokenInfo(networkKey);
  const chainInfo = state.getChainInfoByKey(networkKey);
  const isNativeToken = _isNativeToken(tokenInfo);

  // Only EVM Address use with EVM network
  if (Boolean(web3Api || _isChainEvmCompatible(chainInfo)) !== isEthereumAddress(address)) {
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
    if (isNativeToken) {
      const getEvmMainBalance = () => {
        web3Api.api.eth.getBalance(address).then(update).catch(console.log);
      };

      return responseIntervalSubscription(getEvmMainBalance);
    } else {
      const getERC20FreeBalance = () => {
        if (!_isSmartContractToken(tokenInfo)) {
          return;
        }

        const contract = getERC20Contract(networkKey, _getContractAddressOfToken(tokenInfo), evmApiMap);

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
      if (_isSmartContractToken(tokenInfo)) {
        const getPSP22FreeBalance = () => {
          const contractPromise = getPSP22ContractPromise(api, _getContractAddressOfToken(tokenInfo));

          contractPromise.query['psp22::balanceOf'](address, { gasLimit: -1 }, address)
            .then((balanceOf) => {
              update(balanceOf.output ? balanceOf.output.toString() : '0');
            }).catch(console.error);
        };

        return responseIntervalSubscription(getPSP22FreeBalance);
      } else if (_BALANCE_CHAIN_GROUP.genshiro.includes(networkKey)) {
        const onChainInfo = _getTokenOnChainInfo(tokenInfo);
        // @ts-ignore
        const unsub = await api.query.eqBalances.account(address, onChainInfo, (balance) => {
          // eslint-disable-next-line node/no-callback-literal,@typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          update(balance.asPositive.toString() || '0');
        });

        return () => {
          // @ts-ignore
          unsub && unsub();
        };
      } else if (_BALANCE_CHAIN_GROUP.equilibrium_parachain.includes(networkKey)) {
        // @ts-ignore
        const unsub = await api.query.system.account(address, (balance) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          const balancesData = JSON.parse(balance.data.toString()) as EqBalanceItem[];
          let freeTokenBalance: EqBalanceItem | undefined;
          const assetId = _getTokenOnChainAssetId(tokenInfo);

          if (!_isNativeToken(tokenInfo)) {
            // @ts-ignore
            freeTokenBalance = balancesData.find((data: EqBalanceItem) => data[0] === assetId);
          } else {
            freeTokenBalance = balancesData[0];
          }

          update(freeTokenBalance ? freeTokenBalance[1].positive.toString() : '0');
        });

        return () => {
          // @ts-ignore
          unsub && unsub();
        };
      } else if (_BALANCE_CHAIN_GROUP.crab.includes(networkKey) && _BALANCE_TOKEN_GROUP.crab.includes(tokenInfo.symbol)) {
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
      } else if (!isNativeToken && _BALANCE_CHAIN_GROUP.statemine.includes(networkKey)) {
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
      } else if (!isNativeToken || _BALANCE_CHAIN_GROUP.kintsugi.includes(networkKey)) {
        const onChainInfo = _getTokenOnChainInfo(tokenInfo);
        // @ts-ignore
        const unsub = await api.query.tokens.accounts(address, onChainInfo, (balance) => {
          // eslint-disable-next-line node/no-callback-literal,@typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          update(balance.free?.toString() || '0');
        });

        return () => {
          // @ts-ignore
          unsub && unsub();
        };
      }
    }

    if (_BALANCE_CHAIN_GROUP.kusama.includes(networkKey)) {
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
