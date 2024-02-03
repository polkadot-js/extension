// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _AssetType, _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { APIItemState } from '@subwallet/extension-base/background/KoniTypes';
import { SUB_TOKEN_REFRESH_BALANCE_INTERVAL } from '@subwallet/extension-base/constants';
import { getPSP22ContractPromise } from '@subwallet/extension-base/koni/api/tokens/wasm';
import { getDefaultWeightV2 } from '@subwallet/extension-base/koni/api/tokens/wasm/utils';
import { SWHandler } from '@subwallet/extension-base/koni/background/handlers';
import { subscribeERC20Interval } from '@subwallet/extension-base/services/balance-service/helpers/subscribe/evm';
import { _BALANCE_CHAIN_GROUP, _MANTA_ZK_CHAIN_GROUP, _ZK_ASSET_PREFIX } from '@subwallet/extension-base/services/chain-service/constants';
import { _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _checkSmartContractSupportByChain, _getChainNativeTokenSlug, _getContractAddressOfToken, _getTokenOnChainAssetId, _getTokenOnChainInfo, _isChainEvmCompatible, _isSubstrateRelayChain } from '@subwallet/extension-base/services/chain-service/utils';
import { BalanceItem, PalletNominationPoolsPoolMember, TokenBalanceRaw } from '@subwallet/extension-base/types';

import { ApiPromise } from '@polkadot/api';
import { ContractPromise } from '@polkadot/api-contract';
import { AccountInfo } from '@polkadot/types/interfaces';
import { BN, BN_ZERO } from '@polkadot/util';

import { subscribeEquilibriumTokenBalance } from './equilibrium';

