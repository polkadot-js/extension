// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainAssetMap, ChainInfoMap } from '@subwallet/chain-list';
import { _AssetType, _ChainAsset, _ChainStatus } from '@subwallet/chain-list/types';
import { _EvmApi } from '@subwallet/extension-base/services/chain-service/types';
import { _getContractAddressOfToken, _getTokenOnChainAssetId } from '@subwallet/extension-base/services/chain-service/utils';
import BigN from 'bignumber.js';

import { ApiPromise } from '@polkadot/api';

import { chainProvider, chainProviderBackup } from './constants';
import { AssetSpec, compareAsset, getErc20AssetInfo, getEvmNativeInfo, getLocalAssetInfo, getPsp22AssetInfo, getSubstrateNativeInfo, handleEvmProvider, handleSubstrateProvider } from './utils';

jest.setTimeout(3 * 60 * 60 * 1000);

const ignoreChains: string[] = ['interlay', 'kintsugi', 'kintsugi_test', 'avail_mainnet'];

describe('test chain asset', () => {
  it('chain asset', async () => {
    const chainAssets = Object.values(ChainAssetMap).filter((info) =>
      ChainInfoMap[info.originChain].chainStatus === _ChainStatus.ACTIVE &&
      !ignoreChains.includes(info.originChain)
    );
    const assetByChain: Record<string, _ChainAsset[]> = {};
    const errorChain: Record<string, string> = {};
    const errorAsset: Record<string, Record<string, string>> = {};

    for (const chainAsset of chainAssets) {
      const originChain = chainAsset.originChain;

      if (assetByChain[originChain]) {
        assetByChain[originChain].push(chainAsset);
      } else {
        assetByChain[originChain] = [chainAsset];
      }
    }

    for (const [chain, assets] of Object.entries(assetByChain)) {
      console.log('start', chain);
      const chainInfo = ChainInfoMap[chain];
      const providerIndex = chainProvider[chain] || chainProvider.default;
      const [key, provider] = Object.entries(chainInfo.providers)[providerIndex];

      const onTimeout = () => {
        errorChain[chain] = 'Timeout';
      };

      // eslint-disable-next-line @typescript-eslint/require-await
      const onError = async (message: string) => {
        errorChain[chain] = message;
      };

      const onSuccessSubstrate = async (api: ApiPromise) => {
        const tmpErrorAsset: Record<string, string> = {};

        for (const asset of assets) {
          let assetInfo: AssetSpec | undefined;
          const errors: string[] = [];

          try {
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

                if (address.toLocaleLowerCase() !== calcAddress.toLocaleLowerCase()) {
                  errors.push(`Wrong contract address: current - ${address}, onChain - ${calcAddress}`);
                }
              }
            } else if (asset.assetType === _AssetType.PSP22) {
              assetInfo = await getPsp22AssetInfo(asset, api);
            } else if ([_AssetType.ERC721, _AssetType.ERC20, _AssetType.UNKNOWN, _AssetType.PSP34].includes(asset.assetType)) {
              continue;
            }

            if (assetInfo) {
              compareAsset(assetInfo, asset, errors);
            } else {
              errors.push('Cannot get info');
            }

            if (errors.length) {
              tmpErrorAsset[asset.slug] = errors.join(' --- ');
            }
          } catch (e) {
            console.error(asset.slug, e);
            tmpErrorAsset[asset.slug] = 'Fail to get info';
          }
        }

        if (Object.keys(tmpErrorAsset).length) {
          errorAsset[chain] = tmpErrorAsset;
        }
      };

      const onSuccessEvm = async (api: _EvmApi) => {
        const tmpErrorAsset: Record<string, string> = {};

        for (const asset of assets) {
          let assetInfo: AssetSpec | undefined;

          try {
            if (asset.assetType === _AssetType.NATIVE) {
              assetInfo = await getEvmNativeInfo(api);
            } else if (asset.assetType === _AssetType.ERC20) {
              assetInfo = await getErc20AssetInfo(asset, api);
            } else if ([_AssetType.PSP34, _AssetType.PSP22, _AssetType.UNKNOWN, _AssetType.ERC721, _AssetType.LOCAL].includes(asset.assetType)) {
              continue;
            }

            const errors: string[] = [];

            if (assetInfo) {
              compareAsset(assetInfo, asset, errors);
            } else {
              errors.push('Cannot get info');
            }

            if (errors.length) {
              tmpErrorAsset[asset.slug] = errors.join(' --- ');
            }
          } catch (e) {
            console.error(asset.slug, e);
            tmpErrorAsset[asset.slug] = 'Fail to get info';
          }
        }

        if (Object.keys(tmpErrorAsset).length) {
          errorAsset[chain] = tmpErrorAsset;
        }
      };

      if (chainInfo.substrateInfo) {
        await handleSubstrateProvider({
          provider,
          chain,
          key,
          onSuccess: onSuccessSubstrate,
          awaitDisconnect: false,
          onError,
          onTimeout,
          genHash: ''
        });
      }

      if (chainInfo.evmInfo) {
        let _key = key;
        let _provider = provider;

        if (chainInfo.substrateInfo) {
          const _providerIndex = chainProviderBackup[chain] || chainProviderBackup.default;
          const length = Object.keys(chainInfo.providers).length;
          const providerIndex = _providerIndex >= length ? length - 1 : _providerIndex;

          [_key, _provider] = Object.entries(chainInfo.providers)[providerIndex];
        }

        await handleEvmProvider({
          provider: _provider,
          chain,
          key: _key,
          onSuccess: onSuccessEvm,
          awaitDisconnect: false,
          onError,
          onTimeout,
          chainId: chainInfo.evmInfo?.evmChainId || 0
        });
      }
    }

    console.log('result errorAsset', errorAsset);
    console.log('result errorChain', errorChain);
  });
});
