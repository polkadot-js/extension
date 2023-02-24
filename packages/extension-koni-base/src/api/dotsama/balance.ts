// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SignedBalance } from '@equilab/api/genshiro/interfaces';
import { _AssetType, _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { APIItemState, BalanceItem, TokenBalanceRaw } from '@subwallet/extension-base/background/KoniTypes';
import { _BALANCE_CHAIN_GROUP, _BALANCE_TOKEN_GROUP, _PURE_EVM_CHAINS } from '@subwallet/extension-base/services/chain-service/constants';
import { _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _checkSmartContractSupportByChain, _getChainNativeTokenSlug, _getContractAddressOfToken, _getTokenOnChainAssetId, _getTokenOnChainInfo, _isChainEvmCompatible, _isNativeToken, _isPureEvmChain, _isSmartContractToken } from '@subwallet/extension-base/services/chain-service/utils';
import { categoryAddresses, sumBN } from '@subwallet/extension-base/utils';
import { getEVMBalance } from '@subwallet/extension-koni-base/api/tokens/evm/balance';
import { getERC20Contract } from '@subwallet/extension-koni-base/api/tokens/evm/web3';
import { getPSP22ContractPromise } from '@subwallet/extension-koni-base/api/tokens/wasm';
import { state } from '@subwallet/extension-koni-base/background/handlers';
import { ASTAR_REFRESH_BALANCE_INTERVAL, SUB_TOKEN_REFRESH_BALANCE_INTERVAL, SUBSCRIBE_BALANCE_FAST_INTERVAL } from '@subwallet/extension-koni-base/constants';
import { Contract } from 'web3-eth-contract';

import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { DeriveBalancesAll } from '@polkadot/api-derive/types';
import { AccountInfo, Balance } from '@polkadot/types/interfaces';
import { BN, BN_ZERO } from '@polkadot/util';
import { isEthereumAddress } from '@polkadot/util-crypto';

type EqBalanceItem = [number, { positive: number }];
type EqBalanceV0 = {
  v0: {
    lock: number,
    balance: EqBalanceItem[]
  }
}

// main subscription
export function subscribeBalance (addresses: string[], chainInfoMap: Record<string, _ChainInfo>, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, callback: (rs: BalanceItem) => void) {
  const [substrateAddresses, evmAddresses] = categoryAddresses(addresses);

  // Looping over each chain
  const unsubList = Object.entries(substrateApiMap).map(async ([networkKey, substrateApi]) => {
    const networkAPI = await substrateApi.isReady;
    const chainInfo = chainInfoMap[networkKey];
    const useAddresses = _isChainEvmCompatible(chainInfo) ? evmAddresses : substrateAddresses;

    if (_isPureEvmChain(chainInfo)) {
      const nativeTokenInfo = state.getNativeTokenInfo(networkKey);

      return subscribeEVMBalance(networkKey, useAddresses, evmApiMap, callback, nativeTokenInfo);
    }

    if (!useAddresses || useAddresses.length === 0 || _PURE_EVM_CHAINS.indexOf(networkKey) > -1) {
      return undefined;
    }

    return subscribeSubstrateBalance(useAddresses, chainInfo, networkKey, networkAPI, evmApiMap, callback);
  });

  return () => {
    unsubList.forEach((subProm) => {
      subProm.then((unsub) => {
        unsub && unsub();
      }).catch(console.error);
    });
  };
}

async function subscribeSubstrateBalance (addresses: string[], chainInfo: _ChainInfo, chain: string, networkAPI: _SubstrateApi, evmApiMap: Record<string, _EvmApi>, callBack: (rs: BalanceItem) => void) {
  let unsubNativeToken: () => void;

  if (_BALANCE_CHAIN_GROUP.crab.includes(chain)) {
    unsubNativeToken = subscribeDarwiniaBalance(addresses, chainInfo, chain, networkAPI.api, callBack);
  } else if (!_BALANCE_CHAIN_GROUP.kintsugi.includes(chain) && !_BALANCE_CHAIN_GROUP.crab.includes(chain) && !_BALANCE_CHAIN_GROUP.genshiro.includes(chain) && !_BALANCE_CHAIN_GROUP.equilibrium_parachain.includes(chain)) {
    unsubNativeToken = await subscribeWithAccountMulti(addresses, chainInfo, networkAPI.api, callBack);
  }

  let unsubLocalToken: () => void;
  let unsubEvmContractToken: () => void;
  let unsubWasmContractToken: () => void;

  try {
    if (_BALANCE_CHAIN_GROUP.bifrost.includes(chain)) {
      unsubLocalToken = await subscribeTokensBalance(addresses, chain, networkAPI.api, callBack);
    } else if (_BALANCE_CHAIN_GROUP.kintsugi.includes(chain)) {
      unsubLocalToken = await subscribeTokensBalance(addresses, chain, networkAPI.api, callBack, true);
    } else if (_BALANCE_CHAIN_GROUP.statemine.includes(chain)) {
      unsubLocalToken = await subscribeAssetsBalance(addresses, chain, networkAPI.api, callBack);
    } else if (_BALANCE_CHAIN_GROUP.genshiro.includes(chain)) {
      unsubLocalToken = await subscribeGenshiroTokenBalance(addresses, chain, networkAPI.api, callBack, true);
    } else if (_BALANCE_CHAIN_GROUP.equilibrium_parachain.includes(chain)) {
      unsubLocalToken = await subscribeEquilibriumTokenBalance(addresses, chain, networkAPI.api, callBack, true);
    }

    if (_isChainEvmCompatible(chainInfo)) {
      unsubEvmContractToken = subscribeERC20Interval(addresses, chain, evmApiMap, callBack);
    }

    if (_checkSmartContractSupportByChain(chainInfo, _AssetType.PSP22)) { // Get sub-token for substrate-based chains
      unsubWasmContractToken = subscribePSP22Balance(addresses, chain, networkAPI.api, callBack);
    }
  } catch (err) {
    console.warn(err);
  }

  return () => {
    unsubNativeToken && unsubNativeToken();
    unsubLocalToken && unsubLocalToken();
    unsubEvmContractToken && unsubEvmContractToken();
    unsubWasmContractToken && unsubWasmContractToken();
  };
}

// handler according to different logic
async function subscribeWithAccountMulti (addresses: string[], chainInfo: _ChainInfo, networkAPI: ApiPromise, callBack: (rs: BalanceItem) => void) {
  const chainNativeTokenSlug = _getChainNativeTokenSlug(chainInfo);

  const unsub = await networkAPI.query.system.account.multi(addresses, (balances: AccountInfo[]) => {
    let [total, reserved, miscFrozen, feeFrozen] = [new BN(0), new BN(0), new BN(0), new BN(0)];

    balances.forEach((balance: AccountInfo) => {
      total = total.add(balance.data?.free?.toBn() || new BN(0));
      reserved = reserved.add(balance.data?.reserved?.toBn() || new BN(0));
      miscFrozen = miscFrozen.add(balance.data?.miscFrozen?.toBn() || new BN(0));
      feeFrozen = feeFrozen.add(balance.data?.feeFrozen?.toBn() || new BN(0));
    });

    const free = total.sub(miscFrozen);
    const locked = reserved.add(miscFrozen);

    callBack({
      tokenSlug: chainNativeTokenSlug,
      free: free.toString(),
      locked: locked.toString(),
      state: APIItemState.READY,
      substrateInfo: {
        miscFrozen: miscFrozen.toString(),
        reserved: reserved.toString(),
        feeFrozen: feeFrozen.toString()
      }
    });
  });

  return () => {
    unsub();
  };
}

function subscribeDarwiniaBalance (addresses: string[], chainInfo: _ChainInfo, chain: string, networkAPI: ApiPromise, callBack: (rs: BalanceItem) => void) {
  const tokenMap = state.getAssetByChainAndAsset(chain, [_AssetType.LOCAL]);
  const nativeTokenSlug = _getChainNativeTokenSlug(chainInfo);

  let totalBalance: BN = new BN(0);
  let freeBalance: BN = new BN(0);
  let miscFrozen: BN = new BN(0);
  let reservedKtonBalance: BN = new BN(0);
  let totalKtonBalance: BN = new BN(0);

  const unsubProms = addresses.map((address) => {
    return networkAPI.derive.balances?.all(address, async (balance: DeriveBalancesAll) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      freeBalance = freeBalance.add(balance.availableBalance?.toBn() || new BN(0));
      miscFrozen = miscFrozen.add(balance.lockedBalance?.toBn() || new BN(0));
      totalBalance = totalBalance.add(balance.freeBalance?.toBn() || new BN(0));

      const _systemBalance = await networkAPI.query.system.account(address);
      const systemBalance = _systemBalance.toHuman() as unknown as AccountInfo;

      // @ts-ignore
      const rawTotalKton = (systemBalance.data?.freeKton as string).replaceAll(',', '');
      // @ts-ignore
      const rawReservedKton = (systemBalance.data?.reservedKton as string).replaceAll(',', '');

      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      totalKtonBalance = totalKtonBalance.add(new BN(rawTotalKton) || new BN(0));
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      reservedKtonBalance = reservedKtonBalance.add(new BN(rawReservedKton) || new BN(0));

      if (Object.keys(tokenMap).length > 1) {
        for (const tokenInfo of Object.values(tokenMap)) {
          if (_BALANCE_TOKEN_GROUP.crab.includes(tokenInfo.symbol)) {
            const freeKton = totalKtonBalance.sub(reservedKtonBalance);

            callBack({
              free: freeKton.toString(),
              locked: reservedKtonBalance.toString(),
              state: APIItemState.READY,
              tokenSlug: tokenInfo.slug
            });
            break;
          }
        }
      }

      const free = totalBalance.sub(miscFrozen);

      callBack({
        tokenSlug: nativeTokenSlug,
        free: free.toString(),
        locked: miscFrozen.toString(),
        state: APIItemState.READY,
        substrateInfo: {
          miscFrozen: miscFrozen.toString()
        }
      });
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

function subscribeERC20Interval (addresses: string[], chain: string, evmApiMap: Record<string, _EvmApi>, callBack: (result: BalanceItem) => void): () => void {
  let tokenList = {} as Record<string, _ChainAsset>;
  const erc20ContractMap = {} as Record<string, Contract>;

  const getTokenBalances = () => {
    Object.values(tokenList).map(async (tokenInfo) => {
      let free = new BN(0);

      try {
        const contract = erc20ContractMap[tokenInfo.slug];
        const balanceList = await Promise.all(addresses.map((address): Promise<string> => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          return contract.methods.balanceOf(address).call();
        }));

        free = sumBN(balanceList.map((balance) => new BN(balance || 0)));

        callBack({
          tokenSlug: tokenInfo.slug,
          free: free.toString(),
          locked: '0'
        } as BalanceItem);
      } catch (err) {
        console.log('There is a problem fetching ' + tokenInfo.slug + ' token balance', err);
      }
    });
  };

  tokenList = state.getAssetByChainAndAsset(chain, [_AssetType.ERC20]);
  Object.entries(tokenList).forEach(([slug, tokenInfo]) => {
    erc20ContractMap[slug] = getERC20Contract(chain, _getContractAddressOfToken(tokenInfo), evmApiMap);
  });

  getTokenBalances();

  const interval = setInterval(getTokenBalances, SUB_TOKEN_REFRESH_BALANCE_INTERVAL);

  return () => {
    clearInterval(interval);
  };
}

function subscribePSP22Balance (addresses: string[], chain: string, api: ApiPromise, callBack: (result: BalanceItem) => void) {
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

        callBack({
          tokenSlug: tokenInfo.slug,
          free: free.toString(),
          locked: '0',
          state: APIItemState.READY
        } as BalanceItem);
      } catch (err) {
        console.log('There is a problem fetching ' + tokenInfo.slug + ' PSP-22 token balance', err);
      }
    });
  };

  tokenList = state.getAssetByChainAndAsset(chain, [_AssetType.PSP22]);
  Object.entries(tokenList).forEach(([slug, tokenInfo]) => {
    psp22ContractMap[slug] = getPSP22ContractPromise(api, _getContractAddressOfToken(tokenInfo));
  });

  getTokenBalances();

  const interval = setInterval(getTokenBalances, SUB_TOKEN_REFRESH_BALANCE_INTERVAL);

  return () => {
    clearInterval(interval);
  };
}