export async function subscribeSubstrateBalance (addresses: string[], chainInfo: _ChainInfo, chain: string, networkAPI: _SubstrateApi, evmApiMap: Record<string, _EvmApi>, callBack: (rs: BalanceItem[]) => void) {
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
    } else if (_BALANCE_CHAIN_GROUP.genshiro.includes(chain) || _BALANCE_CHAIN_GROUP.equilibrium_parachain.includes(chain)) {
      unsubLocalToken = await subscribeEquilibriumTokenBalance(addresses, chain, networkAPI.api, callBack, true);
    } else if (_BALANCE_CHAIN_GROUP.centrifuge.includes(chain)) {
      unsubLocalToken = await subscribeOrmlTokensPallet(addresses, chain, networkAPI.api, callBack);
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
async function subscribeWithSystemAccountPallet (addresses: string[], chainInfo: _ChainInfo, networkAPI: ApiPromise, callBack: (rs: BalanceItem[]) => void) {
  const chainNativeTokenSlug = _getChainNativeTokenSlug(chainInfo);

  // TODO: Need handle case error
  const unsub = await networkAPI.query.system.account.multi(addresses, async (balances: AccountInfo[]) => {
    const pooledStakingBalances: BN[] = [];

    if (_isSubstrateRelayChain(chainInfo) && networkAPI.query.nominationPools) {
      const poolMemberDatas = await networkAPI.query.nominationPools.poolMembers?.multi(addresses);

      if (poolMemberDatas) {
        for (const _poolMemberData of poolMemberDatas) {
          const poolMemberData = _poolMemberData.toPrimitive() as unknown as PalletNominationPoolsPoolMember;

          if (poolMemberData) {
            let pooled = new BN(poolMemberData.points.toString());

            Object.entries(poolMemberData.unbondingEras).forEach(([, amount]) => {
              pooled = pooled.add(new BN(amount));
            });

            pooledStakingBalances.push(pooled);
          } else {
            pooledStakingBalances.push(BN_ZERO);
          }
        }
      }
    }

    const items: BalanceItem[] = balances.map((balance: AccountInfo, index) => {
      let total = balance.data?.free?.toBn() || new BN(0);
      const reserved = balance.data?.reserved?.toBn() || new BN(0);
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      const miscFrozen = balance.data?.miscFrozen?.toBn() || balance?.data?.frozen?.toBn() || new BN(0);
      const feeFrozen = balance.data?.feeFrozen?.toBn() || new BN(0);

      let locked = reserved.add(miscFrozen);

      total = total.add(reserved);

      const pooledStakingBalance = pooledStakingBalances[index] || BN_ZERO;

      if (pooledStakingBalance.gt(BN_ZERO)) {
        total = total.add(pooledStakingBalance);
        locked = locked.add(pooledStakingBalance);
      }

      const free = total.sub(locked);

      return ({
        address: addresses[index],
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

    callBack(items);
  });

  return () => {
    unsub();
  };
}

function subscribePSP22Balance (addresses: string[], chain: string, api: ApiPromise, callBack: (result: BalanceItem[]) => void) {
  const state = SWHandler.instance.state;
  let tokenList = {} as Record<string, _ChainAsset>;
  const psp22ContractMap = {} as Record<string, ContractPromise>;

  const getTokenBalances = () => {
    Object.values(tokenList).map(async (tokenInfo) => {
      try {
        const contract = psp22ContractMap[tokenInfo.slug];
        const balances: BalanceItem[] = await Promise.all(addresses.map(async (address): Promise<BalanceItem> => {
          try {
            const _balanceOf = await contract.query['psp22::balanceOf'](address, { gasLimit: getDefaultWeightV2(api) }, address);
            const balanceObj = _balanceOf?.output?.toPrimitive() as Record<string, any>;

            return {
              address: address,
              tokenSlug: tokenInfo.slug,
              free: _balanceOf.output ? (balanceObj.ok as string ?? balanceObj.Ok as string) : '0',
              locked: '0',
              state: APIItemState.READY
            };
          } catch (err) {
            console.error(`Error on get balance of account ${address} for token ${tokenInfo.slug}`, err);

            return {
              address: address,
              tokenSlug: tokenInfo.slug,
              free: '0',
              locked: '0',
              state: APIItemState.READY
            };
          }
        }));

        callBack(balances);
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

async function subscribeTokensAccountsPallet (addresses: string[], chain: string, api: ApiPromise, callBack: (rs: BalanceItem[]) => void, includeNativeToken?: boolean) {
  const state = SWHandler.instance.state;
  const tokenTypes = includeNativeToken ? [_AssetType.NATIVE, _AssetType.LOCAL] : [_AssetType.LOCAL];
  const tokenMap = state.getAssetByChainAndAsset(chain, tokenTypes);

  const unsubList = await Promise.all(Object.values(tokenMap).map(async (tokenInfo) => {
    try {
      const onChainInfo = _getTokenOnChainInfo(tokenInfo);
      const assetId = _getTokenOnChainAssetId(tokenInfo);

      // Get Token Balance
      // @ts-ignore
      return await api.query.tokens.accounts.multi(addresses.map((address) => [address, onChainInfo || assetId]), (balances: TokenBalanceRaw[]) => {
        const items: BalanceItem[] = balances.map((balance, index): BalanceItem => {
          const tokenBalance = {
            reserved: balance.reserved || new BN(0),
            frozen: balance.frozen || new BN(0),
            free: balance.free || new BN(0) // free is actually total balance
          };

          const freeBalance = tokenBalance.free.sub(tokenBalance.frozen);
          const lockedBalance = tokenBalance.frozen.add(tokenBalance.reserved);

          return {
            address: addresses[index],
            tokenSlug: tokenInfo.slug,
            state: APIItemState.READY,
            free: freeBalance.toString(),
            locked: lockedBalance.toString(),
            substrateInfo: {
              reserved: tokenBalance.reserved.toString(),
              miscFrozen: tokenBalance.frozen.toString()
            }
          };
        });

        callBack(items);
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

async function subscribeAssetsAccountPallet (addresses: string[], chain: string, api: ApiPromise, callBack: (rs: BalanceItem[]) => void) {
  const state = SWHandler.instance.state;
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
        const items: BalanceItem[] = balances.map((balance, index): BalanceItem => {
          // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
          const bdata = balance?.toHuman();

          let frozen = BN_ZERO;
          let total = BN_ZERO;

          if (bdata) {
            // @ts-ignore
            // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
            const addressBalance = new BN(String(bdata?.balance).replaceAll(',', '') || '0');

            // @ts-ignore
            if (bdata?.isFrozen) {
              frozen = addressBalance;
            } else {
              total = addressBalance;
            }
          }

          const free = total.sub(frozen);

          return {
            address: addresses[index],
            tokenSlug: tokenInfo.slug,
            free: free.toString(),
            locked: frozen.toString(),
            state: APIItemState.READY,
            substrateInfo: {
              miscFrozen: frozen.toString(),
              reserved: '0'
            }
          };
        });

        callBack(items);
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

// eslint-disable-next-line @typescript-eslint/require-await
async function subscribeOrmlTokensPallet (addresses: string[], chain: string, api: ApiPromise, callBack: (rs: BalanceItem[]) => void): Promise<() => void> {
  const state = SWHandler.instance.state;
  const tokenTypes = [_AssetType.LOCAL];
  const tokenMap = state.getAssetByChainAndAsset(chain, tokenTypes);

  const unsubList = Object.values(tokenMap).map(async (tokenInfo) => {
    try {
      const onChainInfo = _getTokenOnChainInfo(tokenInfo);

      // Get Token Balance
      // @ts-ignore
      const unsub = await api.query.ormlTokens.accounts.multi(addresses.map((address) => [address, onChainInfo]), (balances: TokenBalanceRaw[]) => {
        const items: BalanceItem[] = balances.map((balance, index): BalanceItem => {
          const tokenBalance = {
            reserved: balance.reserved || new BN(0),
            frozen: balance.frozen || new BN(0),
            free: balance.free || new BN(0) // free is actually total balance
          };

          // free balance = total balance - frozen misc
          // locked balance = reserved + frozen misc
          const freeBalance = tokenBalance.free.sub(tokenBalance.frozen);
          const lockedBalance = tokenBalance.frozen.add(tokenBalance.reserved);

          return {
            address: addresses[index],
            tokenSlug: tokenInfo.slug,
            state: APIItemState.READY,
            free: freeBalance.toString(),
            locked: lockedBalance.toString(),
            substrateInfo: {
              reserved: tokenBalance.reserved.toString(),
              miscFrozen: tokenBalance.frozen.toString()
            }
          };
        });

        callBack(items);
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
