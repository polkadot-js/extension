"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.isWeb3Injected = void 0;
Object.defineProperty(exports, "packageInfo", {
  enumerable: true,
  get: function () {
    return _packageInfo.packageInfo;
  }
});
Object.defineProperty(exports, "unwrapBytes", {
  enumerable: true,
  get: function () {
    return _wrapBytes.unwrapBytes;
  }
});
exports.web3Accounts = web3Accounts;
exports.web3AccountsSubscribe = web3AccountsSubscribe;
exports.web3Enable = web3Enable;
exports.web3EnablePromise = void 0;
exports.web3FromAddress = web3FromAddress;
exports.web3FromSource = web3FromSource;
exports.web3ListRpcProviders = web3ListRpcProviders;
exports.web3UseRpcProvider = web3UseRpcProvider;
Object.defineProperty(exports, "wrapBytes", {
  enumerable: true,
  get: function () {
    return _wrapBytes.wrapBytes;
  }
});

var _util = require("@polkadot/util");

var _utilCrypto = require("@polkadot/util-crypto");

var _util2 = require("./util");

var _packageInfo = require("./packageInfo");

var _wrapBytes = require("./wrapBytes");

// Copyright 2019-2022 @polkadot/extension-dapp authors & contributors
// SPDX-License-Identifier: Apache-2.0
// expose utility functions
// just a helper (otherwise we cast all-over, so shorter and more readable)
const win = window; // don't clobber the existing object, but ensure non-undefined

win.injectedWeb3 = win.injectedWeb3 || {}; // true when anything has been injected and is available

function web3IsInjected() {
  return Object.keys(win.injectedWeb3).length !== 0;
} // helper to throw a consistent error when not enabled


function throwError(method) {
  throw new Error(`${method}: web3Enable(originName) needs to be called before ${method}`);
} // internal helper to map from Array<InjectedAccount> -> Array<InjectedAccountWithMeta>


function mapAccounts(source, list, ss58Format) {
  return list.map(_ref => {
    let {
      address,
      genesisHash,
      name,
      type
    } = _ref;
    const encodedAddress = address.length === 42 ? address : (0, _utilCrypto.encodeAddress)((0, _utilCrypto.decodeAddress)(address), ss58Format);
    return {
      address: encodedAddress,
      meta: {
        genesisHash,
        name,
        source
      },
      type
    };
  });
} // have we found a properly constructed window.injectedWeb3


let isWeb3Injected = web3IsInjected(); // we keep the last promise created around (for queries)

exports.isWeb3Injected = isWeb3Injected;
let web3EnablePromise = null;
exports.web3EnablePromise = web3EnablePromise;

function getWindowExtensions(originName) {
  return Promise.all(Object.entries(win.injectedWeb3).map(_ref2 => {
    let [name, {
      enable,
      version
    }] = _ref2;
    return Promise.all([Promise.resolve({
      name,
      version
    }), enable(originName).catch(error => {
      console.error(`Error initializing ${name}: ${error.message}`);
    })]);
  }));
} // enables all the providers found on the injected window interface


function web3Enable(originName) {
  let compatInits = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];

  if (!originName) {
    throw new Error('You must pass a name for your app to the web3Enable function');
  }

  const initCompat = compatInits.length ? Promise.all(compatInits.map(c => c().catch(() => false))) : Promise.resolve([true]);
  exports.web3EnablePromise = web3EnablePromise = (0, _util2.documentReadyPromise)(() => initCompat.then(() => getWindowExtensions(originName).then(values => values.filter(value => !!value[1]).map(_ref3 => {
    let [info, ext] = _ref3;

    // if we don't have an accounts subscriber, add a single-shot version
    if (!ext.accounts.subscribe) {
      ext.accounts.subscribe = cb => {
        ext.accounts.get().then(cb).catch(console.error);
        return () => {// no ubsubscribe needed, this is a single-shot
        };
      };
    }

    return { ...info,
      ...ext
    };
  })).catch(() => []).then(values => {
    const names = values.map(_ref4 => {
      let {
        name,
        version
      } = _ref4;
      return `${name}/${version}`;
    });
    exports.isWeb3Injected = isWeb3Injected = web3IsInjected();
    console.log(`web3Enable: Enabled ${values.length} extension${values.length !== 1 ? 's' : ''}: ${names.join(', ')}`);
    return values;
  })));
  return web3EnablePromise;
} // retrieve all the accounts across all providers


