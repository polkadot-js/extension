// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ChainRegistry, CustomToken, TokenInfo } from '@subwallet/extension-base/background/KoniTypes';
import { moonbeamBaseChains } from '@subwallet/extension-koni-base/api/dotsama/api-helper';
import { PREDEFINE_TOKEN_DATA_MAP } from '@subwallet/extension-koni-base/api/predefineChainTokens';

import { ApiPromise } from '@polkadot/api';
import { BN, bnToHex } from '@polkadot/util';

export const cacheRegistryMap: Record<string, ChainRegistry> = {};

// temporary fix for token symbols, need a better fix later
function formatTokenSymbol (rawSymbol: string) {
  if (rawSymbol === 'xcKBTC') {
    return 'xckBTC';
  } else if (rawSymbol === 'xcIBTC') {
    return 'xciBTC';
  } else if (rawSymbol === 'KBTC') {
    return 'kBTC';
  } else if (rawSymbol === 'IBTC') {
    return 'iBTC';
  }

  return rawSymbol;
}

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
    const info = { isMainToken: false, name: valueData.name, symbol: formatTokenSymbol(valueData.symbol), decimals: parseInt(valueData.decimals || ' 0'), contractAddress: address, assetId: keyString } as TokenInfo;

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
    const assetMetadata = storageKey.toHuman()[0] as Record<string, any>;

    let specialOption;

    if (assetMetadata.ForeignAssetId) {
      specialOption = {
        ForeignAsset: assetMetadata.ForeignAssetId as string
      };
    } else if (assetMetadata.NativeAssetId) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (assetMetadata.NativeAssetId.Token) {
        specialOption = {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          Token: assetMetadata.NativeAssetId.Token as string
        };
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      } else if (assetMetadata.NativeAssetId.LiquidCrowdloan) {
        specialOption = {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          LiquidCrowdloan: assetMetadata.NativeAssetId.LiquidCrowdloan as string
        };
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      } else if (assetMetadata.NativeAssetId.VSToken) {
        specialOption = {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          VSToken: assetMetadata.NativeAssetId.VSToken as string
        };
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      } else if (assetMetadata.NativeAssetId.Native) {
        specialOption = {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          Native: assetMetadata.NativeAssetId.Native as string
        };
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      } else if (assetMetadata.NativeAssetId.Stable) {
        specialOption = {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
          Stable: assetMetadata.NativeAssetId.Stable as string
        };
      }
    } else if (assetMetadata.Erc20) {
      specialOption = {
        Erc20: assetMetadata.Erc20 as string
      };
    } else if (assetMetadata.StableAssetId) {
      specialOption = {
        StableAssetPoolToken: assetMetadata.StableAssetId as string
      };
    }

    const { decimals, name, symbol } = tokenData.toHuman() as {
      symbol: string,
      decimals: string,
      name: string
    };

    if (!(symbol in tokenMap)) {
      if (symbol === 'KUSD') {
        tokenMap.aUSD = {
          isMainToken: false,
          symbol: 'aUSD',
          decimals: parseInt(decimals),
          name,
          specialOption
        };
      } else {
        tokenMap[symbol] = {
          isMainToken: false,
          symbol,
          decimals: parseInt(decimals),
          name,
          specialOption
        };
      }
    }
  });

  return tokenMap;
}

export const getRegistry = async (networkKey: string, api: ApiPromise, customTokens?: CustomToken[]) => {
  const cached = cacheRegistryMap[networkKey];

  if (cached) {
    return cached;
  }

  await api.isReady;

  const { chainDecimals, chainTokens } = api.registry;

  // Hotfix for these network because substrate and evm response different decimal
  if (['pangolinEvm', 'crabEvm'].includes(networkKey)) {
    chainDecimals.forEach((x, i, l) => {
      l[i] = 18;
    });
  }

  // Build token map
  const tokenMap = {} as Record<string, TokenInfo>;

  if (!['genshiro_testnet', 'genshiro', 'equilibrium_parachain', 'acala', 'karura'].includes(networkKey)) {
    chainTokens.forEach((token, index) => {
      const formattedToken = formatTokenSymbol(token);

      tokenMap[formattedToken] = {
        isMainToken: index === 0,
        name: formattedToken,
        symbol: formattedToken,
        decimals: chainDecimals[index]
      };
    });
  }

  const predefineTokenMap = PREDEFINE_TOKEN_DATA_MAP[networkKey];

  if (predefineTokenMap) {
    Object.assign(tokenMap, predefineTokenMap);
  }

  if (['karura', 'acala', 'bifrost'].indexOf(networkKey) > -1) {
    const foreignTokens = await getForeignToken(api);

    Object.assign(tokenMap, foreignTokens);

    if (networkKey === 'karura') { // quick fix for native token
      tokenMap.KAR.isMainToken = true;
    } else if (networkKey === 'acala') {
      tokenMap.ACA.isMainToken = true;
    } else if (networkKey === 'bifrost') {
      tokenMap.BNC.isMainToken = true;
      delete tokenMap.KUSD;
    }
  }

  // Get moonbeam base chains tokens
  if (moonbeamBaseChains.indexOf(networkKey) > -1) {
    const moonTokens = await getMoonAssets(api);

    Object.assign(tokenMap, moonTokens);
  }

  if (customTokens) {
    for (const customToken of customTokens) {
      if (customToken.chain === networkKey && customToken.symbol && !(customToken.symbol in tokenMap)) {
        tokenMap[customToken.symbol] = {
          contractAddress: customToken.smartContract,
          isMainToken: false,
          name: customToken.name,
          symbol: customToken.symbol,
          decimals: customToken.decimals as number
        } as TokenInfo;
      }
    }
  }

  const chainRegistry = {
    chainDecimals,
    chainTokens,
    tokenMap
  } as ChainRegistry;

  cacheRegistryMap[networkKey] = chainRegistry;

  console.log('chainRegistry', chainRegistry, networkKey);

  return chainRegistry;
};

export async function getTokenInfo (networkKey: string, api: ApiPromise, token: string): Promise<TokenInfo | undefined> {
  const { tokenMap } = await getRegistry(networkKey, api);

  return tokenMap[token];
}
