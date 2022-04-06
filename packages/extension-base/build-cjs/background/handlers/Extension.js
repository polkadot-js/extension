"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.SEED_LENGTHS = exports.SEED_DEFAULT_LENGTH = exports.ETH_DERIVE_DEFAULT = void 0;
exports.getSuri = getSuri;

var _defaults = require("@polkadot/extension-base/defaults");

var _types = require("@polkadot/types");

var _uiKeyring = _interopRequireDefault(require("@polkadot/ui-keyring"));

var _accounts = require("@polkadot/ui-keyring/observable/accounts");

var _util = require("@polkadot/util");

var _utilCrypto = require("@polkadot/util-crypto");

var _helpers = require("./helpers");

var _subscriptions = require("./subscriptions");

// Copyright 2019-2022 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0
const SEED_DEFAULT_LENGTH = 12;
exports.SEED_DEFAULT_LENGTH = SEED_DEFAULT_LENGTH;
const SEED_LENGTHS = [12, 15, 18, 21, 24];
exports.SEED_LENGTHS = SEED_LENGTHS;
const ETH_DERIVE_DEFAULT = '/m/44\'/60\'/0\'/0/0'; // a global registry to use internally

exports.ETH_DERIVE_DEFAULT = ETH_DERIVE_DEFAULT;
const registry = new _types.TypeRegistry();

function getSuri(seed, type) {
  return type === 'ethereum' ? `${seed}${ETH_DERIVE_DEFAULT}` : seed;
}

function transformAccounts(accounts) {
  return Object.values(accounts).map(_ref => {
    let {
      json: {
        address,
        meta
      },
      type
    } = _ref;
    return {
      address,
      ...meta,
      type
    };
  });
}

function isJsonPayload(value) {
  return value.genesisHash !== undefined;
}

class Extension {
  #cachedUnlocks;
  #state;

  constructor(state) {
    this.#cachedUnlocks = {};
    this.#state = state;
  }

  accountsCreateExternal(_ref2) {
    let {
      address,
      genesisHash,
      name
    } = _ref2;

    _uiKeyring.default.addExternal(address, {
      genesisHash,
      name
    });

    return true;
  }

  accountsCreateHardware(_ref3) {
    let {
      accountIndex,
      address,
      addressOffset,
      genesisHash,
      hardwareType,
      name
    } = _ref3;

    _uiKeyring.default.addHardware(address, hardwareType, {
      accountIndex,
      addressOffset,
      genesisHash,
      name
    });

    return true;
  }

  accountsCreateSuri(_ref4) {
    let {
      genesisHash,
      name,
      password,
      suri,
      type
    } = _ref4;

    _uiKeyring.default.addUri(getSuri(suri, type), password, {
      genesisHash,
      name
    }, type);

    return true;
  }

  accountsChangePassword(_ref5) {
    let {
      address,
      newPass,
      oldPass
    } = _ref5;

    const pair = _uiKeyring.default.getPair(address);

    (0, _util.assert)(pair, 'Unable to find pair');

    try {
      if (!pair.isLocked) {
        pair.lock();
      }

      pair.decodePkcs8(oldPass);
    } catch (error) {
      throw new Error('oldPass is invalid');
    }

    _uiKeyring.default.encryptAccount(pair, newPass);

    return true;
  }

  accountsEdit(_ref6) {
    let {
      address,
      name
    } = _ref6;

    const pair = _uiKeyring.default.getPair(address);

    (0, _util.assert)(pair, 'Unable to find pair');

    _uiKeyring.default.saveAccountMeta(pair, { ...pair.meta,
      name
    });

    return true;
  }

  accountsExport(_ref7) {
    let {
      address,
      password
    } = _ref7;
    return {
      exportedJson: _uiKeyring.default.backupAccount(_uiKeyring.default.getPair(address), password)
    };
  } // private async accountsBatchExport ({ addresses, password }: RequestAccountBatchExport): Promise<ResponseAccountsExport> {
  //   return {
  //     exportedJson: await keyring.backupAccounts(addresses, password)
  //   };
  // }


  accountsForget(_ref8) {
    let {
      address
    } = _ref8;

    _uiKeyring.default.forgetAccount(address);

    return true;
  }

  refreshAccountPasswordCache(pair) {
    const {
      address
    } = pair;
    const savedExpiry = this.#cachedUnlocks[address] || 0;
    const remainingTime = savedExpiry - Date.now();

    if (remainingTime < 0) {
      this.#cachedUnlocks[address] = 0;
      pair.lock();
      return 0;
    }

    return remainingTime;
  }

