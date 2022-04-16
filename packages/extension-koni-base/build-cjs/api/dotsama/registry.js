"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getForeignToken = getForeignToken;
exports.getMoonAssets = getMoonAssets;
exports.getRegistry = void 0;
exports.getTokenInfo = getTokenInfo;
exports.initChainRegistrySubscription = initChainRegistrySubscription;

var _apiHelper = require("@polkadot/extension-koni-base/api/dotsama/api-helper");

var _predefineChainTokens = require("@polkadot/extension-koni-base/api/predefineChainTokens");

var _handlers = require("@polkadot/extension-koni-base/background/handlers");

var _util = require("@polkadot/util");

// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0
const cacheRegistryMap = {};

async function getMoonAssets(api) {
  await api.isReady;
  const assets = await api.query.assets.metadata.entries();
  const assetRecord = {};
  assets.forEach(_ref => {
    let [assetKey, value] = _ref;
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const keyString = assetKey.toHuman()[0].toString().replace(/,/g, ''); // eslint-disable-next-line @typescript-eslint/no-unsafe-argument

    const hexAddress = (0, _util.bnToHex)(new _util.BN(keyString)).slice(2).toUpperCase();
    const address = '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF'.slice(0, -hexAddress.length) + hexAddress;
    const valueData = value.toHuman(); // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-assignment

    const info = {
      isMainToken: false,
      name: valueData.name,
      symbol: valueData.symbol,
      decimals: parseInt(valueData.decimals || ' 0'),
      erc20Address: address
    };
    assetRecord[info.symbol] = info;
  });
  return assetRecord;
}

async function getForeignToken(api) {
  await api.isReady;
  const allTokens = await api.query.assetRegistry.assetMetadatas.entries();
  const tokenMap = {};
  allTokens.forEach(_ref2 => {
    let [storageKey, tokenData] = _ref2;
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
    const foreignAsset = storageKey.toHuman()[0].ForeignAssetId;

    if (foreignAsset) {
      const {
        decimals,
        name,
        symbol
      } = tokenData.toHuman();
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

const getRegistry = async (networkKey, api) => {
  const cached = cacheRegistryMap[networkKey];

  if (cached) {
    return cached;
  }

  await api.isReady;
  const {
    chainDecimals,
    chainTokens
  } = api.registry; // Build token map

  const tokenMap = {};
  chainTokens.forEach((token, index) => {
    tokenMap[token] = {
      isMainToken: index === 0,
      name: token,
      symbol: token,
      decimals: chainDecimals[index]
    };
  });
  const predefineTokenMap = _predefineChainTokens.PREDEFINE_TOKEN_DATA_MAP[networkKey];

  if (predefineTokenMap) {
    Object.assign(tokenMap, predefineTokenMap);
  }

  if (['karura', 'acala', 'bifrost'].indexOf(networkKey) > -1) {
    const foreignTokens = await getForeignToken(api);
    Object.assign(tokenMap, foreignTokens);
  } // Get moonbeam base chains tokens


  if (_apiHelper.moonbeamBaseChains.indexOf(networkKey) > -1) {
    const moonTokens = await getMoonAssets(api);
    Object.assign(tokenMap, moonTokens);
  }

  const chainRegistry = {
    chainDecimals,
    chainTokens,
    tokenMap
  };
  cacheRegistryMap[networkKey] = chainRegistry;
  return chainRegistry;
};

exports.getRegistry = getRegistry;

async function getTokenInfo(networkKey, api, token) {
  const {
    tokenMap
  } = await getRegistry(networkKey, api);
  return tokenMap[token];
}

function initChainRegistrySubscription() {
  Object.entries(_handlers.dotSamaAPIMap).forEach(_ref3 => {
    let [networkKey, {
      api
    }] = _ref3;
    getRegistry(networkKey, api).then(rs => {
      _handlers.state.setChainRegistryItem(networkKey, rs);
    }).catch(console.error);
  });
}