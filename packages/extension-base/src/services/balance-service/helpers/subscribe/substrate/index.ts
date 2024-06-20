// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { GearApi } from '@gear-js/api';
import { _AssetType, _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { APIItemState, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { SUB_TOKEN_REFRESH_BALANCE_INTERVAL } from '@subwallet/extension-base/constants';
import { _getForeignAssetPalletLockedBalance, _getForeignAssetPalletTransferable, PalletAssetsAssetAccount } from '@subwallet/extension-base/core/substrate/foreign-asset-pallet';
import { _getTotalStakeInNominationPool, PalletNominationPoolsPoolMember } from '@subwallet/extension-base/core/substrate/nominationpools-pallet';
import { _getSystemPalletTotalBalance, _getSystemPalletTransferable, FrameSystemAccountInfo } from '@subwallet/extension-base/core/substrate/system-pallet';
import { getPSP22ContractPromise } from '@subwallet/extension-base/koni/api/contract-handler/wasm';
import { getDefaultWeightV2 } from '@subwallet/extension-base/koni/api/contract-handler/wasm/utils';
import { _BALANCE_CHAIN_GROUP, _MANTA_ZK_CHAIN_GROUP, _ZK_ASSET_PREFIX } from '@subwallet/extension-base/services/chain-service/constants';
import { _EvmApi, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _checkSmartContractSupportByChain, _getChainExistentialDeposit, _getChainNativeTokenSlug, _getContractAddressOfToken, _getTokenOnChainAssetId, _getTokenOnChainInfo, _getTokenTypesSupportedByChain, _getXcmAssetMultilocation, _isBridgedToken, _isChainEvmCompatible, _isSubstrateRelayChain } from '@subwallet/extension-base/services/chain-service/utils';
import { BalanceItem, SubscribeBasePalletBalance, SubscribeSubstratePalletBalance, TokenBalanceRaw } from '@subwallet/extension-base/types';
import { filterAssetsByChainAndType, getGRC20ContractPromise, GRC20 } from '@subwallet/extension-base/utils';
import BigN from 'bignumber.js';
import { combineLatest, Observable } from 'rxjs';

import { ContractPromise } from '@polkadot/api-contract';
import { Codec } from '@polkadot/types/types';
import { BN, BN_ZERO, noop, u8aToHex } from '@polkadot/util';
import { decodeAddress } from '@polkadot/util-crypto';

import { subscribeERC20Interval } from '../evm';
import { subscribeEquilibriumTokenBalance } from './equilibrium';

export const subscribeSubstrateBalance = async (addresses: string[], chainInfo: _ChainInfo, assetMap: Record<string, _ChainAsset>, substrateApi: _SubstrateApi, evmApi: _EvmApi, callback: (rs: BalanceItem[]) => void, extrinsicType?: ExtrinsicType) => {
  let unsubNativeToken: () => void;
  let unsubLocalToken: () => void;
  let unsubEvmContractToken: () => void;
  let unsubWasmContractToken: () => void;
  let unsubBridgedToken: () => void;
  let unsubGrcToken: () => void;

  const chain = chainInfo.slug;
  const baseParams: SubscribeBasePalletBalance = {
    addresses,
    chainInfo,
    assetMap,
    callback,
    extrinsicType
  };

  const substrateParams: SubscribeSubstratePalletBalance = {
    ...baseParams,
    substrateApi: substrateApi.api
  };

  if (!_BALANCE_CHAIN_GROUP.kintsugi.includes(chain) && !_BALANCE_CHAIN_GROUP.genshiro.includes(chain) && !_BALANCE_CHAIN_GROUP.equilibrium_parachain.includes(chain)) {
    unsubNativeToken = await subscribeWithSystemAccountPallet(substrateParams);
  }

  try {
    if (_BALANCE_CHAIN_GROUP.bifrost.includes(chain)) {
      unsubLocalToken = await subscribeTokensAccountsPallet(substrateParams);
    } else if (_BALANCE_CHAIN_GROUP.kintsugi.includes(chain)) {
      unsubLocalToken = await subscribeTokensAccountsPallet({
        ...substrateParams,
        includeNativeToken: true
      });
    } else if (_BALANCE_CHAIN_GROUP.statemine.includes(chain)) {
      unsubLocalToken = await subscribeAssetsAccountPallet(substrateParams);
    } else if (_BALANCE_CHAIN_GROUP.genshiro.includes(chain) || _BALANCE_CHAIN_GROUP.equilibrium_parachain.includes(chain)) {
      unsubLocalToken = await subscribeEquilibriumTokenBalance({
        ...substrateParams,
        includeNativeToken: true
      });
    } else if (_BALANCE_CHAIN_GROUP.centrifuge.includes(chain)) {
      unsubLocalToken = await subscribeOrmlTokensPallet(substrateParams);
    }

    if (_BALANCE_CHAIN_GROUP.supportBridged.includes(chain)) {
      unsubBridgedToken = await subscribeForeignAssetBalance(substrateParams);
    }

    /**
     * Some substrate chain use evm account format but not have evm connection and support ERC20 contract,
     * so we need to check if the chain is compatible with EVM and support ERC20
     * */
    if (_isChainEvmCompatible(chainInfo) && _getTokenTypesSupportedByChain(chainInfo).includes(_AssetType.ERC20)) { // Get sub-token for EVM-compatible chains
      unsubEvmContractToken = subscribeERC20Interval({
        ...baseParams,
        evmApi: evmApi
      });
    }

    if (_checkSmartContractSupportByChain(chainInfo, _AssetType.PSP22)) { // Get sub-token for substrate-based chains
      unsubWasmContractToken = subscribePSP22Balance(substrateParams);
    }

    if (_checkSmartContractSupportByChain(chainInfo, _AssetType.GRC20)) { // Get sub-token for substrate-based chains
      unsubGrcToken = subscribeGRC20Balance(substrateParams);
    }
  } catch (err) {
    console.warn(err);
  }

  return () => {
    unsubNativeToken && unsubNativeToken();
    unsubLocalToken && unsubLocalToken();
    unsubEvmContractToken && unsubEvmContractToken();
    unsubWasmContractToken && unsubWasmContractToken();
    unsubBridgedToken && unsubBridgedToken();
    unsubGrcToken?.();
  };
};

// handler according to different logic
// eslint-disable-next-line @typescript-eslint/require-await
const subscribeWithSystemAccountPallet = async ({ addresses, callback, chainInfo, extrinsicType, substrateApi }: SubscribeSubstratePalletBalance) => {
  const chainNativeTokenSlug = _getChainNativeTokenSlug(chainInfo);

  const balanceSubscribe: Observable<Codec[]> = substrateApi.rx.query.system.account.multi(addresses);

  let poolSubscribe: Observable<Codec[]> | undefined; // add points in nomination pool back to user's balance

  if ((_isSubstrateRelayChain(chainInfo) && substrateApi.query.nominationPools)) {
    poolSubscribe = substrateApi.rx.query.nominationPools.poolMembers?.multi(addresses);
  }

  if (!poolSubscribe) {
    poolSubscribe = new Observable<Codec[]>((subscriber) => {
      subscriber.next(addresses.map(() => ({
        toPrimitive () {
          return null;
        }
      } as Codec)));
    });
  }

  const subscription = combineLatest({ balances: balanceSubscribe, poolMemberInfos: poolSubscribe }).subscribe(({ balances, poolMemberInfos }) => {
    const items: BalanceItem[] = balances.map((_balance, index) => {
      const balanceInfo = _balance.toPrimitive() as unknown as FrameSystemAccountInfo;

      const poolMemberInfo = poolMemberInfos[index].toPrimitive() as unknown as PalletNominationPoolsPoolMember;

      const nominationPoolBalance = poolMemberInfo ? _getTotalStakeInNominationPool(poolMemberInfo) : new BigN(0);

      const transferableBalance = _getSystemPalletTransferable(balanceInfo, _getChainExistentialDeposit(chainInfo), extrinsicType);
      const totalBalance = _getSystemPalletTotalBalance(balanceInfo);
      const totalLockedFromTransfer = new BigN(totalBalance).minus(transferableBalance).plus(nominationPoolBalance);

      return ({
        address: addresses[index],
        tokenSlug: chainNativeTokenSlug,
        free: transferableBalance,
        locked: totalLockedFromTransfer.toFixed(),
        state: APIItemState.READY,
        metadata: balanceInfo
      });
    });

    callback(items);
  });

  return () => {
    subscription.unsubscribe();
  };
};

const subscribeForeignAssetBalance = async ({ addresses, assetMap, callback, chainInfo, substrateApi }: SubscribeSubstratePalletBalance) => {
  const chain = chainInfo.slug;
  const tokenMap = filterAssetsByChainAndType(assetMap, chain, [_AssetType.LOCAL]);

  // @ts-ignore
  const unsubList = await Promise.all(Object.values(tokenMap).map(async (tokenInfo) => {
    try {
      const isBridgedToken = _isBridgedToken(tokenInfo);

      if (isBridgedToken) {
        const assetLocation = _getTokenOnChainInfo(tokenInfo) || _getXcmAssetMultilocation(tokenInfo);

        return await substrateApi.query.foreignAssets.account.multi(addresses.map((address) => [assetLocation, address]), (balances) => {
          const items: BalanceItem[] = balances.map((balance, index): BalanceItem => {
            const accountInfo = balance?.toPrimitive() as PalletAssetsAssetAccount;

            return {
              address: addresses[index],
              tokenSlug: tokenInfo.slug,
              free: accountInfo ? _getForeignAssetPalletTransferable(accountInfo).toString() : '0',
              locked: accountInfo ? _getForeignAssetPalletLockedBalance(accountInfo).toString() : '0',
              state: APIItemState.READY
            };
          });

          callback(items);
        });
      }
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
};

function extractOkResponse<T> (response: Record<string, T>): T | undefined {
  if ('ok' in response) {
    return response.ok;
  }

  if ('Ok' in response) {
    return response.Ok;
  }

  return undefined;
}

const subscribePSP22Balance = ({ addresses, assetMap, callback, chainInfo, substrateApi }: SubscribeSubstratePalletBalance) => {
  const chain = chainInfo.slug;
  const psp22ContractMap = {} as Record<string, ContractPromise>;
  const tokenList = filterAssetsByChainAndType(assetMap, chain, [_AssetType.PSP22]);

  Object.entries(tokenList).forEach(([slug, tokenInfo]) => {
    psp22ContractMap[slug] = getPSP22ContractPromise(substrateApi, _getContractAddressOfToken(tokenInfo));
  });

  const getTokenBalances = () => {
    Object.values(tokenList).map(async (tokenInfo) => {
      try {
        const contract = psp22ContractMap[tokenInfo.slug];
        const balances: BalanceItem[] = await Promise.all(addresses.map(async (address): Promise<BalanceItem> => {
          try {
            const _balanceOf = await contract.query['psp22::balanceOf'](address, { gasLimit: getDefaultWeightV2(substrateApi) }, address);
            const balanceObj = _balanceOf?.output?.toPrimitive() as Record<string, any>;
            const freeResponse = extractOkResponse(balanceObj) as number | string;
            const free: string = freeResponse ? new BigN(freeResponse).toString() : '0';

            return {
              address: address,
              tokenSlug: tokenInfo.slug,
              free,
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

        callback(balances);
      } catch (err) {
        console.warn(tokenInfo.slug, err); // TODO: error createType
      }
    });
  };

  getTokenBalances();

  const interval = setInterval(getTokenBalances, SUB_TOKEN_REFRESH_BALANCE_INTERVAL);

  return () => {
    clearInterval(interval);
  };
};

const subscribeTokensAccountsPallet = async ({ addresses, assetMap, callback, chainInfo, includeNativeToken, substrateApi }: SubscribeSubstratePalletBalance) => {
  const chain = chainInfo.slug;
  const tokenTypes = includeNativeToken ? [_AssetType.NATIVE, _AssetType.LOCAL] : [_AssetType.LOCAL];
  const tokenMap = filterAssetsByChainAndType(assetMap, chain, tokenTypes);

  const unsubList = await Promise.all(Object.values(tokenMap).map(async (tokenInfo) => {
    try {
      const onChainInfo = _getTokenOnChainInfo(tokenInfo);
      const assetId = _getTokenOnChainAssetId(tokenInfo);

      // Get Token Balance
      // @ts-ignore
      return await substrateApi.query.tokens.accounts.multi(addresses.map((address) => [address, onChainInfo || assetId]), (balances: TokenBalanceRaw[]) => {
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
            locked: lockedBalance.toString()
          };
        });

        callback(items);
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
};

const subscribeAssetsAccountPallet = async ({ addresses, assetMap, callback, chainInfo, includeNativeToken, substrateApi }: SubscribeSubstratePalletBalance) => {
  const chain = chainInfo.slug;
  const tokenMap = filterAssetsByChainAndType(assetMap, chain, [_AssetType.LOCAL]);

  Object.values(tokenMap).forEach((token) => {
    if (_MANTA_ZK_CHAIN_GROUP.includes(token.originChain) && token.symbol.startsWith(_ZK_ASSET_PREFIX)) {
      delete tokenMap[token.slug];
    }
  });

  const unsubList = await Promise.all(Object.values(tokenMap).map(async (tokenInfo) => {
    try {
      const assetIndex = _getTokenOnChainAssetId(tokenInfo);

      if (assetIndex === '-1') {
        return undefined;
      }

      // Get Token Balance
      return await substrateApi.query.assets.account.multi(addresses.map((address) => [assetIndex, address]), (balances) => {
        const items: BalanceItem[] = balances.map((balance, index): BalanceItem => {
          const bdata = balance?.toPrimitive();

          let frozen = BN_ZERO;
          let total = BN_ZERO;

          if (bdata) {
            // @ts-ignore
            const addressBalance = new BN(String(bdata?.balance).replaceAll(',', '') || '0');

            // @ts-ignore
            if (bdata?.isFrozen || ['Blocked', 'Frozen'].includes(bdata?.status as string)) { // Status 'Frozen' and 'Blocked' are for frozen balance
              frozen = addressBalance;
            }

            total = addressBalance;
          }

          const free = total.sub(frozen);

          return {
            address: addresses[index],
            tokenSlug: tokenInfo.slug,
            free: free.toString(),
            locked: frozen.toString(),
            state: APIItemState.READY
          };
        });

        callback(items);
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
};

// eslint-disable-next-line @typescript-eslint/require-await
const subscribeOrmlTokensPallet = async ({ addresses, assetMap, callback, chainInfo, substrateApi }: SubscribeSubstratePalletBalance): Promise<() => void> => {
  const chain = chainInfo.slug;
  const tokenTypes = [_AssetType.LOCAL];
  const tokenMap = filterAssetsByChainAndType(assetMap, chain, tokenTypes);

  const unsubList = Object.values(tokenMap).map(async (tokenInfo) => {
    try {
      const onChainInfo = _getTokenOnChainInfo(tokenInfo);

      // Get Token Balance
      // @ts-ignore
      const unsub = await substrateApi.query.ormlTokens.accounts.multi(addresses.map((address) => [address, onChainInfo]), (balances: TokenBalanceRaw[]) => {
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
            locked: lockedBalance.toString()
          };
        });

        callback(items);
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
};

const subscribeGRC20Balance = ({ addresses, assetMap, callback, chainInfo, substrateApi }: SubscribeSubstratePalletBalance): VoidCallback => {
  if (!(substrateApi instanceof GearApi)) {
    console.warn('Cannot subscribe GRC20 balance without GearApi instance');

    return noop;
  }

  const chain = chainInfo.slug;
  const psp22ContractMap = {} as Record<string, GRC20>;
  const tokenList = filterAssetsByChainAndType(assetMap, chain, [_AssetType.GRC20]);

  Object.entries(tokenList).forEach(([slug, tokenInfo]) => {
    psp22ContractMap[slug] = getGRC20ContractPromise(substrateApi, _getContractAddressOfToken(tokenInfo));
  });

  const getTokenBalances = () => {
    Object.values(tokenList).map(async (tokenInfo) => {
      try {
        const contract = psp22ContractMap[tokenInfo.slug];
        const balances: BalanceItem[] = await Promise.all(addresses.map(async (address): Promise<BalanceItem> => {
          try {
            const actor = u8aToHex(decodeAddress(address));
            const _balanceOf = await contract.balanceOf(actor, address);

            return {
              address: address,
              tokenSlug: tokenInfo.slug,
              free: _balanceOf.toString(10),
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

        callback(balances);
      } catch (err) {
        console.warn(tokenInfo.slug, err); // TODO: error createType
      }
    });
  };

  getTokenBalances();

  const interval = setInterval(getTokenBalances, SUB_TOKEN_REFRESH_BALANCE_INTERVAL);

  return () => {
    clearInterval(interval);
  };
};
