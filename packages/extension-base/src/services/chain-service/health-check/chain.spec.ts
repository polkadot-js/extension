// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainInfoMap } from '@subwallet/chain-list';
import { _ChainStatus, _SubstrateChainType } from '@subwallet/chain-list/types';
import { _EvmApi } from '@subwallet/extension-base/services/chain-service/types';

import { ApiPromise } from '@polkadot/api';

import { chainProvider, chainProviderBackup } from './constants';
import { compareNativeAsset, getEvmNativeInfo, getSubstrateNativeInfo, handleEvmProvider, handleSubstrateProvider } from './utils';

jest.setTimeout(3 * 60 * 60 * 1000);

const ignoreChains: string[] = ['interlay', 'kintsugi', 'kintsugi_test', 'avail_mainnet'];
// const onlyChains: string[] = ['subsocial_x', 'crabParachain', 'pangolin', 'acala_testnet'];

describe('test chain', () => {
  it('chain', async () => {
    const chainInfos = Object.values(ChainInfoMap).filter((info) =>
      info.chainStatus === _ChainStatus.ACTIVE &&
      !ignoreChains.includes(info.slug)
      // && onlyChains.includes(info.slug)
    );
    const errorChain: Record<string, string[]> = {};

    for (const chainInfo of chainInfos) {
      const chain = chainInfo.slug;

      console.log('start', chain);

      const providerIndex = chainProvider[chain] || chainProvider.default;
      const [key, provider] = Object.entries(chainInfo.providers)[providerIndex];
      const errors: string[] = [];

      const onTimeout = () => {
        errors.push('Timeout');
      };

      // eslint-disable-next-line @typescript-eslint/require-await
      const onError = async (message: string) => {
        errors.push(message);
      };

      const onSuccessSubstrate = async (api: ApiPromise) => {
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const substrateInfo = chainInfo.substrateInfo!;
        const ss58Prefix = api.consts.system.ss58Prefix.toPrimitive() as number;
        const paraChainId = api.query.parachainInfo ? (await api.query.parachainInfo.parachainId()).toPrimitive() as number : null;

        if (!ignoreChains.includes(chain)) {
          const nativeToken = await getSubstrateNativeInfo(api);

          compareNativeAsset(nativeToken, {
            decimals: substrateInfo.decimals,
            existentialDeposit: substrateInfo.existentialDeposit,
            symbol: substrateInfo.symbol
          }, errors);
        }

        if (ss58Prefix !== substrateInfo.addressPrefix) {
          errors.push(`Wrong addressPrefix: current - ${substrateInfo.addressPrefix}, onChain - ${ss58Prefix}`);
        }

        if (paraChainId !== substrateInfo.paraId) {
          errors.push(`Wrong paraChainId: current - ${substrateInfo.paraId ?? 'null'}, onChain - ${paraChainId ?? 'null'}`);
        }

        if (substrateInfo.paraId && substrateInfo.chainType !== _SubstrateChainType.PARACHAIN) {
          errors.push(`Wrong chainType: current - ${substrateInfo.chainType ?? 'null'}, onChain - ${_SubstrateChainType.PARACHAIN ?? 'null'}`);
        }

        if (!substrateInfo.paraId && substrateInfo.chainType !== _SubstrateChainType.RELAYCHAIN) {
          errors.push(`Wrong chainType: current - ${substrateInfo.chainType ?? 'null'}, onChain - ${_SubstrateChainType.RELAYCHAIN ?? 'null'}`);
        }
      };

      const onSuccessEvm = async (api: _EvmApi) => {
        const nativeToken = await getEvmNativeInfo(api);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const evmInfo = chainInfo.evmInfo!;

        compareNativeAsset(nativeToken, {
          decimals: evmInfo.decimals,
          existentialDeposit: evmInfo.existentialDeposit,
          symbol: evmInfo.symbol
        }, errors);
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
          genHash: chainInfo.substrateInfo.genesisHash
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

      if (errors.length) {
        errorChain[chain] = errors;
      }
    }

    console.log('result errorChain', errorChain);
  });
});
