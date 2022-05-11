"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _definitions = require("@equilab/definitions");

var _equilibrium = require("./equilibrium");

// Copyright 2017-2022 @polkadot/apps-config authors & contributors
// SPDX-License-Identifier: Apache-2.0
const definitions = {
  derives: { ..._definitions.genshiro.instances.balances.reduce((all, cur) => ({ ...all,
      [cur]: {
        customAccount: (0, _equilibrium.createCustomAccount)(cur, currency => ({
          0: (0, _equilibrium.u64FromCurrency)(currency)
        }), 'CompatAccountData')
      }
    }), {})
  },
  instances: _definitions.genshiro.instances,
  types: [{
    // on all versions
    minmax: [0, undefined],
    types: _definitions.genshiro.types
  }]
};
var _default = definitions;
exports.default = _default;