async function web3Accounts() {
  let {
    accountType,
    ss58Format
  } = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

  if (!web3EnablePromise) {
    return throwError('web3Accounts');
  }

  const accounts = [];
  const injected = await web3EnablePromise;
  const retrieved = await Promise.all(injected.map(async _ref5 => {
    let {
      accounts,
      name: source
    } = _ref5;

    try {
      const list = await accounts.get();
      return mapAccounts(source, list.filter(_ref6 => {
        let {
          type
        } = _ref6;
        return type && accountType ? accountType.includes(type) : true;
      }), ss58Format);
    } catch (error) {
      // cannot handle this one
      return [];
    }
  }));
  retrieved.forEach(result => {
    accounts.push(...result);
  });
  const addresses = accounts.map(_ref7 => {
    let {
      address
    } = _ref7;
    return address;
  });
  console.log(`web3Accounts: Found ${accounts.length} address${accounts.length !== 1 ? 'es' : ''}: ${addresses.join(', ')}`);
  return accounts;
}

async function web3AccountsSubscribe(cb) {
  let {
    ss58Format
  } = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

  if (!web3EnablePromise) {
    return throwError('web3AccountsSubscribe');
  }

  const accounts = {};

  const triggerUpdate = () => cb(Object.entries(accounts).reduce((result, _ref8) => {
    let [source, list] = _ref8;
    result.push(...mapAccounts(source, list, ss58Format));
    return result;
  }, []));

  const unsubs = (await web3EnablePromise).map(_ref9 => {
    let {
      accounts: {
        subscribe
      },
      name: source
    } = _ref9;
    return subscribe(result => {
      accounts[source] = result; // eslint-disable-next-line @typescript-eslint/no-floating-promises

      triggerUpdate();
    });
  });
  return () => {
    unsubs.forEach(unsub => {
      unsub();
    });
  };
} // find a specific provider based on the name


async function web3FromSource(source) {
  if (!web3EnablePromise) {
    return throwError('web3FromSource');
  }

  const sources = await web3EnablePromise;
  const found = source && sources.find(_ref10 => {
    let {
      name
    } = _ref10;
    return name === source;
  });

  if (!found) {
    throw new Error(`web3FromSource: Unable to find an injected ${source}`);
  }

  return found;
} // find a specific provider based on an address


async function web3FromAddress(address) {
  if (!web3EnablePromise) {
    return throwError('web3FromAddress');
  }

  const accounts = await web3Accounts();
  let found;

  if (address) {
    const accountU8a = (0, _utilCrypto.decodeAddress)(address);
    found = accounts.find(account => (0, _util.u8aEq)((0, _utilCrypto.decodeAddress)(account.address), accountU8a));
  }

  if (!found) {
    throw new Error(`web3FromAddress: Unable to find injected ${address}`);
  }

  return web3FromSource(found.meta.source);
} // retrieve all providers exposed by one source


async function web3ListRpcProviders(source) {
  const {
    provider
  } = await web3FromSource(source);

  if (!provider) {
    console.warn(`Extension ${source} does not expose any provider`);
    return null;
  }

  return provider.listProviders();
} // retrieve all providers exposed by one source


async function web3UseRpcProvider(source, key) {
  const {
    provider
  } = await web3FromSource(source);

  if (!provider) {
    throw new Error(`Extension ${source} does not expose any provider`);
  }

  const meta = await provider.startProvider(key);
  return {
    meta,
    provider
  };
}