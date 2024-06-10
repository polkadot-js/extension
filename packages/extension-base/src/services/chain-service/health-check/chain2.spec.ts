// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainInfoMap } from '@subwallet/chain-list';
import { _ChainInfo, _ChainStatus, _SubstrateInfo } from '@subwallet/chain-list/types';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { chainProvider, chainProviderBackup } from './constants';
import { AssetSpec, checkNativeAsset, checkParachainId, checkSs58Prefix, getEvmNativeInfo, getSubstrateNativeInfo, NativeAssetInfo } from './utils';
import { EvmApi } from "@subwallet/extension-base/services/chain-service/handler/EvmApi";

jest.setTimeout(3 * 60 * 60 * 1000);

interface OnchainInfo {
  ss58Prefix: number,
  parachainId: number | null
  nativeToken: AssetSpec
}

const ignoreChains: string[] = ['interlay', 'kintsugi', 'kintsugi_test', 'avail_mainnet', 'shibuya', 'aventus']; // ignore these chains;
// const onlyChains: string[] = ['polkadot', 'manta_network']; // check only these chains if set;
const onlyChains: string[] = [];
const CASE_TIME_OUT = 20000;

describe('test chain', () => {
  const chainInfos = getChainlistInfos();
  test.each(chainInfos)(`test %j`, async (chainInfo) => {
    const chain = chainInfo.slug;
    console.log('start', chain);
    const providerIndex = chainProvider[chain] || chainProvider.default;
    const [key, provider] = Object.entries(chainInfo.providers)[providerIndex];

    // 1. Check provider match chain
    const [isProviderMatchChain, api] = await checkProviderMatchChain(chainInfo, provider, key) as [boolean, ApiPromise | EvmApi | null];

    expect(isProviderMatchChain).toEqual(true);

    // 2. If provider match chain, retrieve on-chain data and validating it.
    if (isProviderMatchChain && api) {
      expect(await isValidData(chainInfo, api)).toEqual(true);
    }
  }, CASE_TIME_OUT);
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

async function checkProviderMatchChain (chainInfo: _ChainInfo, provider: string, key: string) {
  if (chainInfo.substrateInfo) {
    const _api = new ApiPromise({ provider: new WsProvider(provider) });
    const substrateApi = await _api.isReady;
    const genesisHash = substrateApi.genesisHash.toHex();
    const chainlistGenesisHash = chainInfo.substrateInfo.genesisHash;

    console.log(`[Substrate] genesisHash: current - ${chainlistGenesisHash}, onChain - ${genesisHash}`)
    const trueGenesisHash = genesisHash === chainlistGenesisHash;

    return trueGenesisHash ? [trueGenesisHash, _api] : [trueGenesisHash, null];
  }

  if (chainInfo.evmInfo) {
    let _key = key;
    let _provider = provider;

    if (chainInfo.substrateInfo) {
      const _providerIndex = chainProviderBackup[chainInfo.slug] || chainProviderBackup.default;
      const length = Object.keys(chainInfo.providers).length;
      const providerIndex = _providerIndex >= length ? length - 1 : _providerIndex;

      [_key, _provider] = Object.entries(chainInfo.providers)[providerIndex];
    }
    const _api = new EvmApi(chainInfo.slug, _provider, { providerName: _key });
    const chainId = await _api.api.eth.getChainId();
    const chainlistChainId = chainInfo.evmInfo.evmChainId;

    console.log(`[Evm] chainId: current - ${chainlistChainId}, onChain - ${chainId}`)
    const trueChainId = chainId === chainlistChainId;

    return trueChainId ? [trueChainId, _api] : [trueChainId, null];
  }

  return [false, null];
}

async function isValidData (chainInfo: _ChainInfo, api: ApiPromise | EvmApi) {
  if (chainInfo.substrateInfo) {
      const onchainInfo = await retrieveSubstrateOnchainInfo(api as ApiPromise)
      const substrateInfo = chainInfo.substrateInfo!;

      return validateSubstrateInfo(onchainInfo, substrateInfo);
  }

  if (chainInfo.evmInfo) {
      const nativeToken = await getEvmNativeInfo(api as EvmApi);
      const evmInfo = chainInfo.evmInfo!;

      console.log(
        `[Evm] current decimals - ${evmInfo.decimals}, onChain - ${nativeToken.decimals} \n`,
        `[Evm] current ED - ${evmInfo.existentialDeposit}, onChain - ${nativeToken.minAmount} \n`,
        `[Evm] current symbol - ${evmInfo.symbol}, onChain - ${nativeToken.symbol} \n`
      );

      return checkNativeAsset(nativeToken, {
        decimals: evmInfo.decimals,
        existentialDeposit: evmInfo.existentialDeposit,
        symbol: evmInfo.symbol
      });
  }

  return false
}
async function retrieveSubstrateOnchainInfo (api: ApiPromise): Promise<OnchainInfo> {
  const ss58Prefix = api.consts.system.ss58Prefix.toPrimitive() as number;
  const parachainId = api.query.parachainInfo ? (await api.query.parachainInfo.parachainId()).toPrimitive() as number : null;
  const nativeToken = await getSubstrateNativeInfo(api);

  return {
    ss58Prefix,
    parachainId,
    nativeToken
  } as unknown as OnchainInfo
}

function validateSubstrateInfo(onchainInfo: OnchainInfo, chainlistInfo: _SubstrateInfo) {
  const chainlistNativeToken = {
    decimals: chainlistInfo.decimals,
    existentialDeposit: chainlistInfo.existentialDeposit,
    symbol: chainlistInfo.symbol
  } as NativeAssetInfo;

  console.log(
    `[Substrate] current addressPrefix - ${chainlistInfo.addressPrefix}, onChain - ${onchainInfo.ss58Prefix} \n`,
    `[Substrate] current parachainId - ${chainlistInfo.paraId}, onChain - ${onchainInfo.parachainId} \n`,
    `[Substrate] current decimals - ${chainlistNativeToken.decimals}, onChain - ${onchainInfo.nativeToken.decimals} \n`,
    `[Substrate] current ED - ${chainlistNativeToken.existentialDeposit}, onChain - ${onchainInfo.nativeToken.minAmount} \n`,
    `[Substrate] current symbol - ${chainlistNativeToken.symbol}, onChain - ${onchainInfo.nativeToken.symbol} \n`
    );

  const isValidNativeAsset = checkNativeAsset(onchainInfo.nativeToken, chainlistNativeToken);
  const isValidSs58Prefix = checkSs58Prefix(onchainInfo.ss58Prefix, chainlistInfo.addressPrefix);
  const isValidParachainId = checkParachainId(onchainInfo.parachainId, chainlistInfo.paraId);

  return (isValidNativeAsset && isValidSs58Prefix && isValidParachainId);
}

