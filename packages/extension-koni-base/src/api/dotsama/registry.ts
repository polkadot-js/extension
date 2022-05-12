// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainRegistry, TokenInfo } from '@subwallet/extension-base/background/KoniTypes';
import { moonbeamBaseChains } from '@subwallet/extension-koni-base/api/dotsama/api-helper';
import { PREDEFINE_TOKEN_DATA_MAP } from '@subwallet/extension-koni-base/api/predefineChainTokens';

import { ApiPromise } from '@polkadot/api';
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

export async function getForeignToken (api: ApiPromise) {
  await api.isReady;
  const allTokens = await api.query.assetRegistry.assetMetadatas.entries();

  const tokenMap = {} as Record<string, TokenInfo>;

  allTokens.forEach(([storageKey, tokenData]) => {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const foreignAsset = storageKey.toHuman()[0].ForeignAssetId;

    if (foreignAsset) {
      const { decimals, name, symbol } = tokenData.toHuman() as {
        symbol: string,
        decimals: string,
        name: string
      };

      tokenMap[symbol] = {
        isMainToken: false,
        symbol,
        decimals: parseInt(decimals),
        name,
        specialOption: {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          ForeignAsset: foreignAsset
        }
      };
    }
  });

  return tokenMap;
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

  if (['karura', 'acala', 'bifrost'].indexOf(networkKey) > -1) {
    const foreignTokens = await getForeignToken(api);

    Object.assign(tokenMap, foreignTokens);
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

// deprecated
// export function initChainRegistrySubscription () {
//   const apiMap = state.getApiMap();
//
//   Object.entries(apiMap.dotSama).forEach(([networkKey, { api }]) => {
//     getRegistry(networkKey, api)
//       .then((rs) => {
//         console.log('chainRegistry here', rs);
//         state.setChainRegistryItem(networkKey, rs);
//       })
//       .catch(console.error);
//   });
// }
