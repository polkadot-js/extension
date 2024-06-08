// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainInfoMap } from '@subwallet/chain-list';
import {_ChainStatus, _SubstrateChainType, _SubstrateInfo} from '@subwallet/chain-list/types';
import { _EvmApi } from '@subwallet/extension-base/services/chain-service/types';
import { ApiPromise } from '@polkadot/api';
import { chainProvider, chainProviderBackup } from './constants';
import { AssetSpec, checkNativeAsset, checkParachainId, checkSs58Prefix, getEvmNativeInfo, getSubstrateNativeInfo, handleEvmProvider, handleSubstrateProvider, NativeAssetInfo } from './utils';

jest.setTimeout(3 * 60 * 60 * 1000);

interface OnchainInfo {
  ss58Prefix: number,
  parachainId: number | null
  nativeToken: AssetSpec
}

const ignoreChains: string[] = ['interlay', 'kintsugi', 'kintsugi_test', 'avail_mainnet']; // ignore these chains;
const onlyChains: string[] = ['polkadot', 'manta_network']; // check only these chains if set;

describe('test chain', () => {
  it('chain', async () => {
    const chainInfos = getChainlistInfos();
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
        const onchainInfo = await retrieveOnchainInfo(api)
        const substrateInfo = chainInfo.substrateInfo!;

        validateSubstrateInfo(onchainInfo, substrateInfo, errors);
      };

      const onSuccessEvm = async (api: _EvmApi) => {
        const nativeToken = await getEvmNativeInfo(api);
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        const evmInfo = chainInfo.evmInfo!;

        checkNativeAsset(nativeToken, {
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

function getChainlistInfos () {
  if (onlyChains.length > 0) {
    return Object.values(ChainInfoMap).filter((info) =>
        info.chainStatus === _ChainStatus.ACTIVE && onlyChains.includes(info.slug)
    );
  }

  return Object.values(ChainInfoMap).filter((info) =>
      info.chainStatus === _ChainStatus.ACTIVE && !ignoreChains.includes(info.slug)
  );
}

async function retrieveOnchainInfo (api: ApiPromise): Promise<OnchainInfo> {
  const ss58Prefix = api.consts.system.ss58Prefix.toPrimitive() as number;
  const parachainId = api.query.parachainInfo ? (await api.query.parachainInfo.parachainId()).toPrimitive() as number : null;
  const nativeToken = await getSubstrateNativeInfo(api);

  return {
    ss58Prefix,
    parachainId,
    nativeToken
  } as unknown as OnchainInfo
}

function validateSubstrateInfo(onchainInfo: OnchainInfo, chainlistInfo: _SubstrateInfo, errors: string[]) {
  const chainlistNativeToken = {
    decimals: chainlistInfo.decimals,
    existentialDeposit: chainlistInfo.existentialDeposit,
    symbol: chainlistInfo.symbol
  } as NativeAssetInfo;

  checkNativeAsset(onchainInfo.nativeToken, chainlistNativeToken, errors);
  checkSs58Prefix(onchainInfo.ss58Prefix, chainlistInfo.addressPrefix, errors);
  checkParachainId(onchainInfo.parachainId, chainlistInfo.paraId, errors);
}