  accountsShow(_ref9) {
    let {
      address,
      isShowing
    } = _ref9;

    const pair = _uiKeyring.default.getPair(address);

    (0, _util.assert)(pair, 'Unable to find pair');

    _uiKeyring.default.saveAccountMeta(pair, { ...pair.meta,
      isHidden: !isShowing
    });

    return true;
  }

  accountsTie(_ref10) {
    let {
      address,
      genesisHash
    } = _ref10;

    const pair = _uiKeyring.default.getPair(address);

    (0, _util.assert)(pair, 'Unable to find pair');

    _uiKeyring.default.saveAccountMeta(pair, { ...pair.meta,
      genesisHash
    });

    return true;
  }

  accountsValidate(_ref11) {
    let {
      address,
      password
    } = _ref11;

    try {
      _uiKeyring.default.backupAccount(_uiKeyring.default.getPair(address), password);

      return true;
    } catch (e) {
      return false;
    }
  } // FIXME This looks very much like what we have in Tabs


  accountsSubscribe(id, port) {
    const cb = (0, _subscriptions.createSubscription)(id, port);

    const subscription = _accounts.accounts.subject.subscribe(accounts => cb(transformAccounts(accounts)));

    port.onDisconnect.addListener(() => {
      (0, _subscriptions.unsubscribe)(id);
      subscription.unsubscribe();
    });
    return true;
  }

  authorizeApprove(_ref12) {
    let {
      id
    } = _ref12;
    const queued = this.#state.getAuthRequest(id);
    (0, _util.assert)(queued, 'Unable to find request');
    const {
      resolve
    } = queued;
    resolve(true);
    return true;
  }

  getAuthList() {
    return {
      list: this.#state.authUrls
    };
  }

  authorizeReject(_ref13) {
    let {
      id
    } = _ref13;
    const queued = this.#state.getAuthRequest(id);
    (0, _util.assert)(queued, 'Unable to find request');
    const {
      reject
    } = queued;
    reject(new Error('Rejected'));
    return true;
  } // FIXME This looks very much like what we have in accounts


  authorizeSubscribe(id, port) {
    const cb = (0, _subscriptions.createSubscription)(id, port);
    const subscription = this.#state.authSubject.subscribe(requests => cb(requests));
    port.onDisconnect.addListener(() => {
      (0, _subscriptions.unsubscribe)(id);
      subscription.unsubscribe();
    });
    return true;
  }

  metadataApprove(_ref14) {
    let {
      id
    } = _ref14;
    const queued = this.#state.getMetaRequest(id);
    (0, _util.assert)(queued, 'Unable to find request');
    const {
      request,
      resolve
    } = queued;
    this.#state.saveMetadata(request);
    resolve(true);
    return true;
  }

  metadataGet(genesisHash) {
    return this.#state.knownMetadata.find(result => result.genesisHash === genesisHash) || null;
  }

  metadataList() {
    return this.#state.knownMetadata;
  }

  metadataReject(_ref15) {
    let {
      id
    } = _ref15;
    const queued = this.#state.getMetaRequest(id);
    (0, _util.assert)(queued, 'Unable to find request');
    const {
      reject
    } = queued;
    reject(new Error('Rejected'));
    return true;
  }

  metadataSubscribe(id, port) {
    const cb = (0, _subscriptions.createSubscription)(id, port);
    const subscription = this.#state.metaSubject.subscribe(requests => cb(requests));
    port.onDisconnect.addListener(() => {
      (0, _subscriptions.unsubscribe)(id);
      subscription.unsubscribe();
    });
    return true;
  }

