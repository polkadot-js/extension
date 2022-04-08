"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _subscriptions = require("@polkadot/extension-base/background/handlers/subscriptions");

var _Tabs = _interopRequireDefault(require("@polkadot/extension-base/background/handlers/Tabs"));

var _utils = require("@polkadot/extension-base/utils");

var _accounts = require("@polkadot/ui-keyring/observable/accounts");

var _util = require("@polkadot/util");

// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0
function stripUrl(url) {
  (0, _util.assert)(url && (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('ipfs:') || url.startsWith('ipns:')), `Invalid url ${url}, expected to start with http: or https: or ipfs: or ipns:`);
  const parts = url.split('/');
  return parts[2];
}

function transformAccountsV2(accounts) {
  let anyType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
  let url = arguments.length > 2 ? arguments[2] : undefined;
  let authList = arguments.length > 3 ? arguments[3] : undefined;
  const shortenUrl = stripUrl(url);
  const accountSelected = Object.keys(authList[shortenUrl].isAllowedMap).filter(address => authList[shortenUrl].isAllowedMap[address]);
  return Object.values(accounts).filter(_ref => {
    let {
      json: {
        meta: {
          isHidden
        }
      }
    } = _ref;
    return !isHidden;
  }).filter(_ref2 => {
    let {
      type
    } = _ref2;
    return anyType ? true : (0, _utils.canDerive)(type);
  }).filter(_ref3 => {
    let {
      type
    } = _ref3;
    return type !== 'ethereum';
  }) // Quick fix DApp not allow EVM
  .filter(_ref4 => {
    let {
      json: {
        address
      }
    } = _ref4;
    return accountSelected.includes(address);
  }).sort((a, b) => (a.json.meta.whenCreated || 0) - (b.json.meta.whenCreated || 0)).map(_ref5 => {
    let {
      json: {
        address,
        meta: {
          genesisHash,
          name
        }
      },
      type
    } = _ref5;
    return {
      address,
      genesisHash,
      name,
      type
    };
  });
}

class KoniTabs extends _Tabs.default {
  #koniState;

  constructor(koniState) {
    super(koniState);
    this.#koniState = koniState;
  }

  async accountsListV2(url, _ref6) {
    let {
      anyType
    } = _ref6;
    const authList = await this.#koniState.getAuthList();
    return transformAccountsV2(_accounts.accounts.subject.getValue(), anyType, url, authList);
  }

  accountsSubscribeV2(url, id, port) {
    const cb = (0, _subscriptions.createSubscription)(id, port);

    const subscription = _accounts.accounts.subject.subscribe(accounts => {
      this.#koniState.getAuthorize(value => {
        cb(transformAccountsV2(accounts, false, url, value));
      });
    });

    port.onDisconnect.addListener(() => {
      (0, _subscriptions.unsubscribe)(id);
      subscription.unsubscribe();
    });
    return true;
  }

  authorizeV2(url, request) {
    return this.#koniState.authorizeUrlV2(url, request);
  }

  static getRandom(_ref7) {
    let {
      end,
      start
    } = _ref7;
    return Math.floor(Math.random() * (end - start + 1) + start);
  }

  async handle(id, type, request, url, port) {
    if (type === 'pub(phishing.redirectIfDenied)') {
      return this.redirectIfPhishing(url);
    }

    if (type !== 'pub(authorize.tab)') {
      this.#koniState.ensureUrlAuthorizedV2(url);
    }

    if (type !== 'pub(authorize.tabV2)') {
      this.#koniState.ensureUrlAuthorizedV2(url);
    }

    switch (type) {
      case 'pub(authorize.tabV2)':
        return this.authorizeV2(url, request);

      case 'pub(accounts.listV2)':
        return this.accountsListV2(url, request);

      case 'pub(accounts.subscribeV2)':
        return this.accountsSubscribeV2(url, id, port);

      case 'pub:utils.getRandom':
        return KoniTabs.getRandom(request);

      default:
        return super.handle(id, type, request, url, port);
    }
  }

}

exports.default = KoniTabs;