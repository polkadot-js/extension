// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { SignedBalance } from '@equilab/api/genshiro/interfaces';
import { _AssetType, _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { APIItemState, BalanceItem, TokenBalanceRaw } from '@subwallet/extension-base/background/KoniTypes';
import { ASTAR_REFRESH_BALANCE_INTERVAL, SUB_TOKEN_REFRESH_BALANCE_INTERVAL } from '@subwallet/extension-base/constants';
import { PalletNominationPoolsPoolMember } from '@subwallet/extension-base/koni/api/staking/bonding/utils';
import { getEVMBalance } from '@subwallet/extension-base/koni/api/tokens/evm/balance';
import { getERC20Contract } from '@subwallet/extension-base/koni/api/tokens/evm/web3';
import { getPSP22ContractPromise } from '@subwallet/extension-base/koni/api/tokens/wasm';
import { getDefaultWeightV2 } from '@subwallet/extension-base/koni/api/tokens/wasm/utils';
import { state } from '@subwallet/extension-base/koni/background/handlers';
import { _BALANCE_CHAIN_GROUP, _MANTA_ZK_CHAIN_GROUP, _PURE_EVM_CHAINS, _ZK_ASSET_PREFIX } from '@subwallet/extension-base/services/chain-service/constants';
import { _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _checkSmartContractSupportByChain, _getChainNativeTokenSlug, _getContractAddressOfToken, _getTokenOnChainAssetId, _getTokenOnChainInfo, _isChainEvmCompatible, _isPureEvmChain, _isSubstrateRelayChain } from '@subwallet/extension-base/services/chain-service/utils';
import { categoryAddresses, sumBN } from '@subwallet/extension-base/utils';
import BigN from 'bignumber.js';
import { Contract } from 'web3-eth-contract';

import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { AccountInfo } from '@polkadot/types/interfaces';
import { BN, BN_ZERO } from '@polkadot/util';

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
  const unsubList = Object.entries(chainInfoMap).map(async ([chainSlug, chainInfo]) => {
    const useAddresses = _isChainEvmCompatible(chainInfo) ? evmAddresses : substrateAddresses;

    if (_isPureEvmChain(chainInfo)) {
      const nativeTokenInfo = state.getNativeTokenInfo(chainSlug);

      return subscribeEVMBalance(chainSlug, useAddresses, evmApiMap, callback, nativeTokenInfo);
    }

    if (!useAddresses || useAddresses.length === 0 || _PURE_EVM_CHAINS.indexOf(chainSlug) > -1) {
      const fungibleTokensByChain = state.chainService.getFungibleTokensByChain(chainSlug, true);
      const now = new Date().getTime();

      Object.values(fungibleTokensByChain).map((token) => {
        return {
          tokenSlug: token.slug,
          free: '0',
          locked: '0',
          state: APIItemState.READY,
          timestamp: now
        } as BalanceItem;
      }).forEach(callback);

      return undefined;
    }

    const networkAPI = await substrateApiMap[chainSlug].isReady;

    return subscribeSubstrateBalance(useAddresses, chainInfo, chainSlug, networkAPI, evmApiMap, callback);
  });

  return () => {
    unsubList.forEach((subProm) => {
      subProm.then((unsub) => {
        unsub && unsub();
      }).catch(console.error);
    });
  };
}