async function subscribeEquilibriumTokenBalance (addresses: string[], chain: string, api: ApiPromise, callBack: (rs: BalanceItem) => void, includeNativeToken?: boolean): Promise<() => void> {
  const tokenTypes = includeNativeToken ? [_AssetType.NATIVE, _AssetType.LOCAL] : [_AssetType.LOCAL];
  const tokenMap = state.getAssetByChainAndAsset(chain, tokenTypes);

  const unsub = await api.query.system.account.multi(addresses, (balances: Record<string, any>[]) => {
    Object.values(tokenMap).forEach((tokenInfo) => {
      const assetId = _getTokenOnChainAssetId(tokenInfo);
      let tokenFreeBalance = BN_ZERO;

      for (const balance of balances) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        const balancesData = JSON.parse(balance.data.toString()) as EqBalanceV0;
        const balanceList = balancesData.v0.balance;

        // @ts-ignore
        const freeTokenBalance = balanceList.find((data: EqBalanceItem) => data[0] === assetId);
        const bnFreeTokenBalance = freeTokenBalance ? new BN(freeTokenBalance[1].positive.toString()) : BN_ZERO;

        tokenFreeBalance = tokenFreeBalance.add(bnFreeTokenBalance);
      }

      const tokenBalance: BalanceItem = {
        free: tokenFreeBalance.toString(),
        locked: '0', // Equilibrium doesn't show locked balance
        state: APIItemState.READY,
        tokenSlug: tokenInfo.slug
      };

      callBack(tokenBalance);
    });
  });

  return () => {
    unsub();
  };
}

