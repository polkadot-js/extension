"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.u64FromCurrency = exports.default = exports.createCustomAccount = void 0;

var _definitions = require("@equilab/definitions");

var _rxjs = require("rxjs");

var _types = require("@polkadot/types");

var _util = require("@polkadot/util");

// Copyright 2017-2022 @polkadot/apps-config authors & contributors
// SPDX-License-Identifier: Apache-2.0
const u64FromCurrency = currency => {
  const buf = Buffer.from(currency.toLowerCase());
  const size = buf.length;
  return buf.reduce((val, digit, i) => val + Math.pow(256, size - 1 - i) * digit, 0);
};

exports.u64FromCurrency = u64FromCurrency;

const transformBalanceStorage = (query, currency, transform, currencyToAsset, api) => {
  const arg = currencyToAsset(currency, api); // HACK as we cannot properly transform queryMulti result, define AccountData getters on standard Enum

  if (!_types.Enum.hacked) {
    _types.Enum.hacked = true;

    for (const prop of ['free', 'reserved', 'miscFrozen', 'feeFrozen']) {
      Object.defineProperty(_types.Enum.prototype, prop, {
        get() {
          const accData = transform(this);
          return accData[prop];
        },

        set() {// Do nothing
        }

      });
    }
  } // Transform result if we call the func normally


  const boundFunction = account => query(account, arg).pipe((0, _rxjs.map)(transform)); // Bind currency as second key for doubleMap for queryMulti


  const boundCreator = account => query.creator([account, arg]);

  Object.assign(boundCreator, { ...query.creator
  });
  return Object.assign(boundFunction, { ...query,
    creator: boundCreator
  });
};

const signedBalancePredicate = raw => ['asNegative', 'asPositive', 'isNegative', 'isPositive'].some(key => Object.prototype.hasOwnProperty.call(raw, key));

const createCustomAccount = function (currency, currencyToAsset) {
  let accountDataType = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 'AccountData';
  return (instanceId, api) => {
    const registry = api.registry;

    const transform = balance => {
      let free = registry.createType('Balance');
      const reserved = registry.createType('Balance');
      const miscFrozen = registry.createType('Balance');
      const feeFrozen = registry.createType('Balance');

      if (signedBalancePredicate(balance)) {
        if (balance.isPositive) {
          free = registry.createType('Balance', balance.asPositive);
        } else if (balance.isNegative) {
          free = registry.createType('Balance', balance.asNegative.mul(new _util.BN(-1)));
        }
      }

      return registry.createType(accountDataType, {
        feeFrozen,
        free,
        miscFrozen,
        reserved
      });
    };

    return transformBalanceStorage(api.query.eqBalances.account, currency, transform, currencyToAsset, api);
  };
};

exports.createCustomAccount = createCustomAccount;
const definitions = {
  derives: { ..._definitions.equilibrium.instances.balances.reduce((all, cur) => ({ ...all,
      [cur]: {
        customAccount: createCustomAccount(cur, (currency, api) => {
          let assetsEnabled = true;

          try {
            api === null || api === void 0 ? void 0 : api.registry.createType('AssetIdInnerType');
          } catch (_) {
            assetsEnabled = false;
          }

          return assetsEnabled ? {
            0: u64FromCurrency(currency)
          } : currency;
        })
      }
    }), {})
  },
  instances: _definitions.equilibrium.instances,
  types: [{
    minmax: [0, 264],
    types: _definitions.equilibrium.types
  }, {
    minmax: [265, undefined],
    types: _definitions.equilibriumNext.types
  }]
};
var _default = definitions;
exports.default = _default;