export async function subscribeSubstrateBalance (addresses: string[], chainInfo: _ChainInfo, chain: string, networkAPI: _SubstrateApi, evmApiMap: Record<string, _EvmApi>, callBack: (rs: BalanceItem) => void) {
  let unsubNativeToken: () => void;

  if (!_BALANCE_CHAIN_GROUP.kintsugi.includes(chain) && !_BALANCE_CHAIN_GROUP.genshiro.includes(chain) && !_BALANCE_CHAIN_GROUP.equilibrium_parachain.includes(chain)) {
    unsubNativeToken = await subscribeWithSystemAccountPallet(addresses, chainInfo, networkAPI.api, callBack);
  }

  let unsubLocalToken: () => void;
  let unsubEvmContractToken: () => void;
  let unsubWasmContractToken: () => void;

  try {
    if (_BALANCE_CHAIN_GROUP.bifrost.includes(chain)) {
      unsubLocalToken = await subscribeTokensAccountsPallet(addresses, chain, networkAPI.api, callBack);
    } else if (_BALANCE_CHAIN_GROUP.kintsugi.includes(chain)) {
      unsubLocalToken = await subscribeTokensAccountsPallet(addresses, chain, networkAPI.api, callBack, true);
    } else if (_BALANCE_CHAIN_GROUP.statemine.includes(chain)) {
      unsubLocalToken = await subscribeAssetsAccountPallet(addresses, chain, networkAPI.api, callBack);
    } else if (_BALANCE_CHAIN_GROUP.genshiro.includes(chain)) {
      unsubLocalToken = await subscribeEqBalanceAccountPallet(addresses, chain, networkAPI.api, callBack, true);
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
async function subscribeWithSystemAccountPallet (addresses: string[], chainInfo: _ChainInfo, networkAPI: ApiPromise, callBack: (rs: BalanceItem) => void) {
  const chainNativeTokenSlug = _getChainNativeTokenSlug(chainInfo);

  const unsub = await networkAPI.query.system.account.multi(addresses, async (balances: AccountInfo[]) => {
    let [total, reserved, miscFrozen, feeFrozen] = [new BN(0), new BN(0), new BN(0), new BN(0)];

    let pooledStakingBalance = BN_ZERO;

    if (_isSubstrateRelayChain(chainInfo) && networkAPI.query.nominationPools) {
      const poolMemberDatas = await networkAPI.query.nominationPools.poolMembers?.multi(addresses);

      if (poolMemberDatas) {
        for (const _poolMemberData of poolMemberDatas) {
          const poolMemberData = _poolMemberData.toPrimitive() as unknown as PalletNominationPoolsPoolMember;

          if (poolMemberData) {
            const pooledBalance = new BN(poolMemberData.points.toString());

            pooledStakingBalance = pooledStakingBalance.add(pooledBalance);

            Object.entries(poolMemberData.unbondingEras).forEach(([, amount]) => {
              pooledStakingBalance = pooledStakingBalance.add(new BN(amount));
            });
          }
        }
      }
    }

    balances.forEach((balance: AccountInfo) => {
      total = total.add(balance.data?.free?.toBn() || new BN(0)); // reserved is seperated
      reserved = reserved.add(balance.data?.reserved?.toBn() || new BN(0));
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      miscFrozen = miscFrozen.add(balance.data?.miscFrozen?.toBn() || balance?.data?.frozen?.toBn() || new BN(0)); // TODO: update frozen
      feeFrozen = feeFrozen.add(balance.data?.feeFrozen?.toBn() || new BN(0));
    });

    let locked = reserved.add(miscFrozen);

    total = total.add(reserved); // total = free + reserved

    if (pooledStakingBalance.gt(BN_ZERO)) {
      total = total.add(pooledStakingBalance);
      locked = locked.add(pooledStakingBalance);
    }

    const free = total.sub(locked);

    callBack({
      tokenSlug: chainNativeTokenSlug,
      free: free.gte(BN_ZERO) ? free.toString() : '0',
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
          locked: '0',
          state: APIItemState.READY
        } as BalanceItem);
      } catch (err) {
        console.log(tokenInfo.slug, err);
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
          const _balanceOf = await contract.query['psp22::balanceOf'](address, { gasLimit: getDefaultWeightV2(api) }, address);
          const balanceObj = _balanceOf?.output?.toPrimitive() as Record<string, any>;

          return _balanceOf.output ? (balanceObj.ok as string || balanceObj.Ok as string) : '0';
        }));

        free = sumBN(balances.map((bal) => new BN(bal || 0)));

        callBack({
          tokenSlug: tokenInfo.slug,
          free: free.toString(),
          locked: '0',
          state: APIItemState.READY
        } as BalanceItem);
      } catch (err) {
        console.warn(tokenInfo.slug, err); // TODO: error createType
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

  const unsub = await api.query.system.account.multi(addresses, (balances: Record<string, any>[]) => { // Equilibrium customizes the SystemAccount pallet
    Object.values(tokenMap).forEach((tokenInfo) => {
      const assetId = _getTokenOnChainAssetId(tokenInfo);
      let tokenFreeBalance = BN_ZERO;

      for (const balance of balances) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        const balancesData = JSON.parse(balance.data.toString()) as EqBalanceV0;
        const balanceList = balancesData.v0.balance;

        // @ts-ignore
        const freeTokenBalance = balanceList.find((data: EqBalanceItem) => data[0] === parseInt(assetId));
        const bnFreeTokenBalance = freeTokenBalance ? new BN(new BigN(freeTokenBalance[1].positive).toString()) : BN_ZERO;

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
async function subscribeEqBalanceAccountPallet (addresses: string[], chain: string, api: ApiPromise, callBack: (rs: BalanceItem) => void, includeNativeToken?: boolean): Promise<() => void> {
  const tokenTypes = includeNativeToken ? [_AssetType.NATIVE, _AssetType.LOCAL] : [_AssetType.LOCAL];
  const tokenMap = state.getAssetByChainAndAsset(chain, tokenTypes);

  const unsubList = Object.values(tokenMap).map(async (tokenInfo) => {
    try {
      const assetId = _getTokenOnChainAssetId(tokenInfo);
      const unsub = await api.query.eqBalances.account.multi(addresses.map((address) => [address, [assetId]]), (balances: SignedBalance[]) => {
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

async function subscribeTokensAccountsPallet (addresses: string[], chain: string, api: ApiPromise, callBack: (rs: BalanceItem) => void, includeNativeToken?: boolean) {
  const tokenTypes = includeNativeToken ? [_AssetType.NATIVE, _AssetType.LOCAL] : [_AssetType.LOCAL];
  const tokenMap = state.getAssetByChainAndAsset(chain, tokenTypes);

  const unsubList = await Promise.all(Object.values(tokenMap).map(async (tokenInfo) => {
    try {
      const onChainInfo = _getTokenOnChainInfo(tokenInfo);
      const assetId = _getTokenOnChainAssetId(tokenInfo);

      // Get Token Balance
      // @ts-ignore
      return await api.query.tokens.accounts.multi(addresses.map((address) => [address, onChainInfo || assetId]), (balances: TokenBalanceRaw[]) => {
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

async function subscribeAssetsAccountPallet (addresses: string[], chain: string, api: ApiPromise, callBack: (rs: BalanceItem) => void) {
  const tokenMap = state.getAssetByChainAndAsset(chain, [_AssetType.LOCAL]);

  Object.values(tokenMap).forEach((token) => {
    if (_MANTA_ZK_CHAIN_GROUP.includes(token.originChain) && token.symbol.startsWith(_ZK_ASSET_PREFIX)) {
      delete tokenMap[token.slug];
    }
  });

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
          const bdata = b?.toHuman();

          if (bdata) {
            // @ts-ignore
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
            const addressBalance = new BN(String(bdata?.balance).replaceAll(',', '') || '0');

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