// eslint-disable-next-line @typescript-eslint/require-await
async function subscribeGenshiroTokenBalance (addresses: string[], chain: string, api: ApiPromise, callBack: (rs: BalanceItem) => void, includeNativeToken?: boolean): Promise<() => void> {
  const tokenTypes = includeNativeToken ? [_AssetType.NATIVE, _AssetType.LOCAL] : [_AssetType.LOCAL];
  const tokenMap = state.getAssetByChainAndAsset(chain, tokenTypes);

  const unsubList = Object.values(tokenMap).map(async (tokenInfo) => {
    try {
      const onChainInfo = _getTokenOnChainInfo(tokenInfo);
      const unsub = await api.query.eqBalances.account.multi(addresses.map((address) => [address, onChainInfo]), (balances: SignedBalance[]) => {
        const tokenBalance = {
          free: sumBN(balances.map((b) => (b.asPositive))).toString(),
          locked: '0', // Equilibrium doesn't show locked balance
          state: APIItemState.READY,
          tokenSlug: tokenInfo.slug
        };

        callBack(tokenBalance);
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

async function subscribeTokensBalance (addresses: string[], chain: string, api: ApiPromise, callBack: (rs: BalanceItem) => void, includeNativeToken?: boolean) {
  const tokenTypes = includeNativeToken ? [_AssetType.NATIVE, _AssetType.LOCAL] : [_AssetType.LOCAL];
  const tokenMap = state.getAssetByChainAndAsset(chain, tokenTypes);

  const unsubList = await Promise.all(Object.values(tokenMap).map(async (tokenInfo) => {
    try {
      const onChainInfo = _getTokenOnChainInfo(tokenInfo);

      // Get Token Balance
      // @ts-ignore
      return await api.query.tokens.accounts.multi(addresses.map((address) => [address, onChainInfo]), (balances: TokenBalanceRaw[]) => {
        const tokenBalance = {
          reserved: sumBN(balances.map((b) => (b.reserved || new BN(0)))),
          frozen: sumBN(balances.map((b) => (b.frozen || new BN(0)))),
          free: sumBN(balances.map((b) => (b.free || new BN(0)))) // free is actually total balance
        };

        // free balance = total balance - frozen misc
        // locked balance = reserved + frozen misc
        const freeBalance = tokenBalance.free.sub(tokenBalance.frozen);
        const lockedBalance = tokenBalance.frozen.add(tokenBalance.reserved);

        callBack({
          tokenSlug: tokenInfo.slug,
          state: APIItemState.READY,
          free: freeBalance.toString(),
          locked: lockedBalance.toString(),
          substrateInfo: {
            reserved: tokenBalance.reserved.toString(),
            miscFrozen: tokenBalance.frozen.toString()
          }
        } as BalanceItem);
      });
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

async function subscribeAssetsBalance (addresses: string[], chain: string, api: ApiPromise, callBack: (rs: BalanceItem) => void) {
  const tokenMap = state.getAssetByChainAndAsset(chain, [_AssetType.LOCAL]);

  const unsubList = await Promise.all(Object.values(tokenMap).map(async (tokenInfo) => {
    try {
      const assetIndex = _getTokenOnChainAssetId(tokenInfo);

      // Get Token Balance
      return await api.query.assets.account.multi(addresses.map((address) => [assetIndex, address]), (balances) => {
        let total = new BN(0);
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
              total = total.add(addressBalance);
            }
          }
        });

        const free = total.sub(frozen);

        callBack({
          tokenSlug: tokenInfo.slug,
          free: free.toString(),
          locked: frozen.toString(),
          state: APIItemState.READY,
          substrateInfo: {
            miscFrozen: frozen.toString(),
            reserved: '0'
          }
        });
      });
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

export function subscribeEVMBalance (chain: string, addresses: string[], evmApiMap: Record<string, _EvmApi>, callback: (rs: BalanceItem) => void, tokenInfo: _ChainAsset) {
  const balanceItem = {
    tokenSlug: tokenInfo.slug,
    state: APIItemState.PENDING,
    free: '0',
    locked: '0'
  } as BalanceItem;

  function getBalance () {
    getEVMBalance(chain, addresses, evmApiMap)
      .then((balances) => {
        balanceItem.free = sumBN(balances.map((b) => (new BN(b || '0')))).toString();
        balanceItem.state = APIItemState.READY;
        callback(balanceItem);
      })
      .catch(console.warn);
  }

  getBalance();
  const interval = setInterval(getBalance, ASTAR_REFRESH_BALANCE_INTERVAL);
  const unsub2 = subscribeERC20Interval(addresses, chain, evmApiMap, callback);

  return () => {
    clearInterval(interval);
    unsub2 && unsub2();
  };
}

export async function getFreeBalance (chain: string, address: string, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, tokenSlug?: string): Promise<string> {
  const substrateApi = await substrateApiMap[chain].isReady;
  const api = substrateApi.api;
  const web3Api = evmApiMap[chain];
  const tokenInfo = tokenSlug ? state.getAssetBySlug(tokenSlug) : state.getNativeTokenInfo(chain);
  const chainInfo = state.getChainInfo(chain);

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

      const contract = getERC20Contract(chain, _getContractAddressOfToken(tokenInfo), evmApiMap);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const free = await contract.methods.balanceOf(address).call();

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return
      return free?.toString() || '0';
    }
  } else {
    if (tokenSlug) {
      if (_isSmartContractToken(tokenInfo)) {
        if (_getContractAddressOfToken(tokenInfo).length > 0) {
          return '0';
        }

        const contractPromise = getPSP22ContractPromise(api, _getContractAddressOfToken(tokenInfo));

        const balanceOf = await contractPromise.query['psp22::balanceOf'](address, { gasLimit: -1 }, address);

        return balanceOf.output ? balanceOf.output.toString() : '0';
      } else if (_BALANCE_CHAIN_GROUP.genshiro.includes(chain)) {
        const onChainInfo = _getTokenOnChainInfo(tokenInfo);
        const balance = await api.query.eqBalances.account(address, onChainInfo);

        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return
        return balance.asPositive?.toString() || '0';
      } else if (_BALANCE_CHAIN_GROUP.equilibrium_parachain.includes(chain)) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const balance = await api.query.system.account(address) as any;
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        const balancesData = JSON.parse(balance.data.toString()) as EqBalanceV0;
        const balanceList = balancesData.v0.balance;
        let freeTokenBalance: EqBalanceItem | undefined;
        const assetId = _getTokenOnChainAssetId(tokenInfo);

        if (!_isNativeToken(tokenInfo)) {
          // @ts-ignore
          freeTokenBalance = balanceList.find((data: EqBalanceItem) => data[0] === assetId);
        } else {
          freeTokenBalance = balanceList[0];
        }

        return freeTokenBalance ? freeTokenBalance[1].positive.toString() : '0';
      } else if (_BALANCE_CHAIN_GROUP.crab.includes(chain) && _BALANCE_TOKEN_GROUP.crab.includes(tokenInfo.symbol)) {
        // @ts-ignore
        const balance = await api.query.system.account(address) as { data: { freeKton: Balance } };

        return balance.data?.freeKton?.toString() || '0';
      } else if (!_isNativeToken(tokenInfo) && _BALANCE_CHAIN_GROUP.statemine.includes(chain)) {
        const assetId = _getTokenOnChainAssetId(tokenInfo);
        const balanceInfo = (await api.query.assets.account(assetId, address)).toHuman() as Record<string, string>;

        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-return
        return balanceInfo?.balance?.replaceAll(',', '') || '0';
      } else if (!_isNativeToken(tokenInfo) || _BALANCE_CHAIN_GROUP.kintsugi.includes(chain)) {
        const onChainInfo = _getTokenOnChainInfo(tokenInfo);
        // @ts-ignore
        const balance = await api.query.tokens.accounts(address, onChainInfo) as TokenBalanceRaw;

        return balance.free?.toString() || '0';
      }
    }

    if (_BALANCE_CHAIN_GROUP.kusama.includes(chain)) {
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

export async function subscribeFreeBalance (chain: string, address: string, substrateApiMap: Record<string, _SubstrateApi>, evmApiMap: Record<string, _EvmApi>, token: string | undefined, update: (balance: string) => void): Promise<() => void> {
  const apiProps = await substrateApiMap[chain].isReady;
  const api = apiProps.api;
  const web3Api = evmApiMap[chain];
  const tokenInfo = token ? state.getAssetBySlug(token) : state.getNativeTokenInfo(chain);
  const chainInfo = state.getChainInfo(chain);
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

        const contract = getERC20Contract(chain, _getContractAddressOfToken(tokenInfo), evmApiMap);

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
      } else if (_BALANCE_CHAIN_GROUP.genshiro.includes(chain)) {
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
      } else if (_BALANCE_CHAIN_GROUP.equilibrium_parachain.includes(chain)) {
        // @ts-ignore
        const unsub = await api.query.system.account(address, (balance) => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          const balancesData = JSON.parse(balance.data.toString()) as EqBalanceV0;
          const balanceList = balancesData.v0.balance;
          let freeTokenBalance: EqBalanceItem | undefined;
          const assetId = _getTokenOnChainAssetId(tokenInfo);

          if (!_isNativeToken(tokenInfo)) {
            // @ts-ignore
            freeTokenBalance = balanceList.find((data: EqBalanceItem) => data[0] === assetId);
          } else {
            freeTokenBalance = balanceList[0];
          }

          update(freeTokenBalance ? freeTokenBalance[1].positive.toString() : '0');
        });

        return () => {
          // @ts-ignore
          unsub && unsub();
        };
      } else if (_BALANCE_CHAIN_GROUP.crab.includes(chain) && _BALANCE_TOKEN_GROUP.crab.includes(tokenInfo.symbol)) {
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
      } else if (!isNativeToken && _BALANCE_CHAIN_GROUP.statemine.includes(chain)) {
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
      } else if (!isNativeToken || _BALANCE_CHAIN_GROUP.kintsugi.includes(chain)) {
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

    if (_BALANCE_CHAIN_GROUP.kusama.includes(chain)) {
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
