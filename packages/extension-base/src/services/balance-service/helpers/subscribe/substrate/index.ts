// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { _AssetType, _ChainAsset, _ChainInfo } from '@subwallet/chain-list/types';
import { APIItemState, ExtrinsicType } from '@subwallet/extension-base/background/KoniTypes';
import { SUB_TOKEN_REFRESH_BALANCE_INTERVAL } from '@subwallet/extension-base/constants';
import { _getAssetsPalletLocked, _getAssetsPalletTransferable } from '@subwallet/extension-base/core/substrate/assets-pallet';
import { _getForeignAssetPalletLockedBalance, _getForeignAssetPalletTransferable } from '@subwallet/extension-base/core/substrate/foreign-asset-pallet';
import { _getTotalStakeInNominationPool } from '@subwallet/extension-base/core/substrate/nominationpools-pallet';
import { _getOrmlTokensPalletLockedBalance, _getOrmlTokensPalletTransferable } from '@subwallet/extension-base/core/substrate/ormlTokens-pallet';
import { _getSystemPalletTotalBalance, _getSystemPalletTransferable } from '@subwallet/extension-base/core/substrate/system-pallet';
import { _getTokensPalletLocked, _getTokensPalletTransferable } from '@subwallet/extension-base/core/substrate/tokens-pallet';
import { FrameSystemAccountInfo, OrmlTokensAccountData, PalletAssetsAssetAccount, PalletAssetsAssetAccountWithStatus, PalletNominationPoolsPoolMember } from '@subwallet/extension-base/core/substrate/types';
import { _adaptX1Interior } from '@subwallet/extension-base/core/substrate/xcm-parser';
import { getPSP22ContractPromise } from '@subwallet/extension-base/koni/api/contract-handler/wasm';
import { getDefaultWeightV2 } from '@subwallet/extension-base/koni/api/contract-handler/wasm/utils';
import { _BALANCE_CHAIN_GROUP, _MANTA_ZK_CHAIN_GROUP, _ZK_ASSET_PREFIX } from '@subwallet/extension-base/services/chain-service/constants';
import { _EvmApi, _SubstrateAdapterSubscriptionArgs, _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { _checkSmartContractSupportByChain, _getAssetExistentialDeposit, _getChainExistentialDeposit, _getChainNativeTokenSlug, _getContractAddressOfToken, _getTokenOnChainAssetId, _getTokenOnChainInfo, _getTokenTypesSupportedByChain, _getXcmAssetMultilocation, _isBridgedToken, _isChainEvmCompatible } from '@subwallet/extension-base/services/chain-service/utils';
import { BalanceItem, SubscribeBasePalletBalance, SubscribeSubstratePalletBalance } from '@subwallet/extension-base/types';
import { filterAssetsByChainAndType } from '@subwallet/extension-base/utils';
import BigN from 'bignumber.js';

import { ContractPromise } from '@polkadot/api-contract';

import { subscribeERC20Interval } from '../evm';
import { subscribeEquilibriumTokenBalance } from './equilibrium';
import { subscribeGRC20Balance, subscribeVftBalance } from './gear';

export const subscribeSubstrateBalance = async (addresses: string[], chainInfo: _ChainInfo, assetMap: Record<string, _ChainAsset>, substrateApi: _SubstrateApi, evmApi: _EvmApi, callback: (rs: BalanceItem[]) => void, extrinsicType?: ExtrinsicType) => {
  let unsubNativeToken: () => void;
  let unsubLocalToken: () => void;
  let unsubEvmContractToken: () => void;
  let unsubWasmContractToken: () => void;
  let unsubBridgedToken: () => void;
  let unsubGrcToken: () => void;
  let unsubVftToken: () => void;

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
    substrateApi
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

    if (_checkSmartContractSupportByChain(chainInfo, _AssetType.VFT)) { // Get sub-token for substrate-based chains
      unsubVftToken = subscribeVftBalance(substrateParams);
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
    unsubVftToken?.();
  };
};

// handler according to different logic
// eslint-disable-next-line @typescript-eslint/require-await
const subscribeWithSystemAccountPallet = async ({ addresses, callback, chainInfo, extrinsicType, substrateApi }: SubscribeSubstratePalletBalance) => {
  const systemAccountKey = 'query_system_account';
  const poolMembersKey = 'query_nominationPools_poolMembers';

  const isNominationPoolMigrated = !!substrateApi.api.tx?.nominationPools?.migrateDelegation;

  const params: _SubstrateAdapterSubscriptionArgs[] = [
    {
      section: 'query',
      module: systemAccountKey.split('_')[1],
      method: systemAccountKey.split('_')[2],
      args: addresses
    }
  ];

  if (!isNominationPoolMigrated) {
    params.push(
      {
        section: 'query',
        module: poolMembersKey.split('_')[1],
        method: poolMembersKey.split('_')[2],
        args: addresses
      }
    );
  }

  const subscription = substrateApi.subscribeDataWithMulti(params, (rs) => {
    const balances = rs[systemAccountKey];
    const poolMemberInfos = rs[poolMembersKey];

    const items: BalanceItem[] = balances.map((_balance, index) => {
      const balanceInfo = _balance as unknown as FrameSystemAccountInfo;

      const transferableBalance = _getSystemPalletTransferable(balanceInfo, _getChainExistentialDeposit(chainInfo), extrinsicType);
      const totalBalance = _getSystemPalletTotalBalance(balanceInfo);
      let totalLockedFromTransfer = totalBalance - transferableBalance;

      if (!isNominationPoolMigrated) {
        const poolMemberInfo = poolMemberInfos[index] as unknown as PalletNominationPoolsPoolMember;

        const nominationPoolBalance = poolMemberInfo ? _getTotalStakeInNominationPool(poolMemberInfo) : BigInt(0);

        totalLockedFromTransfer += nominationPoolBalance;
      }

      return ({
        address: addresses[index],
        tokenSlug: _getChainNativeTokenSlug(chainInfo),
        free: transferableBalance.toString(),
        locked: totalLockedFromTransfer.toString(),
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

const subscribeForeignAssetBalance = async ({ addresses, assetMap, callback, chainInfo, extrinsicType, substrateApi }: SubscribeSubstratePalletBalance) => {
  const foreignAssetsAccountKey = 'query_foreignAssets_account';
  const tokenMap = filterAssetsByChainAndType(assetMap, chainInfo.slug, [_AssetType.LOCAL]);

  const unsubList = await Promise.all(Object.values(tokenMap).map((tokenInfo) => {
    try {
      if (_isBridgedToken(tokenInfo)) {
        const params: _SubstrateAdapterSubscriptionArgs[] = [
          {
            section: 'query',
            module: foreignAssetsAccountKey.split('_')[1],
            method: foreignAssetsAccountKey.split('_')[2],
            args: addresses.map((address) => [_getTokenOnChainInfo(tokenInfo) || _adaptX1Interior(_getXcmAssetMultilocation(tokenInfo), 3), address])
          }
        ];

        return substrateApi.subscribeDataWithMulti(params, (rs) => {
          const balances = rs[foreignAssetsAccountKey];
          const items: BalanceItem[] = balances.map((_balance, index): BalanceItem => {
            const balanceInfo = _balance as unknown as PalletAssetsAssetAccountWithStatus | undefined;

            if (!balanceInfo) { // no balance info response
              return {
                address: addresses[index],
                tokenSlug: tokenInfo.slug,
                free: '0',
                locked: '0',
                state: APIItemState.READY
              };
            }

            const transferableBalance = _getForeignAssetPalletTransferable(balanceInfo, _getAssetExistentialDeposit(tokenInfo), extrinsicType);
            const totalLockedFromTransfer = _getForeignAssetPalletLockedBalance(balanceInfo);

            return {
              address: addresses[index],
              tokenSlug: tokenInfo.slug,
              free: transferableBalance.toString(),
              locked: totalLockedFromTransfer.toString(),
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
      unsub && unsub.unsubscribe();
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
    psp22ContractMap[slug] = getPSP22ContractPromise(substrateApi.api, _getContractAddressOfToken(tokenInfo));
  });

  const getTokenBalances = () => {
    Object.values(tokenList).map(async (tokenInfo) => {
      try {
        const contract = psp22ContractMap[tokenInfo.slug];
        const balances: BalanceItem[] = await Promise.all(addresses.map(async (address): Promise<BalanceItem> => {
          try {
            const _balanceOf = await contract.query['psp22::balanceOf'](address, { gasLimit: getDefaultWeightV2(substrateApi.api) }, address);
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

const subscribeTokensAccountsPallet = async ({ addresses, assetMap, callback, chainInfo, extrinsicType, includeNativeToken, substrateApi }: SubscribeSubstratePalletBalance) => {
  const tokensAccountsKey = 'query_tokens_accounts';

  const tokenTypes = includeNativeToken ? [_AssetType.NATIVE, _AssetType.LOCAL] : [_AssetType.LOCAL];
  const tokenMap = filterAssetsByChainAndType(assetMap, chainInfo.slug, tokenTypes);

  const unsubList = await Promise.all(Object.values(tokenMap).map((tokenInfo) => {
    try {
      const params: _SubstrateAdapterSubscriptionArgs[] = [
        {
          section: 'query',
          module: tokensAccountsKey.split('_')[1],
          method: tokensAccountsKey.split('_')[2],
          args: addresses.map((address) => [address, _getTokenOnChainInfo(tokenInfo) || _getTokenOnChainAssetId(tokenInfo)])
        }
      ];

      return substrateApi.subscribeDataWithMulti(params, (rs) => {
        const balances = rs[tokensAccountsKey];
        const items: BalanceItem[] = balances.map((_balance, index): BalanceItem => {
          const balanceInfo = _balance as unknown as OrmlTokensAccountData;
          const transferableBalance = _getTokensPalletTransferable(balanceInfo, _getAssetExistentialDeposit(tokenInfo), extrinsicType);
          const totalLockedFromTransfer = _getTokensPalletLocked(balanceInfo);

          return {
            address: addresses[index],
            tokenSlug: tokenInfo.slug,
            state: APIItemState.READY,
            free: transferableBalance.toString(),
            locked: totalLockedFromTransfer.toString()
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
      unsub && unsub.unsubscribe();
    });
  };
};

const subscribeAssetsAccountPallet = async ({ addresses, assetMap, callback, chainInfo, extrinsicType, substrateApi }: SubscribeSubstratePalletBalance) => {
  const assetsAccountKey = 'query_assets_account';

  const tokenMap = filterAssetsByChainAndType(assetMap, chainInfo.slug, [_AssetType.LOCAL]);

  Object.values(tokenMap).forEach((token) => {
    if (_MANTA_ZK_CHAIN_GROUP.includes(token.originChain) && token.symbol.startsWith(_ZK_ASSET_PREFIX)) {
      delete tokenMap[token.slug];
    }
  });

  const unsubList = await Promise.all(Object.values(tokenMap).map((tokenInfo) => {
    try {
      const assetIndex = _getTokenOnChainAssetId(tokenInfo);

      if (assetIndex === '-1') {
        return undefined;
      }

      const params: _SubstrateAdapterSubscriptionArgs[] = [
        {
          section: 'query',
          module: assetsAccountKey.split('_')[1],
          method: assetsAccountKey.split('_')[2],
          args: addresses.map((address) => [assetIndex, address])
        }
      ];

      // Get Token Balance
      return substrateApi.subscribeDataWithMulti(params, (rs) => {
        const balances = rs[assetsAccountKey];
        const items: BalanceItem[] = balances.map((_balance, index): BalanceItem => {
          const balanceInfo = _balance as unknown as PalletAssetsAssetAccount | undefined;

          if (!balanceInfo) { // no balance info response
            return {
              address: addresses[index],
              tokenSlug: tokenInfo.slug,
              free: '0',
              locked: '0',
              state: APIItemState.READY
            };
          }

          const transferableBalance = _getAssetsPalletTransferable(balanceInfo, _getAssetExistentialDeposit(tokenInfo), extrinsicType);
          const totalLockedFromTransfer = _getAssetsPalletLocked(balanceInfo);

          return {
            address: addresses[index],
            tokenSlug: tokenInfo.slug,
            free: transferableBalance.toString(),
            locked: totalLockedFromTransfer.toString(),
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
      unsub && unsub.unsubscribe();
    });
  };
};

// eslint-disable-next-line @typescript-eslint/require-await
const subscribeOrmlTokensPallet = async ({ addresses, assetMap, callback, chainInfo, extrinsicType, substrateApi }: SubscribeSubstratePalletBalance): Promise<() => void> => {
  const ormlTokensAccountsKey = 'query_ormlTokens_accounts';
  const tokenMap = filterAssetsByChainAndType(assetMap, chainInfo.slug, [_AssetType.LOCAL]);

  const unsubList = Object.values(tokenMap).map((tokenInfo) => {
    try {
      const params: _SubstrateAdapterSubscriptionArgs[] = [
        {
          section: 'query',
          module: ormlTokensAccountsKey.split('_')[1],
          method: ormlTokensAccountsKey.split('_')[2],
          args: addresses.map((address) => [address, _getTokenOnChainInfo(tokenInfo)])
        }
      ];

      // @ts-ignore
      return substrateApi.subscribeDataWithMulti(params, (rs) => {
        const balances = rs[ormlTokensAccountsKey];
        const items: BalanceItem[] = balances.map((_balance, index): BalanceItem => {
          const balanceInfo = _balance as unknown as OrmlTokensAccountData;
          const transferableBalance = _getOrmlTokensPalletTransferable(balanceInfo, _getAssetExistentialDeposit(tokenInfo), extrinsicType);
          const totalLockedFromTransfer = _getOrmlTokensPalletLockedBalance(balanceInfo);

          return {
            address: addresses[index],
            tokenSlug: tokenInfo.slug,
            state: APIItemState.READY,
            free: transferableBalance.toString(),
            locked: totalLockedFromTransfer.toString()
          };
        });

        callback(items);
      });
    } catch (err) {
      console.warn(err);

      return undefined;
    }
  });

  return () => {
    unsubList.forEach((unsub) => {
      unsub && unsub.unsubscribe();
    });
  };
};
