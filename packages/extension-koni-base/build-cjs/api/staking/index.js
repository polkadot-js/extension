"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.DEFAULT_STAKING_NETWORKS = void 0;
exports.subscribeStaking = subscribeStaking;

var _KoniTypes = require("@polkadot/extension-base/background/KoniTypes");

var _endpoints = _interopRequireDefault(require("@polkadot/extension-koni-base/api/endpoints"));

var _constants = require("@polkadot/extension-koni-base/constants");

var _utils = require("@polkadot/extension-koni-base/utils/utils");

var _apiHelper = require("../dotsama/api-helper");

// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0
const DEFAULT_STAKING_NETWORKS = {
  polkadot: _endpoints.default.polkadot,
  kusama: _endpoints.default.kusama,
  hydradx: _endpoints.default.hydradx,
  acala: _endpoints.default.acala // astar: NETWORKS.astar,
  // moonbeam: NETWORKS.moonbeam

};
exports.DEFAULT_STAKING_NETWORKS = DEFAULT_STAKING_NETWORKS;

function parseStakingBalance(balance, chain) {
  if (chain === 'hydradx') {
    return balance;
  } else {
    return (0, _utils.toUnit)(balance, _endpoints.default[chain].decimals);
  }
}

async function subscribeStaking(addresses, dotSamaAPIMap, callback) {
  let networks = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : DEFAULT_STAKING_NETWORKS;
  const allApiPromise = [];
  const [substrateAddresses, evmAddresses] = (0, _utils.categoryAddresses)(addresses);
  Object.entries(networks).forEach(_ref => {
    let [networkKey, networkInfo] = _ref;

    if (_constants.IGNORE_GET_SUBSTRATE_FEATURES_LIST.indexOf(networkKey) < 0) {
      allApiPromise.push({
        chain: networkKey,
        api: dotSamaAPIMap[networkKey]
      });
    }
  });
  const unsubPromises = await Promise.all(allApiPromise.map(async _ref2 => {
    var _parentApi$api$query$;

    let {
      api: apiPromise,
      chain
    } = _ref2;
    const parentApi = await apiPromise.isReady;
    const useAddresses = _apiHelper.ethereumChains.indexOf(chain) > -1 ? evmAddresses : substrateAddresses;
    return (_parentApi$api$query$ = parentApi.api.query.staking) === null || _parentApi$api$query$ === void 0 ? void 0 : _parentApi$api$query$.ledger.multi(useAddresses, ledgers => {
      let totalBalance = 0;
      let unit = '';
      let stakingItem;

      if (ledgers) {
        for (const ledger of ledgers) {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          const data = ledger.toHuman(); // const currentAddress = addresses[index];

          if (data && data.active) {
            const balance = data.active;
            let amount = balance ? balance.split(' ')[0] : '';
            amount = amount.replaceAll(',', '');
            unit = balance ? balance.split(' ')[1] : '';
            totalBalance += parseFloat(amount);
          }
        }

        const parsedTotal = parseStakingBalance(totalBalance, chain);

        if (totalBalance > 0) {
          stakingItem = {
            name: _endpoints.default[chain].chain,
            chainId: chain,
            balance: parsedTotal.toString(),
            nativeToken: _endpoints.default[chain].nativeToken,
            unit: unit || _endpoints.default[chain].nativeToken,
            state: _KoniTypes.APIItemState.READY
          };
        } else {
          stakingItem = {
            name: _endpoints.default[chain].chain,
            chainId: chain,
            balance: parsedTotal.toString(),
            nativeToken: _endpoints.default[chain].nativeToken,
            unit: unit || _endpoints.default[chain].nativeToken,
            state: _KoniTypes.APIItemState.READY
          };
        } // eslint-disable-next-line node/no-callback-literal


        callback(chain, stakingItem);
      }
    });
  }));
  return async () => {
    const unsubs = await Promise.all(unsubPromises);
    unsubs.forEach(unsub => {
      unsub && unsub();
    });
  };
}