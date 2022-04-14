// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiPromise } from '@polkadot/api';
import { ChainRegistry, TokenInfo } from '@polkadot/extension-base/background/KoniTypes';
import { moonbeamBaseChains } from '@polkadot/extension-koni-base/api/dotsama/api-helper';
import { PREDEFINE_TOKEN_DATA_MAP } from '@polkadot/extension-koni-base/api/predefineChainTokens';
import { dotSamaAPIMap, state } from '@polkadot/extension-koni-base/background/handlers';
import { BN, bnToHex } from '@polkadot/util';

const cacheRegistryMap: Record<string, ChainRegistry> = {};

export async function getMoonAssets (api: ApiPromise) {
  await api.isReady;
  const assets = await api.query.assets.metadata.entries();
  const assetRecord = {} as Record<string, TokenInfo>;

  assets.forEach(([assetKey, value]) => {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const keyString = assetKey.toHuman()[0].toString().replace(/,/g, '');
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const hexAddress = bnToHex(new BN(keyString)).slice(2).toUpperCase();
    const address = '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'.slice(0, -hexAddress.length) + hexAddress;

    const valueData = value.toHuman();
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-assignment
    const info = { isMainToken: false, name: valueData.name, symbol: valueData.symbol, decimals: parseInt(valueData.decimals || ' 0'), erc20Address: address } as TokenInfo;

    assetRecord[info.symbol] = info;
  });

  return assetRecord;
}

export const getRegistry = async (networkKey: string, api: ApiPromise) => {
  const cached = cacheRegistryMap[networkKey];

  if (cached) {
    return cached;
  }

  await api.isReady;

  const { chainDecimals, chainTokens } = api.registry;

  // Build token map
  const tokenMap = {} as Record<string, TokenInfo>;

  chainTokens.forEach((token, index) => {
    tokenMap[token] = {
      isMainToken: index === 0,
      name: token,
      symbol: token,
      decimals: chainDecimals[index]
    };
  });

  const predefineTokenMap = PREDEFINE_TOKEN_DATA_MAP[networkKey];

  if (predefineTokenMap) {
    Object.assign(tokenMap, predefineTokenMap);
  }

  // Get moonbeam base chains tokens
  if (moonbeamBaseChains.indexOf(networkKey) > -1) {
    const moonTokens = await getMoonAssets(api);

    Object.assign(tokenMap, moonTokens);
  }

  const chainRegistry = {
    chainDecimals,
    chainTokens,
    tokenMap
  } as ChainRegistry;

  cacheRegistryMap[networkKey] = chainRegistry;

  return chainRegistry;
};

export async function getTokenInfo (networkKey: string, api: ApiPromise, token: string): Promise<TokenInfo | undefined> {
  const { tokenMap } = await getRegistry(networkKey, api);

  return tokenMap[token];
}

export function initChainRegistrySubscription () {
  Object.entries(dotSamaAPIMap).forEach(([networkKey, { api }]) => {
    getRegistry(networkKey, api)
      .then((rs) => {
        state.setChainRegistryItem(networkKey, rs);
      })
      .catch(console.error);
  });
}
