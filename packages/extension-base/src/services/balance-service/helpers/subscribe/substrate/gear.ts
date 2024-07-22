// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { GearApi } from '@gear-js/api';
import { _AssetType } from '@subwallet/chain-list/types';
import { APIItemState } from '@subwallet/extension-base/background/KoniTypes';
import { SUB_TOKEN_REFRESH_BALANCE_INTERVAL } from '@subwallet/extension-base/constants';
import { _getContractAddressOfToken } from '@subwallet/extension-base/services/chain-service/utils';
import { BalanceItem, SubscribeSubstratePalletBalance } from '@subwallet/extension-base/types';
import { filterAssetsByChainAndType, getGRC20ContractPromise, getVFTContractPromise, GRC20, VFT } from '@subwallet/extension-base/utils';

import { noop, u8aToHex } from '@polkadot/util';
import { decodeAddress } from '@polkadot/util-crypto';

export const subscribeGRC20Balance = ({ addresses,
  assetMap,
  callback,
  chainInfo,
  substrateApi }: SubscribeSubstratePalletBalance): VoidCallback => {
  if (!(substrateApi instanceof GearApi)) {
    console.warn('Cannot subscribe GRC20 balance without GearApi instance');

    return noop;
  }

  const chain = chainInfo.slug;
  const grc20ContractMap = {} as Record<string, GRC20>;
  const tokenList = filterAssetsByChainAndType(assetMap, chain, [_AssetType.GRC20]);

  Object.entries(tokenList).forEach(([slug, tokenInfo]) => {
    grc20ContractMap[slug] = getGRC20ContractPromise(substrateApi, _getContractAddressOfToken(tokenInfo));
  });

  const getTokenBalances = () => {
    Object.values(tokenList).map(async (tokenInfo) => {
      try {
        const contract = grc20ContractMap[tokenInfo.slug];
        const balances: BalanceItem[] = await Promise.all(addresses.map(async (address): Promise<BalanceItem> => {
          try {
            const actor = u8aToHex(decodeAddress(address));
            const _balanceOf = await contract.service.balanceOf(actor, address);

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

export const subscribeVftBalance = ({ addresses,
  assetMap,
  callback,
  chainInfo,
  substrateApi }: SubscribeSubstratePalletBalance): VoidCallback => {
  if (!(substrateApi instanceof GearApi)) {
    console.warn('Cannot subscribe VFT balance without GearApi instance');

    return noop;
  }

  const chain = chainInfo.slug;
  const vftContractMap = {} as Record<string, VFT>;
  const tokenList = filterAssetsByChainAndType(assetMap, chain, [_AssetType.VFT]);

  Object.entries(tokenList).forEach(([slug, tokenInfo]) => {
    vftContractMap[slug] = getVFTContractPromise(substrateApi, _getContractAddressOfToken(tokenInfo));
  });

  const getTokenBalances = () => {
    Object.values(tokenList).map(async (tokenInfo) => {
      try {
        const contract = vftContractMap[tokenInfo.slug];
        const balances: BalanceItem[] = await Promise.all(addresses.map(async (address): Promise<BalanceItem> => {
          try {
            const actor = u8aToHex(decodeAddress(address));
            const _balanceOf = await contract.service.balanceOf(actor, address);

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
