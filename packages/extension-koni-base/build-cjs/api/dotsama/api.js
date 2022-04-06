"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DEFAULT_AUX = void 0;
exports.initApi = initApi;

var _api = require("@acala-network/api");

var _api2 = require("@polkadot/api");

var _apiHelper = require("@polkadot/extension-koni-base/api/dotsama/api-helper");

var _constants = require("@polkadot/extension-koni-base/constants");

var _utils = require("@polkadot/extension-koni-base/utils/utils");

var _create = require("@polkadot/types/create");

var _util = require("@polkadot/util");

var _defaults = require("@polkadot/util-crypto/address/defaults");

// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0
const DEFAULT_AUX = ['Aux1', 'Aux2', 'Aux3', 'Aux4', 'Aux5', 'Aux6', 'Aux7', 'Aux8', 'Aux9'];
exports.DEFAULT_AUX = DEFAULT_AUX;

async function retrieve(registry, api) {
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const [systemChain, systemChainType, systemName, systemVersion] = await Promise.all([// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  api.rpc.system.chain(), // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  api.rpc.system.chainType // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  ? api.rpc.system.chainType() : Promise.resolve(registry.createType('ChainType', 'Live')), // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  api.rpc.system.name(), // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
  api.rpc.system.version()]);
  return {
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    properties: registry.createType('ChainProperties', {
      ss58Format: api.registry.chainSS58,
      tokenDecimals: api.registry.chainDecimals,
      tokenSymbol: api.registry.chainTokens
    }),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
    systemChain: (systemChain || '<unknown>').toString(),
    // @ts-ignore
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    systemChainType,
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    systemName: systemName.toString(),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    systemVersion: systemVersion.toString()
  };
}

async function loadOnReady(registry, api) {
  const DEFAULT_DECIMALS = registry.createType('u32', 12);
  const DEFAULT_SS58 = registry.createType('u32', _defaults.defaults.prefix);
  const {
    properties,
    systemChain,
    systemChainType,
    systemName,
    systemVersion
  } = await retrieve(registry, api);
  const ss58Format = properties.ss58Format.unwrapOr(DEFAULT_SS58).toNumber();
  const tokenSymbol = properties.tokenSymbol.unwrapOr([_util.formatBalance.getDefaults().unit, ...DEFAULT_AUX]);
  const tokenDecimals = properties.tokenDecimals.unwrapOr([DEFAULT_DECIMALS]);
  const isDevelopment = systemChainType.isDevelopment || systemChainType.isLocal || (0, _util.isTestChain)(systemChain);
  console.log(`chain: ${systemChain} (${systemChainType.toString()}), ${(0, _util.stringify)(properties)}`); // explicitly override the ss58Format as specified
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore

  registry.setChainProperties(registry.createType('ChainProperties', {
    ss58Format,
    tokenDecimals,
    tokenSymbol
  })); // first setup the UI helpers

  const defaultFormatBalance = {
    decimals: tokenDecimals.map(b => b.toNumber()),
    unit: tokenSymbol[0].toString()
  };

  const isEthereum = _apiHelper.ethereumChains.includes(api.runtimeVersion.specName.toString());

  const defaultSection = Object.keys(api.tx)[0];
  const defaultMethod = Object.keys(api.tx[defaultSection])[0];
  const apiDefaultTx = api.tx[defaultSection][defaultMethod];
  const apiDefaultTxSudo = api.tx.system && api.tx.system.setCode || apiDefaultTx;
  return {
    defaultFormatBalance,
    registry,
    apiDefaultTx,
    apiDefaultTxSudo,
    isApiReady: true,
    isApiReadyOnce: true,
    isEthereum,
    isDevelopment: isDevelopment,
    specName: api.runtimeVersion.specName.toString(),
    specVersion: api.runtimeVersion.specVersion.toString(),
    systemChain,
    systemName,
    systemVersion
  };
}

function initApi(networkKey, apiUrl) {
  const registry = new _create.TypeRegistry();
  const provider = new _api2.WsProvider(apiUrl, _constants.DOTSAMA_AUTO_CONNECT_MS);
  const apiOption = {
    provider,
    typesBundle: _apiHelper.typesBundle,
    typesChain: _apiHelper.typesChain
  };

  if (!(0, _utils.inJestTest)()) {
    // @ts-ignore
    apiOption.registry = registry;
  }

  let api;

  if (['acala', 'karura'].includes(networkKey)) {
    api = new _api2.ApiPromise((0, _api.options)({
      provider
    }));
  } else {
    api = new _api2.ApiPromise(apiOption);
  }

  const result = {
    api,
    apiDefaultTx: undefined,
    apiDefaultTxSudo: undefined,
    apiError: undefined,
    apiUrl,
    defaultFormatBalance: undefined,
    isApiConnected: false,
    isApiReadyOnce: false,
    isApiInitialized: true,
    isApiReady: false,
    isEthereum: false,
    registry,
    specName: '',
    specVersion: '',
    systemChain: '',
    systemName: '',
    systemVersion: '',
    apiRetry: 0,
    recoverConnect: () => {
      result.apiRetry = 0;
      console.log('Recover connect to', apiUrl);
      provider.connect().then(console.log).catch(console.error);
    },

    get isReady() {
      const self = this;

      async function f() {
        if (!result.isApiReadyOnce) {
          await self.api.isReady;
        }

        return new Promise((resolve, reject) => {
          (function wait() {
            if (self.isApiReady) {
              return resolve(self);
            }

            setTimeout(wait, 10);
          })();
        });
      }

      return f();
    }

  };
  api.on('connected', () => {
    console.log('DotSamaAPI connected to', apiUrl);
    result.apiRetry = 0;

    if (result.isApiReadyOnce) {
      result.isApiReady = true;
    }

    result.isApiConnected = true;
  });
  api.on('disconnected', () => {
    result.isApiConnected = false;
    result.isApiReady = false;
    result.apiRetry = (result.apiRetry || 0) + 1;
    console.log(`DotSamaAPI disconnected from ${JSON.stringify(apiUrl)} ${JSON.stringify(result.apiRetry)} times`);

    if (result.apiRetry > _constants.DOTSAMA_MAX_CONTINUE_RETRY) {
      console.log(`Discontinue to use ${JSON.stringify(apiUrl)} because max retry`);
      provider.disconnect().then(console.log).catch(console.error);
    }
  });
  api.on('ready', () => {
    console.log('DotSamaAPI ready with', apiUrl);
    loadOnReady(registry, api).then(rs => {
      (0, _util.objectSpread)(result, rs);
    }).catch(error => {
      result.apiError = error.message;
    });
  });
  return result;
}