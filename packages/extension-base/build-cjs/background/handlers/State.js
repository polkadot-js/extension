"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.NotificationOptions = void 0;

var _rxjs = require("rxjs");

var _getId = require("@polkadot/extension-base/utils/getId");

var _extensionChains = require("@polkadot/extension-chains");

var _defaults = require("@polkadot/networks/defaults");

var _uiSettings = _interopRequireDefault(require("@polkadot/ui-settings"));

var _util = require("@polkadot/util");

var _stores = require("../../stores");

var _helpers = require("./helpers");

// Copyright 2019-2022 @polkadot/extension-bg authors & contributors
// SPDX-License-Identifier: Apache-2.0
const NOTIFICATION_URL = chrome.extension.getURL('notification.html');
const POPUP_WINDOW_OPTS = {
  focused: true,
  height: 621,
  left: 150,
  top: 150,
  type: 'popup',
  url: NOTIFICATION_URL,
  width: 460
};
const NORMAL_WINDOW_OPTS = {
  focused: true,
  type: 'normal',
  url: NOTIFICATION_URL
};
let NotificationOptions;
exports.NotificationOptions = NotificationOptions;

(function (NotificationOptions) {
  NotificationOptions[NotificationOptions["None"] = 0] = "None";
  NotificationOptions[NotificationOptions["Normal"] = 1] = "Normal";
  NotificationOptions[NotificationOptions["PopUp"] = 2] = "PopUp";
})(NotificationOptions || (exports.NotificationOptions = NotificationOptions = {}));

const AUTH_URLS_KEY = 'authUrls';

function extractMetadata(store) {
  store.allMap(map => {
    const knownEntries = Object.entries(_defaults.knownGenesis);
    const defs = {};
    const removals = [];
    Object.entries(map).forEach(_ref => {
      let [key, def] = _ref;
      const entry = knownEntries.find(_ref2 => {
        let [, hashes] = _ref2;
        return hashes.includes(def.genesisHash);
      });

      if (entry) {
        const [name, hashes] = entry;
        const index = hashes.indexOf(def.genesisHash); // flatten the known metadata based on the genesis index
        // (lower is better/newer)

        if (!defs[name] || defs[name].index > index) {
          if (defs[name]) {
            // remove the old version of the metadata
            removals.push(defs[name].key);
          }

          defs[name] = {
            def,
            index,
            key
          };
        }
      } else {
        // this is not a known entry, so we will just apply it
        defs[key] = {
          def,
          index: 0,
          key
        };
      }
    });
    removals.forEach(key => store.remove(key));
    Object.values(defs).forEach(_ref3 => {
      let {
        def
      } = _ref3;
      return (0, _extensionChains.addMetadata)(def);
    });
  });
}

class State {
  #authUrls = {};
  #authRequests = {};
  #metaStore = new _stores.MetadataStore(); // Map of providers currently injected in tabs

  #injectedProviders = new Map();
  #metaRequests = {};
  #notification = _uiSettings.default.notification; // Map of all providers exposed by the extension, they are retrievable by key

  #providers;
  #signRequests = {};
  #windows = [];
  authSubject = new _rxjs.BehaviorSubject([]);
  metaSubject = new _rxjs.BehaviorSubject([]);
  signSubject = new _rxjs.BehaviorSubject([]);