  jsonRestore(_ref16) {
    let {
      file,
      password
    } = _ref16;

    try {
      _uiKeyring.default.restoreAccount(file, password);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  batchRestore(_ref17) {
    let {
      file,
      password
    } = _ref17;

    try {
      _uiKeyring.default.restoreAccounts(file, password);
    } catch (error) {
      throw new Error(error.message);
    }
  }

  jsonGetAccountInfo(json) {
    try {
      const {
        address,
        meta: {
          genesisHash,
          name
        },
        type
      } = _uiKeyring.default.createFromJson(json);

      return {
        address,
        genesisHash,
        name,
        type
      };
    } catch (e) {
      console.error(e);
      throw new Error(e.message);
    }
  }

  seedCreate(_ref18) {
    let {
      length = SEED_DEFAULT_LENGTH,
      seed: _seed,
      type
    } = _ref18;

    const seed = _seed || (0, _utilCrypto.mnemonicGenerate)(length);

    return {
      address: _uiKeyring.default.createFromUri(getSuri(seed, type), {}, type).address,
      seed
    };
  }

  seedValidate(_ref19) {
    let {
      suri,
      type
    } = _ref19;
    const {
      phrase
    } = (0, _utilCrypto.keyExtractSuri)(suri);

    if ((0, _util.isHex)(phrase)) {
      (0, _util.assert)((0, _util.isHex)(phrase, 256), 'Hex seed needs to be 256-bits');
    } else {
      // sadly isHex detects as string, so we need a cast here
      (0, _util.assert)(SEED_LENGTHS.includes(phrase.split(' ').length), `Mnemonic needs to contain ${SEED_LENGTHS.join(', ')} words`);
      (0, _util.assert)((0, _utilCrypto.mnemonicValidate)(phrase), 'Not a valid mnemonic seed');
    }

    return {
      address: _uiKeyring.default.createFromUri(getSuri(suri, type), {}, type).address,
      suri
    };
  }

  signingApprovePassword(_ref20) {
    let {
      id,
      password,
      savePass
    } = _ref20;
    const queued = this.#state.getSignRequest(id);
    (0, _util.assert)(queued, 'Unable to find request');
    const {
      reject,
      request,
      resolve
    } = queued;

    const pair = _uiKeyring.default.getPair(queued.account.address); // unlike queued.account.address the following
    // address is encoded with the default prefix
    // which what is used for password caching mapping


    const {
      address
    } = pair;

    if (!pair) {
      reject(new Error('Unable to find pair'));
      return false;
    }

    this.refreshAccountPasswordCache(pair); // if the keyring pair is locked, the password is needed

    if (pair.isLocked && !password) {
      reject(new Error('Password needed to unlock the account'));
    }

    if (pair.isLocked) {
      pair.decodePkcs8(password);
    }

    const {
      payload
    } = request;

    if (isJsonPayload(payload)) {
      // Get the metadata for the genesisHash
      const currentMetadata = this.#state.knownMetadata.find(meta => meta.genesisHash === payload.genesisHash); // set the registry before calling the sign function

      registry.setSignedExtensions(payload.signedExtensions, currentMetadata === null || currentMetadata === void 0 ? void 0 : currentMetadata.userExtensions);

      if (currentMetadata) {
        registry.register(currentMetadata === null || currentMetadata === void 0 ? void 0 : currentMetadata.types);
      }
    }

    const result = request.sign(registry, pair);

    if (savePass) {
      this.#cachedUnlocks[address] = Date.now() + _defaults.PASSWORD_EXPIRY_MS;
    } else {
      pair.lock();
    }

    resolve({
      id,
      ...result
    });
    return true;
  }

  signingApproveSignature(_ref21) {
    let {
      id,
      signature
    } = _ref21;
    const queued = this.#state.getSignRequest(id);
    (0, _util.assert)(queued, 'Unable to find request');
    const {
      resolve
    } = queued;
    resolve({
      id,
      signature
    });
    return true;
  }

  signingCancel(_ref22) {
    let {
      id
    } = _ref22;
    const queued = this.#state.getSignRequest(id);
    (0, _util.assert)(queued, 'Unable to find request');
    const {
      reject
    } = queued;
    reject(new Error('Cancelled'));
    return true;
  }

  signingIsLocked(_ref23) {
    let {
      id
    } = _ref23;
    const queued = this.#state.getSignRequest(id);
    (0, _util.assert)(queued, 'Unable to find request');
    const address = queued.request.payload.address;

    const pair = _uiKeyring.default.getPair(address);

    (0, _util.assert)(pair, 'Unable to find pair');
    const remainingTime = this.refreshAccountPasswordCache(pair);
    return {
      isLocked: pair.isLocked,
      remainingTime
    };
  } // FIXME This looks very much like what we have in authorization


  signingSubscribe(id, port) {
    const cb = (0, _subscriptions.createSubscription)(id, port);
    const subscription = this.#state.signSubject.subscribe(requests => cb(requests));
    port.onDisconnect.addListener(() => {
      (0, _subscriptions.unsubscribe)(id);
      subscription.unsubscribe();
    });
    return true;
  }

  windowOpen(path) {
    const url = `${chrome.extension.getURL('index.html')}#${path}`;

    if (!_defaults.ALLOWED_PATH.includes(path)) {
      console.error('Not allowed to open the url:', url);
      return false;
    }

    (0, _helpers.withErrorLog)(() => chrome.tabs.create({
      url
    }));
    return true;
  }

  derive(parentAddress, suri, password, metadata) {
    const parentPair = _uiKeyring.default.getPair(parentAddress);

    try {
      parentPair.decodePkcs8(password);
    } catch (e) {
      throw new Error('invalid password');
    }

    try {
      return parentPair.derive(suri, metadata);
    } catch (err) {
      throw new Error(`"${suri}" is not a valid derivation path`);
    }
  }

  derivationValidate(_ref24) {
    let {
      parentAddress,
      parentPassword,
      suri
    } = _ref24;
    const childPair = this.derive(parentAddress, suri, parentPassword, {});
    return {
      address: childPair.address,
      suri
    };
  }

  derivationCreate(_ref25) {
    let {
      genesisHash,
      name,
      parentAddress,
      parentPassword,
      password,
      suri
    } = _ref25;
    const childPair = this.derive(parentAddress, suri, parentPassword, {
      genesisHash,
      name,
      parentAddress,
      suri
    });

    _uiKeyring.default.addPair(childPair, password);

    return true;
  }

  toggleAuthorization(url) {
    return {
      list: this.#state.toggleAuthorization(url)
    };
  } // Weird thought, the eslint override is not needed in Tabs
  // eslint-disable-next-line @typescript-eslint/require-await


  async handle(id, type, request, port) {
    switch (type) {
      case 'pri(authorize.approve)':
        return this.authorizeApprove(request);

      case 'pri(authorize.list)':
        return this.getAuthList();

      case 'pri(authorize.reject)':
        return this.authorizeReject(request);

      case 'pri(authorize.toggle)':
        return this.toggleAuthorization(request);

      case 'pri(authorize.requests)':
        return this.authorizeSubscribe(id, port);

      case 'pri(accounts.create.external)':
        return this.accountsCreateExternal(request);

      case 'pri(accounts.create.hardware)':
        return this.accountsCreateHardware(request);

      case 'pri(accounts.create.suri)':
        return this.accountsCreateSuri(request);

      case 'pri(accounts.changePassword)':
        return this.accountsChangePassword(request);

      case 'pri(accounts.edit)':
        return this.accountsEdit(request);

      case 'pri(accounts.export)':
        return this.accountsExport(request);

      case 'pri(accounts.batchExport)':
        // return this.accountsBatchExport(request as RequestAccountBatchExport);
        // Disable export all util use master password
        return null;

      case 'pri(accounts.forget)':
        return this.accountsForget(request);

      case 'pri(accounts.show)':
        return this.accountsShow(request);

      case 'pri(accounts.subscribe)':
        return this.accountsSubscribe(id, port);

      case 'pri(accounts.tie)':
        return this.accountsTie(request);

      case 'pri(accounts.validate)':
        return this.accountsValidate(request);

      case 'pri(metadata.approve)':
        return this.metadataApprove(request);

      case 'pri(metadata.get)':
        return this.metadataGet(request);

      case 'pri(metadata.list)':
        return this.metadataList();

      case 'pri(metadata.reject)':
        return this.metadataReject(request);

      case 'pri(metadata.requests)':
        return this.metadataSubscribe(id, port);

      case 'pri(derivation.create)':
        return this.derivationCreate(request);

      case 'pri(derivation.validate)':
        return this.derivationValidate(request);

      case 'pri(json.restore)':
        return this.jsonRestore(request);

      case 'pri(json.batchRestore)':
        return this.batchRestore(request);

      case 'pri(json.account.info)':
        return this.jsonGetAccountInfo(request);

      case 'pri(seed.create)':
        return this.seedCreate(request);

      case 'pri(seed.validate)':
        return this.seedValidate(request);

      case 'pri(settings.notification)':
        return this.#state.setNotification(request);

      case 'pri(signing.approve.password)':
        return this.signingApprovePassword(request);

      case 'pri(signing.approve.signature)':
        return this.signingApproveSignature(request);

      case 'pri(signing.cancel)':
        return this.signingCancel(request);

      case 'pri(signing.isLocked)':
        return this.signingIsLocked(request);

      case 'pri(signing.requests)':
        return this.signingSubscribe(id, port);

      case 'pri(window.open)':
        return this.windowOpen(request);

      default:
        throw new Error(`Unable to handle message of type ${type}`);
    }
  }

}

exports.default = Extension;