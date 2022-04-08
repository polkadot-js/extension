"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.subcribleAcalaContributeInterval = void 0;
exports.subscribeCrowdloan = subscribeCrowdloan;

var _axios = _interopRequireDefault(require("axios"));

var _KoniTypes = require("@polkadot/extension-base/background/KoniTypes");

var _typeRegistry = _interopRequireDefault(require("@polkadot/extension-koni-base/api/dotsama/typeRegistry"));

var _endpoints = _interopRequireDefault(require("@polkadot/extension-koni-base/api/endpoints"));

var _constants = require("@polkadot/extension-koni-base/constants");

var _utils = require("@polkadot/extension-koni-base/utils/utils");

var _util = require("@polkadot/util");

// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0
function getRPCCrowndloan(parentAPI, paraId, hexAddresses, callback) {
  const unsubPromise = parentAPI.api.derive.crowdloan.ownContributions(paraId, hexAddresses, result => {
    let contribute = new _util.BN(0);
    Object.values(result).forEach(item => {
      contribute = contribute.add(item.toBn());
    });
    const rs = {
      state: _KoniTypes.APIItemState.READY,
      contribute: contribute.toString()
    };
    callback(rs);
  });
  return () => {
    unsubPromise.then(unsub => {
      unsub();
    }).catch(console.error);
  };
}

const subcribleAcalaContributeInterval = (polkadotAddresses, callback) => {
  const acalaContributionApi = 'https://api.polkawallet.io/acala-distribution-v2/crowdloan?account=';

  const getContributeInfo = () => {
    Promise.all(polkadotAddresses.map(polkadotAddress => {
      return _axios.default.get(`${acalaContributionApi}${polkadotAddress}`);
    })).then(resList => {
      let contribute = new _util.BN(0);
      resList.forEach(res => {
        var _res$data$data, _res$data$data$acala, _res$data$data$acala$, _res$data$data$acala$2;

        if (res.status !== 200) {
          console.warn('Failed to get Acala, Karura crowdloan contribute');
        } // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument


        contribute = contribute.add(new _util.BN(((_res$data$data = res.data.data) === null || _res$data$data === void 0 ? void 0 : (_res$data$data$acala = _res$data$data.acala) === null || _res$data$data$acala === void 0 ? void 0 : (_res$data$data$acala$ = _res$data$data$acala[0]) === null || _res$data$data$acala$ === void 0 ? void 0 : (_res$data$data$acala$2 = _res$data$data$acala$.detail) === null || _res$data$data$acala$2 === void 0 ? void 0 : _res$data$data$acala$2.lcAmount) || '0'));
      });
      const rs = {
        state: _KoniTypes.APIItemState.READY,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access
        contribute: contribute.toString()
      };
      callback(rs);
    }).catch(console.error);
  };

  getContributeInfo();
  const interval = setInterval(getContributeInfo, _constants.ACALA_REFRESH_CROWDLOAN_INTERVAL);
  return () => {
    clearInterval(interval);
  };
}; // Get All crowdloan


exports.subcribleAcalaContributeInterval = subcribleAcalaContributeInterval;

async function subscribeCrowdloan(addresses, dotSamaAPIMap, callback) {
  let networks = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : _endpoints.default;
  const polkadotAPI = await dotSamaAPIMap.polkadot.isReady;
  const kusamaAPI = await dotSamaAPIMap.kusama.isReady;
  const unsubMap = {};
  const substrateAddresses = (0, _utils.categoryAddresses)(addresses)[0];
  const hexAddresses = substrateAddresses.map(address => {
    return _typeRegistry.default.createType('AccountId', address).toHex();
  });
  Object.entries(networks).forEach(_ref => {
    let [networkKey, networkInfo] = _ref;

    const crowdloanCb = rs => {
      callback(networkKey, rs);
    };

    if (networkInfo.paraId === undefined || addresses.length === 0) {
      return;
    }

    if (networkKey === 'acala') {
      unsubMap.acala = subcribleAcalaContributeInterval(substrateAddresses.map(address => (0, _utils.reformatAddress)(address, networkInfo.ss58Format, networkInfo.isEthereum)), crowdloanCb);
    } else if (networkInfo.groups.includes('POLKADOT_PARACHAIN')) {
      unsubMap[networkKey] = getRPCCrowndloan(polkadotAPI, networkInfo.paraId, hexAddresses, crowdloanCb);
    } else if (networkInfo.groups.includes('KUSAMA_PARACHAIN')) {
      unsubMap[networkKey] = getRPCCrowndloan(kusamaAPI, networkInfo.paraId, hexAddresses, crowdloanCb);
    }
  });
  return unsubMap;
}