  constructor() {
    let providers = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    this.#providers = providers;
    extractMetadata(this.#metaStore); // retrieve previously set authorizations

    const authString = localStorage.getItem(AUTH_URLS_KEY) || '{}';
    const previousAuth = JSON.parse(authString);
    this.#authUrls = previousAuth;
  }

  get knownMetadata() {
    return (0, _extensionChains.knownMetadata)();
  }

  get numAuthRequests() {
    return Object.keys(this.#authRequests).length;
  }

  get numMetaRequests() {
    return Object.keys(this.#metaRequests).length;
  }

  get numSignRequests() {
    return Object.keys(this.#signRequests).length;
  }

  get allAuthRequests() {
    return Object.values(this.#authRequests).map(_ref4 => {
      let {
        id,
        request,
        url
      } = _ref4;
      return {
        id,
        request,
        url
      };
    });
  }

  get allMetaRequests() {
    return Object.values(this.#metaRequests).map(_ref5 => {
      let {
        id,
        request,
        url
      } = _ref5;
      return {
        id,
        request,
        url
      };
    });
  }

  get allSignRequests() {
    return Object.values(this.#signRequests).map(_ref6 => {
      let {
        account,
        id,
        request,
        url
      } = _ref6;
      return {
        account,
        id,
        request,
        url
      };
    });
  }

  get authUrls() {
    return this.#authUrls;
  }

  popupClose() {
    this.#windows.forEach(id => (0, _helpers.withErrorLog)(() => chrome.windows.remove(id)));
    this.#windows = [];
  }

  popupOpen() {
    this.#notification !== 'extension' && chrome.windows.create(this.#notification === 'window' ? NORMAL_WINDOW_OPTS : POPUP_WINDOW_OPTS, window => {
      if (window) {
        this.#windows.push(window.id || 0);
      }
    });
  }

  authComplete = (id, resolve, reject) => {
    const complete = result => {
      const isAllowed = result === true;
      const {
        idStr,
        request: {
          origin
        },
        url
      } = this.#authRequests[id];
      const isAllowedMap = {};
      this.#authUrls[this.stripUrl(url)] = {
        count: 0,
        id: idStr,
        isAllowed,
        isAllowedMap,
        origin,
        url
      };
      this.saveCurrentAuthList();
      delete this.#authRequests[id];
      this.updateIconAuth(true);
    };

    return {
      reject: error => {
        complete(error);
        reject(error);
      },
      resolve: result => {
        complete(result);
        resolve(result);
      }
    };
  };

  saveCurrentAuthList() {
    localStorage.setItem(AUTH_URLS_KEY, JSON.stringify(this.#authUrls));
  }

  metaComplete = (id, resolve, reject) => {
    const complete = () => {
      delete this.#metaRequests[id];
      this.updateIconMeta(true);
    };

    return {
      reject: error => {
        complete();
        reject(error);
      },
      resolve: result => {
        complete();
        resolve(result);
      }
    };
  };
  signComplete = (id, resolve, reject) => {
    const complete = () => {
      delete this.#signRequests[id];
      this.updateIconSign(true);
    };

    return {
      reject: error => {
        complete();
        reject(error);
      },
      resolve: result => {
        complete();
        resolve(result);
      }
    };
  };

  stripUrl(url) {
    (0, _util.assert)(url && (url.startsWith('http:') || url.startsWith('https:') || url.startsWith('ipfs:') || url.startsWith('ipns:')), `Invalid url ${url}, expected to start with http: or https: or ipfs: or ipns:`);
    const parts = url.split('/');
    return parts[2];
  }

  updateIcon(shouldClose) {
    const authCount = this.numAuthRequests;
    const metaCount = this.numMetaRequests;
    const signCount = this.numSignRequests;
    const text = authCount ? 'Auth' : metaCount ? 'Meta' : signCount ? `${signCount}` : '';
    (0, _helpers.withErrorLog)(() => chrome.browserAction.setBadgeText({
      text
    }));

    if (shouldClose && text === '') {
      this.popupClose();
    }
  }

  toggleAuthorization(url) {
    const entry = this.#authUrls[url];
    (0, _util.assert)(entry, `The source ${url} is not known`);
    this.#authUrls[url].isAllowed = !entry.isAllowed;
    this.saveCurrentAuthList();
    return this.#authUrls;
  }

  updateIconAuth(shouldClose) {
    this.authSubject.next(this.allAuthRequests);
    this.updateIcon(shouldClose);
  }

  updateIconMeta(shouldClose) {
    this.metaSubject.next(this.allMetaRequests);
    this.updateIcon(shouldClose);
  }

  updateIconSign(shouldClose) {
    this.signSubject.next(this.allSignRequests);
    this.updateIcon(shouldClose);
  }

  async authorizeUrl(url, request) {
    const idStr = this.stripUrl(url); // Do not enqueue duplicate authorization requests.

    const isDuplicate = Object.values(this.#authRequests).some(request => request.idStr === idStr);
    (0, _util.assert)(!isDuplicate, `The source ${url} has a pending authorization request`);

    if (this.#authUrls[idStr]) {
      // this url was seen in the past
      (0, _util.assert)(this.#authUrls[idStr].isAllowed, `The source ${url} is not allowed to interact with this extension`);
      return false;
    }

    return new Promise((resolve, reject) => {
      const id = (0, _getId.getId)();
      this.#authRequests[id] = { ...this.authComplete(id, resolve, reject),
        id,
        idStr,
        request,
        url
      };
      this.updateIconAuth();
      this.popupOpen();
    });
  }

  ensureUrlAuthorized(url) {
    const entry = this.#authUrls[this.stripUrl(url)];
    (0, _util.assert)(entry, `The source ${url} has not been enabled yet`);
    (0, _util.assert)(entry.isAllowed, `The source ${url} is not allowed to interact with this extension`);
    return true;
  }

  injectMetadata(url, request) {
    return new Promise((resolve, reject) => {
      const id = (0, _getId.getId)();
      this.#metaRequests[id] = { ...this.metaComplete(id, resolve, reject),
        id,
        request,
        url
      };
      this.updateIconMeta();
      this.popupOpen();
    });
  }

  getAuthRequest(id) {
    return this.#authRequests[id];
  }

  getMetaRequest(id) {
    return this.#metaRequests[id];
  }

  getSignRequest(id) {
    return this.#signRequests[id];
  } // List all providers the extension is exposing


  rpcListProviders() {
    return Promise.resolve(Object.keys(this.#providers).reduce((acc, key) => {
      acc[key] = this.#providers[key].meta;
      return acc;
    }, {}));
  }

  rpcSend(request, port) {
    const provider = this.#injectedProviders.get(port);
    (0, _util.assert)(provider, 'Cannot call pub(rpc.subscribe) before provider is set');
    return provider.send(request.method, request.params);
  } // Start a provider, return its meta


  rpcStartProvider(key, port) {
    (0, _util.assert)(Object.keys(this.#providers).includes(key), `Provider ${key} is not exposed by extension`);

    if (this.#injectedProviders.get(port)) {
      return Promise.resolve(this.#providers[key].meta);
    } // Instantiate the provider


    this.#injectedProviders.set(port, this.#providers[key].start()); // Close provider connection when page is closed

    port.onDisconnect.addListener(() => {
      const provider = this.#injectedProviders.get(port);

      if (provider) {
        (0, _helpers.withErrorLog)(() => provider.disconnect());
      }

      this.#injectedProviders.delete(port);
    });
    return Promise.resolve(this.#providers[key].meta);
  }

  rpcSubscribe(_ref7, cb, port) {
    let {
      method,
      params,
      type
    } = _ref7;
    const provider = this.#injectedProviders.get(port);
    (0, _util.assert)(provider, 'Cannot call pub(rpc.subscribe) before provider is set');
    return provider.subscribe(type, method, params, cb);
  }

  rpcSubscribeConnected(_request, cb, port) {
    const provider = this.#injectedProviders.get(port);
    (0, _util.assert)(provider, 'Cannot call pub(rpc.subscribeConnected) before provider is set');
    cb(null, provider.isConnected); // Immediately send back current isConnected

    provider.on('connected', () => cb(null, true));
    provider.on('disconnected', () => cb(null, false));
  }

  rpcUnsubscribe(request, port) {
    const provider = this.#injectedProviders.get(port);
    (0, _util.assert)(provider, 'Cannot call pub(rpc.unsubscribe) before provider is set');
    return provider.unsubscribe(request.type, request.method, request.subscriptionId);
  }

  saveMetadata(meta) {
    this.#metaStore.set(meta.genesisHash, meta);
    (0, _extensionChains.addMetadata)(meta);
  }

  setNotification(notification) {
    this.#notification = notification;
    return true;
  }

  sign(url, request, account) {
    const id = (0, _getId.getId)();
    return new Promise((resolve, reject) => {
      this.#signRequests[id] = { ...this.signComplete(id, resolve, reject),
        account,
        id,
        request,
        url
      };
      this.updateIconSign();
      this.popupOpen();
    });
  }

}

exports.default = State;