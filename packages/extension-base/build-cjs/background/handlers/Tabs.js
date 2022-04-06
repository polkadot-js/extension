"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _defaults = require("@polkadot/extension-base/defaults");

var _utils = require("@polkadot/extension-base/utils");

var _phishing = require("@polkadot/phishing");

var _uiKeyring = _interopRequireDefault(require("@polkadot/ui-keyring"));

var _accounts = require("@polkadot/ui-keyring/observable/accounts");

var _util = require("@polkadot/util");

var _RequestBytesSign = _interopRequireDefault(require("../RequestBytesSign"));

var _RequestExtrinsicSign = _interopRequireDefault(require("../RequestExtrinsicSign"));

var _helpers = require("./helpers");

var _subscriptions = require("./subscriptions");

// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0
function transformAccounts(accounts) {
  let anyType = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
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
  .sort((a, b) => (a.json.meta.whenCreated || 0) - (b.json.meta.whenCreated || 0)).map(_ref4 => {
    let {
      json: {
        address,
        meta: {
          genesisHash,
          name
        }
      },
      type
    } = _ref4;
    return {
      address,
      genesisHash,
      name,
      type
    };
  });
}

class Tabs {
  #state;

  constructor(state) {
    this.#state = state;
  }

  authorize(url, request) {
    return this.#state.authorizeUrl(url, request);
  } // eslint-disable-next-line @typescript-eslint/no-unused-vars


  accountsList(url, _ref5) {
    let {
      anyType
    } = _ref5;
    return transformAccounts(_accounts.accounts.subject.getValue(), anyType);
  } // FIXME This looks very much like what we have in Extension


  accountsSubscribe(url, id, port) {
    const cb = (0, _subscriptions.createSubscription)(id, port);

    const subscription = _accounts.accounts.subject.subscribe(accounts => cb(transformAccounts(accounts)));

    port.onDisconnect.addListener(() => {
      (0, _subscriptions.unsubscribe)(id);
      subscription.unsubscribe();
    });
    return true;
  }

  getSigningPair(address) {
    const pair = _uiKeyring.default.getPair(address);

    (0, _util.assert)(pair, 'Unable to find keypair');
    return pair;
  }

  bytesSign(url, request) {
    const address = request.address;
    const pair = this.getSigningPair(address);
    return this.#state.sign(url, new _RequestBytesSign.default(request), {
      address,
      ...pair.meta
    });
  }

  extrinsicSign(url, request) {
    const address = request.address;
    const pair = this.getSigningPair(address);
    return this.#state.sign(url, new _RequestExtrinsicSign.default(request), {
      address,
      ...pair.meta
    });
  }

  metadataProvide(url, request) {
    return this.#state.injectMetadata(url, request);
  } // eslint-disable-next-line @typescript-eslint/no-unused-vars


  metadataList(url) {
    return this.#state.knownMetadata.map(_ref6 => {
      let {
        genesisHash,
        specVersion
      } = _ref6;
      return {
        genesisHash,
        specVersion
      };
    });
  }

  rpcListProviders() {
    return this.#state.rpcListProviders();
  }

  rpcSend(request, port) {
    return this.#state.rpcSend(request, port);
  }

  rpcStartProvider(key, port) {
    return this.#state.rpcStartProvider(key, port);
  }

  async rpcSubscribe(request, id, port) {
    const innerCb = (0, _subscriptions.createSubscription)(id, port);

    const cb = (_error, data) => innerCb(data);

    const subscriptionId = await this.#state.rpcSubscribe(request, cb, port);
    port.onDisconnect.addListener(() => {
      (0, _subscriptions.unsubscribe)(id);
      (0, _helpers.withErrorLog)(() => this.rpcUnsubscribe({ ...request,
        subscriptionId
      }, port));
    });
    return true;
  }

  rpcSubscribeConnected(request, id, port) {
    const innerCb = (0, _subscriptions.createSubscription)(id, port);

    const cb = (_error, data) => innerCb(data);

    this.#state.rpcSubscribeConnected(request, cb, port);
    port.onDisconnect.addListener(() => {
      (0, _subscriptions.unsubscribe)(id);
    });
    return Promise.resolve(true);
  }

  async rpcUnsubscribe(request, port) {
    return this.#state.rpcUnsubscribe(request, port);
  }

  redirectPhishingLanding(phishingWebsite) {
    const nonFragment = phishingWebsite.split('#')[0];
    const encodedWebsite = encodeURIComponent(nonFragment);
    const url = `${chrome.extension.getURL('index.html')}#${_defaults.PHISHING_PAGE_REDIRECT}/${encodedWebsite}`;
    chrome.tabs.query({
      url: nonFragment
    }, tabs => {
      tabs.map(_ref7 => {
        let {
          id
        } = _ref7;
        return id;
      }).filter(id => (0, _util.isNumber)(id)).forEach(id => (0, _helpers.withErrorLog)(() => chrome.tabs.update(id, {
        url
      })));
    });
  }

  async redirectIfPhishing(url) {
    const isInDenyList = await (0, _phishing.checkIfDenied)(url);

    if (isInDenyList) {
      this.redirectPhishingLanding(url);
      return true;
    }

    return false;
  }

  async handle(id, type, request, url, port) {
    if (type === 'pub(phishing.redirectIfDenied)') {
      return this.redirectIfPhishing(url);
    }

    if (type !== 'pub(authorize.tab)') {
      this.#state.ensureUrlAuthorized(url);
    }

    switch (type) {
      case 'pub(authorize.tab)':
        return this.authorize(url, request);

      case 'pub(accounts.list)':
        return this.accountsList(url, request);

      case 'pub(accounts.subscribe)':
        return this.accountsSubscribe(url, id, port);

      case 'pub(bytes.sign)':
        return this.bytesSign(url, request);

      case 'pub(extrinsic.sign)':
        return this.extrinsicSign(url, request);

      case 'pub(metadata.list)':
        return this.metadataList(url);

      case 'pub(metadata.provide)':
        return this.metadataProvide(url, request);

      case 'pub(rpc.listProviders)':
        return this.rpcListProviders();

      case 'pub(rpc.send)':
        return this.rpcSend(request, port);

      case 'pub(rpc.startProvider)':
        return this.rpcStartProvider(request, port);

      case 'pub(rpc.subscribe)':
        return this.rpcSubscribe(request, id, port);

      case 'pub(rpc.subscribeConnected)':
        return this.rpcSubscribeConnected(request, id, port);

      case 'pub(rpc.unsubscribe)':
        return this.rpcUnsubscribe(request, port);

      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }

}

exports.default = Tabs;