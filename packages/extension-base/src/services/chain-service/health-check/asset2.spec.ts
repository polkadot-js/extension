// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainAssetMap, ChainInfoMap } from '@subwallet/chain-list';
import { _AssetType, _ChainAsset, _ChainStatus } from '@subwallet/chain-list/types';
import { EvmApi } from '@subwallet/extension-base/services/chain-service/handler/EvmApi';
import { checkEvmProvider, checkSubstrateProvider } from '@subwallet/extension-base/services/chain-service/health-check/chain2.spec';
import { _getContractAddressOfToken, _getTokenOnChainAssetId } from '@subwallet/extension-base/services/chain-service/utils';
import BigN from 'bignumber.js';

import { ApiPromise } from '@polkadot/api';

import { chainProvider } from './constants';
import { AssetSpec, getErc20AssetInfo, getEvmNativeInfo, getLocalAssetInfo, getPsp22AssetInfo, getSubstrateNativeInfo, validateAsset } from './utils';

jest.setTimeout(3 * 60 * 60 * 1000);

const ignoreChains: string[] = ['interlay', 'kintsugi', 'kintsugi_test', 'avail_mainnet', 'avail_mainnet', 'peaq'];
const onlyChains: string[] = []; // check only these chains if set;
const CASE_TIME_OUT = 30000;

describe('test chain asset', () => {
  const chainAssets = getChainAssetInfos();
  const assetByChain: Record<string, _ChainAsset[]> = {};

  for (const chainAsset of chainAssets) {
    const originChain = chainAsset.originChain;

    if (assetByChain[originChain]) {
      assetByChain[originChain].push(chainAsset);
    } else {
      assetByChain[originChain] = [chainAsset];
    }
  }

  for (const [chain, assets] of Object.entries(assetByChain)) {
    console.log('[i] Start chain:', chain);
    const chainInfo = ChainInfoMap[chain];

    const providerIndex = chainProvider[chain] || chainProvider.default;
    const [key, provider] = Object.entries(chainInfo.providers)[providerIndex];

    if (chainInfo.substrateInfo) {
      test.each(assets)('validate asset %j', async (asset) => {
        console.log('[i] Start asset:', asset.slug);
        const [isProviderMatchChain, api] = await checkSubstrateProvider(chainInfo, provider) as [boolean, ApiPromise | null];

        if (isProviderMatchChain && api) {
          let assetInfo: AssetSpec | undefined;

          if (asset.assetType === _AssetType.NATIVE) {
            assetInfo = await getSubstrateNativeInfo(api);
          } else if (asset.assetType === _AssetType.LOCAL) {
            assetInfo = await getLocalAssetInfo(chain, asset, api);

            if (['moonbeam', 'moonriver', 'moonbase'].includes(chain)) {
              const assetId = new BigN(_getTokenOnChainAssetId(asset));
              const address = _getContractAddressOfToken(asset);
              const _suffix = assetId.toString(16);
              const suffix = _suffix.length % 2 === 0 ? _suffix : '0' + _suffix;
              const calcAddress = '0xFFFFFFFF' + suffix;

              console.log(`[i] genesisHash: address - ${address.toLocaleLowerCase()}, re-calculate address - ${calcAddress.toLocaleLowerCase()}`);

              expect(address.toLocaleLowerCase() === calcAddress.toLocaleLowerCase());
            }
          } else if (asset.assetType === _AssetType.PSP22) {
            assetInfo = await getPsp22AssetInfo(asset, api);
          }

          if (assetInfo) {
            expect(validateAsset(assetInfo, asset)).toEqual(true);
          }
        }
      }, CASE_TIME_OUT);
    }

    if (chainInfo.evmInfo) {
      test.each(assets)('validate asset %j', async (asset) => {
        console.log('[i] Start asset:', asset.slug);
        const [isProviderMatchChain, api] = await checkEvmProvider(chainInfo, provider, key) as [boolean, EvmApi | null];

        if (isProviderMatchChain && api) {
          let assetInfo: AssetSpec | undefined;

          if (asset.assetType === _AssetType.NATIVE) {
            assetInfo = await getEvmNativeInfo(api);
          } else if (asset.assetType === _AssetType.ERC20) {
            assetInfo = await getErc20AssetInfo(asset, api);
          }

          if (assetInfo) {
            expect(validateAsset(assetInfo, asset)).toEqual(true);
          }
        }
      }, CASE_TIME_OUT);
    }
  }
});

function getChainAssetInfos () {
  if (onlyChains.length > 0) {
    return Object.values(ChainAssetMap).filter((info) =>
      ChainInfoMap[info.originChain].chainStatus === _ChainStatus.ACTIVE && onlyChains.includes(info.originChain)
    );
  }

  return Object.values(ChainAssetMap).filter((info) =>
    ChainInfoMap[info.originChain].chainStatus === _ChainStatus.ACTIVE && !ignoreChains.includes(info.originChain)
  );
}
