"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _common = _interopRequireDefault(require("@ethereumjs/common"));

var _ethereumjsTx = require("ethereumjs-tx");

var _Extension = _interopRequireWildcard(require("@polkadot/extension-base/background/handlers/Extension"));

var _subscriptions = require("@polkadot/extension-base/background/handlers/subscriptions");

var _KoniTypes = require("@polkadot/extension-base/background/KoniTypes");

var _dotsama = require("@polkadot/extension-koni-base/api/dotsama");

var _balance = require("@polkadot/extension-koni-base/api/dotsama/balance");

var _registry = require("@polkadot/extension-koni-base/api/dotsama/registry");

var _transfer = require("@polkadot/extension-koni-base/api/dotsama/transfer");

var _endpoints = _interopRequireDefault(require("@polkadot/extension-koni-base/api/endpoints"));

var _config = require("@polkadot/extension-koni-base/api/nft/config");

var _transfer2 = require("@polkadot/extension-koni-base/api/web3/transfer");

var _web = require("@polkadot/extension-koni-base/api/web3/web3");

var _index = require("@polkadot/extension-koni-base/background/handlers/index");

var _constants = require("@polkadot/extension-koni-base/constants");

var _utils = require("@polkadot/extension-koni-base/utils/utils");

var _keyring = require("@polkadot/keyring");

var _decode = require("@polkadot/keyring/pair/decode");

var _uiKeyring = _interopRequireDefault(require("@polkadot/ui-keyring"));

var _accounts = require("@polkadot/ui-keyring/observable/accounts");

var _util = require("@polkadot/util");

var _utilCrypto = require("@polkadot/util-crypto");

function _getRequireWildcardCache(nodeInterop) { if (typeof WeakMap !== "function") return null; var cacheBabelInterop = new WeakMap(); var cacheNodeInterop = new WeakMap(); return (_getRequireWildcardCache = function (nodeInterop) { return nodeInterop ? cacheNodeInterop : cacheBabelInterop; })(nodeInterop); }

function _interopRequireWildcard(obj, nodeInterop) { if (!nodeInterop && obj && obj.__esModule) { return obj; } if (obj === null || typeof obj !== "object" && typeof obj !== "function") { return { default: obj }; } var cache = _getRequireWildcardCache(nodeInterop); if (cache && cache.has(obj)) { return cache.get(obj); } var newObj = {}; var hasPropertyDescriptor = Object.defineProperty && Object.getOwnPropertyDescriptor; for (var key in obj) { if (key !== "default" && Object.prototype.hasOwnProperty.call(obj, key)) { var desc = hasPropertyDescriptor ? Object.getOwnPropertyDescriptor(obj, key) : null; if (desc && (desc.get || desc.set)) { Object.defineProperty(newObj, key, desc); } else { newObj[key] = obj[key]; } } } newObj.default = obj; if (cache) { cache.set(obj, newObj); } return newObj; }

// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0
const bWindow = window;
const ETH_DERIVE_DEFAULT = '/m/44\'/60\'/0\'/0/0';

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

const ACCOUNT_ALL_JSON = {
  address: _constants.ALL_ACCOUNT_KEY,
  name: 'All'
};

class KoniExtension extends _Extension.default {
  decodeAddress = (key, ignoreChecksum, ss58Format) => {
    return _uiKeyring.default.decodeAddress(key, ignoreChecksum, ss58Format);
  };
  encodeAddress = (key, ss58Format) => {
    return _uiKeyring.default.encodeAddress(key, ss58Format);
  };

  accountExportPrivateKey(_ref2) {
    let {
      address,
      password
    } = _ref2;

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    const exportedJson = _uiKeyring.default.backupAccount(_uiKeyring.default.getPair(address), password); // eslint-disable-next-line @typescript-eslint/no-unsafe-argument


    const decoded = (0, _decode.decodePair)(password, (0, _utilCrypto.base64Decode)(exportedJson.encoded), exportedJson.encoding.type);
    return {
      privateKey: (0, _util.u8aToHex)(decoded.secretKey)
    };
  }

  accountsGetAllWithCurrentAddress(id, port) {
    const cb = (0, _subscriptions.createSubscription)(id, port);

    const subscription = _accounts.accounts.subject.subscribe(storedAccounts => {
      const transformedAccounts = transformAccounts(storedAccounts);
      const accounts = transformedAccounts && transformedAccounts.length ? [{ ...ACCOUNT_ALL_JSON
      }, ...transformedAccounts] : [];
      console.log('storedAccounts====', storedAccounts);
      console.log('accounts====', accounts);
      const accountsWithCurrentAddress = {
        accounts
      };

      _index.state.getCurrentAccount(accountInfo => {
        if (accountInfo) {
          accountsWithCurrentAddress.currentAddress = accountInfo.address;
          accountsWithCurrentAddress.isShowBalance = accountInfo.isShowBalance;
          accountsWithCurrentAddress.allAccountLogo = accountInfo.allAccountLogo;
        }

        cb(accountsWithCurrentAddress);
      });
    });

    port.onDisconnect.addListener(() => {
      (0, _subscriptions.unsubscribe)(id);
      subscription.unsubscribe();
    });
    return true;
  }

  triggerAccountsSubscription() {
    const accountsSubject = _accounts.accounts.subject;
    accountsSubject.next(accountsSubject.getValue());
    return true;
  }

  _getAuthListV2() {
    return new Promise((resolve, reject) => {
      _index.state.getAuthorize(rs => {
        resolve(rs);
      });
    });
  }

  authorizeSubscribeV2(id, port) {
    const cb = (0, _subscriptions.createSubscription)(id, port);

    const subscription = _index.state.authSubjectV2.subscribe(requests => cb(requests));

    port.onDisconnect.addListener(() => {
      (0, _subscriptions.unsubscribe)(id);
      subscription.unsubscribe();
    });
    return true;
  }

  async getAuthListV2() {
    const authList = await this._getAuthListV2();
    return {
      list: authList
    };
  }

  authorizeApproveV2(_ref3) {
    let {
      accounts,
      id
    } = _ref3;

    const queued = _index.state.getAuthRequestV2(id);

    (0, _util.assert)(queued, 'Unable to find request');
    const {
      resolve
    } = queued;
    resolve({
      accounts,
      result: true
    });
    return true;
  }

  authorizeRejectV2(_ref4) {
    let {
      id
    } = _ref4;

    const queued = _index.state.getAuthRequestV2(id);

    (0, _util.assert)(queued, 'Unable to find request');
    const {
      reject
    } = queued;
    reject(new Error('Rejected'));
    return true;
  }

  _forgetSite(url, callBack) {
    _index.state.getAuthorize(value => {
      (0, _util.assert)(value, 'The source is not known');
      delete value[url];

      _index.state.setAuthorize(value, () => {
        callBack && callBack(value);
      });
    });
  }

  forgetSite(data, id, port) {
    const cb = (0, _subscriptions.createSubscription)(id, port);

    this._forgetSite(data.url, items => {
      cb(items);
    });

    return true;
  }

  _forgetAllSite(callBack) {
    _index.state.getAuthorize(value => {
      (0, _util.assert)(value, 'The source is not known');
      value = {};

      _index.state.setAuthorize(value, () => {
        callBack && callBack(value);
      });
    });
  }

  forgetAllSite(id, port) {
    const cb = (0, _subscriptions.createSubscription)(id, port);

    this._forgetAllSite(items => {
      cb(items);
    });

    return true;
  }

  _changeAuthorizationAll(connectValue, callBack) {
    _index.state.getAuthorize(value => {
      (0, _util.assert)(value, 'The source is not known');
      Object.keys(value).forEach(url => {
        // eslint-disable-next-line no-return-assign
        Object.keys(value[url].isAllowedMap).forEach(address => value[url].isAllowedMap[address] = connectValue);
      });

      _index.state.setAuthorize(value, () => {
        callBack && callBack(value);
      });
    });
  }

  changeAuthorizationAll(data, id, port) {
    const cb = (0, _subscriptions.createSubscription)(id, port);

    this._changeAuthorizationAll(data.connectValue, items => {
      cb(items);
    });

    return true;
  }

  _changeAuthorization(url, connectValue, callBack) {
    _index.state.getAuthorize(value => {
      (0, _util.assert)(value, 'The source is not known'); // eslint-disable-next-line no-return-assign

      Object.keys(value[url].isAllowedMap).forEach(address => value[url].isAllowedMap[address] = connectValue);

      _index.state.setAuthorize(value, () => {
        callBack && callBack(value);
      });
    });
  }

  changeAuthorization(data, id, port) {
    const cb = (0, _subscriptions.createSubscription)(id, port);

    this._changeAuthorization(data.url, data.connectValue, items => {
      cb(items);
    });

    return true;
  }

  _changeAuthorizationPerAcc(address, connectValue, url, callBack) {
    _index.state.getAuthorize(value => {
      (0, _util.assert)(value, 'The source is not known');
      value[url].isAllowedMap[address] = connectValue;

      _index.state.setAuthorize(value, () => {
        callBack && callBack(value);
      });
    });
  }

  changeAuthorizationPerAcc(data, id, port) {
    const cb = (0, _subscriptions.createSubscription)(id, port);

    this._changeAuthorizationPerAcc(data.address, data.connectValue, data.url, items => {
      cb(items);
    });

    return true;
  }

  _saveCurrentAccountAddress(address, isShowBalance, allAccountLogo, callback) {
    _index.state.getCurrentAccount(accountInfo => {
      if (!accountInfo) {
        accountInfo = {
          address
        };
      } else {
        accountInfo.address = address;
        accountInfo.isShowBalance = !!isShowBalance;

        if (allAccountLogo) {
          accountInfo.allAccountLogo = allAccountLogo;
        }
      }

      _index.state.setCurrentAccount(accountInfo, callback);
    });
  }

  saveCurrentAccountAddress(data, id, port) {
    const cb = (0, _subscriptions.createSubscription)(id, port);

    this._saveCurrentAccountAddress(data.address, data.isShowBalance, data.allAccountLogo, () => {
      cb(data);
    });

    port.onDisconnect.addListener(() => {
      (0, _subscriptions.unsubscribe)(id);
    });
    return true;
  }

  getPrice() {
    return new Promise((resolve, reject) => {
      _index.state.getPrice(rs => {
        resolve(rs);
      });
    });
  }

  subscribePrice(id, port) {
    const cb = (0, _subscriptions.createSubscription)(id, port);

    const priceSubscription = _index.state.subscribePrice().subscribe({
      next: rs => {
        cb(rs);
      }
    });

    port.onDisconnect.addListener(() => {
      (0, _subscriptions.unsubscribe)(id);
      priceSubscription.unsubscribe();
    });
    return this.getPrice();
  }

  getBalance() {
    return _index.state.getBalance();
  }

  subscribeBalance(id, port) {
    const cb = (0, _subscriptions.createSubscription)(id, port);

    const balanceSubscription = _index.state.subscribeBalance().subscribe({
      next: rs => {
        cb(rs);
      }
    });

    port.onDisconnect.addListener(() => {
      (0, _subscriptions.unsubscribe)(id);
      balanceSubscription.unsubscribe();
    });
    return this.getBalance();
  }

  getCrowdloan() {
    return _index.state.getCrowdloan();
  }

  subscribeCrowdloan(id, port) {
    const cb = (0, _subscriptions.createSubscription)(id, port);

    const balanceSubscription = _index.state.subscribeCrowdloan().subscribe({
      next: rs => {
        cb(rs);
      }
    });

    port.onDisconnect.addListener(() => {
      (0, _subscriptions.unsubscribe)(id);
      balanceSubscription.unsubscribe();
    });
    return this.getCrowdloan();
  }

  getChainRegistryMap() {
    return _index.state.getChainRegistryMap();
  }

  subscribeChainRegistry(id, port) {
    const cb = (0, _subscriptions.createSubscription)(id, port);

    const subscription = _index.state.subscribeChainRegistryMap().subscribe({
      next: rs => {
        cb(rs);
      }
    });

    port.onDisconnect.addListener(() => {
      (0, _subscriptions.unsubscribe)(id);
      subscription.unsubscribe();
    });
    return this.getChainRegistryMap();
  }

  validatePassword(json, password) {
    const cryptoType = Array.isArray(json.encoding.content) ? json.encoding.content[1] : 'ed25519';
    const encType = Array.isArray(json.encoding.type) ? json.encoding.type : [json.encoding.type];
    const pair = (0, _keyring.createPair)({
      toSS58: this.encodeAddress,
      type: cryptoType
    }, {
      publicKey: this.decodeAddress(json.address, true)
    }, json.meta, (0, _util.isHex)(json.encoded) ? (0, _util.hexToU8a)(json.encoded) : (0, _utilCrypto.base64Decode)(json.encoded), encType); // unlock then lock (locking cleans secretKey, so needs to be last)

    try {
      pair.decodePkcs8(password);
      pair.lock();
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  }

  validatedAccountsPassword(json, password) {
    try {
      (0, _util.u8aToString)((0, _utilCrypto.jsonDecrypt)(json, password));
      return true;
    } catch (e) {
      return false;
    }
  }

  async accountsCreateSuriV2(_ref5) {
    let {
      genesisHash,
      name,
      password,
      suri: _suri,
      types
    } = _ref5;
    const addressDict = {};
    types === null || types === void 0 ? void 0 : types.forEach(type => {
      const suri = getSuri(_suri, type);

      const address = _uiKeyring.default.createFromUri(suri, {}, type).address;

      addressDict[type] = address;
      const newAccountName = type === 'ethereum' ? `${name} - EVM` : name;

      this._saveCurrentAccountAddress(address, false, '', () => {
        _uiKeyring.default.addUri(suri, password, {
          genesisHash,
          name: newAccountName
        }, type);
      });
    });
    await new Promise(resolve => {
      _index.state.addAccountRef(Object.values(addressDict), () => {
        resolve();
      });
    });
    return addressDict;
  }

  async accountsForgetOverride(_ref6) {
    let {
      address
    } = _ref6;

    _uiKeyring.default.forgetAccount(address);

    await new Promise(resolve => {
      _index.state.removeAccountRef(address, () => {
        resolve();
      });
    });
    return true;
  }

  seedCreateV2(_ref7) {
    let {
      length = _Extension.SEED_DEFAULT_LENGTH,
      seed: _seed,
      types
    } = _ref7;

    const seed = _seed || (0, _utilCrypto.mnemonicGenerate)(length);

    const rs = {
      seed: seed,
      addressMap: {}
    };
    types === null || types === void 0 ? void 0 : types.forEach(type => {
      rs.addressMap[type] = _uiKeyring.default.createFromUri(getSuri(seed, type), {}, type).address;
    });
    console.log('linkMapOK');

    _index.state.getAccountRefMap(map => {
      console.log('linkMap', map);
    });

    return rs;
  }

  seedValidateV2(_ref8) {
    let {
      suri,
      types
    } = _ref8;
    const {
      phrase
    } = (0, _utilCrypto.keyExtractSuri)(suri);

    if ((0, _util.isHex)(phrase)) {
      (0, _util.assert)((0, _util.isHex)(phrase, 256), 'Hex seed needs to be 256-bits');
    } else {
      // sadly isHex detects as string, so we need a cast here
      (0, _util.assert)(_Extension.SEED_LENGTHS.includes(phrase.split(' ').length), `Mnemonic needs to contain ${_Extension.SEED_LENGTHS.join(', ')} words`);
      (0, _util.assert)((0, _utilCrypto.mnemonicValidate)(phrase), 'Not a valid mnemonic seed');
    }

    const rs = {
      seed: suri,
      addressMap: {}
    };
    types && types.forEach(type => {
      rs.addressMap[type] = _uiKeyring.default.createFromUri(getSuri(suri, type), {}, type).address;
    });
    return rs;
  }

  deriveV2(parentAddress, suri, password, metadata) {
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

  derivationCreateV2(_ref9) {
    let {
      genesisHash,
      name,
      parentAddress,
      parentPassword,
      password,
      suri
    } = _ref9;
    const childPair = this.deriveV2(parentAddress, suri, parentPassword, {
      genesisHash,
      name,
      parentAddress,
      suri
    });
    const address = childPair.address;

    this._saveCurrentAccountAddress(address, false, '', () => {
      _uiKeyring.default.addPair(childPair, password);
    });

    return true;
  }

  jsonRestoreV2(_ref10) {
    let {
      address,
      file,
      password
    } = _ref10;
    const isPasswordValidated = this.validatePassword(file, password);

    if (isPasswordValidated) {
      try {
        this._saveCurrentAccountAddress(address, false, '', () => {
          _uiKeyring.default.restoreAccount(file, password);
        });
      } catch (error) {
        throw new Error(error.message);
      }
    } else {
      throw new Error('Unable to decode using the supplied passphrase');
    }
  }

  batchRestoreV2(_ref11) {
    let {
      address,
      file,
      password
    } = _ref11;
    const isPasswordValidated = this.validatedAccountsPassword(file, password);

    if (isPasswordValidated) {
      try {
        this._saveCurrentAccountAddress(address, false, '', () => {
          _uiKeyring.default.restoreAccounts(file, password);
        });
      } catch (error) {
        throw new Error(error.message);
      }
    } else {
      throw new Error('Unable to decode using the supplied passphrase');
    }
  }

  getNftTransfer() {
    return new Promise((resolve, reject) => {
      _index.state.getNftTransferSubscription(rs => {
        resolve(rs);
      });
    });
  }

  async subscribeNftTransfer(id, port) {
    const cb = (0, _subscriptions.createSubscription)(id, port);

    const nftTransferSubscription = _index.state.subscribeNftTransfer().subscribe({
      next: rs => {
        cb(rs);
      }
    });

    port.onDisconnect.addListener(() => {
      (0, _subscriptions.unsubscribe)(id);
      nftTransferSubscription.unsubscribe();
    });
    return this.getNftTransfer();
  }

  getNftCollection() {
    return new Promise(resolve => {
      _index.state.getNftCollectionSubscription(rs => {
        resolve(rs);
      });
    });
  }

  subscribeNftCollection(id, port) {
    const cb = (0, _subscriptions.createSubscription)(id, port);

    const nftCollectionSubscription = _index.state.subscribeNftCollection().subscribe({
      next: rs => {
        cb(rs);
      }
    });

    port.onDisconnect.addListener(() => {
      (0, _subscriptions.unsubscribe)(id);
      nftCollectionSubscription.unsubscribe();
    });
    return this.getNftCollection();
  }

  getNft() {
    return new Promise(resolve => {
      _index.state.getNftSubscription(rs => {
        resolve(rs);
      });
    });
  }

  async subscribeNft(id, port) {
    const cb = (0, _subscriptions.createSubscription)(id, port);

    const nftSubscription = _index.state.subscribeNft().subscribe({
      next: rs => {
        cb(rs);
      }
    });

    port.onDisconnect.addListener(() => {
      (0, _subscriptions.unsubscribe)(id);
      nftSubscription.unsubscribe();
    });
    return this.getNft();
  }

  getStakingReward() {
    return new Promise((resolve, reject) => {
      _index.state.getStakingReward(rs => {
        resolve(rs);
      });
    });
  }

  subscribeStakingReward(id, port) {
    const cb = (0, _subscriptions.createSubscription)(id, port);

    const stakingRewardSubscription = _index.state.subscribeStakingReward().subscribe({
      next: rs => {
        cb(rs);
      }
    });

    port.onDisconnect.addListener(() => {
      (0, _subscriptions.unsubscribe)(id);
      stakingRewardSubscription.unsubscribe();
    });
    return this.getStakingReward();
  }

  getStaking() {
    return _index.state.getStaking();
  }

  subscribeStaking(id, port) {
    const cb = (0, _subscriptions.createSubscription)(id, port);

    const stakingSubscription = _index.state.subscribeStaking().subscribe({
      next: rs => {
        cb(rs);
      }
    });

    port.onDisconnect.addListener(() => {
      (0, _subscriptions.unsubscribe)(id);
      stakingSubscription.unsubscribe();
    });
    return this.getStaking();
  } // todo: add custom network metadata to here


  networkMetadataList() {
    const result = [];
    Object.keys(_endpoints.default).forEach(networkKey => {
      const {
        chain,
        genesisHash,
        groups,
        icon,
        isEthereum,
        paraId,
        ss58Format
      } = _endpoints.default[networkKey];
      let isAvailable = true; // todo: add more logic in further update

      if (!genesisHash || genesisHash.toLowerCase() === 'unknown') {
        isAvailable = false;
      }

      result.push({
        chain,
        networkKey,
        genesisHash,
        icon: isEthereum ? 'ethereum' : icon || 'polkadot',
        ss58Format,
        groups,
        isEthereum: !!isEthereum,
        paraId,
        isAvailable
      });
    });
    return result;
  }

  apiInit(_ref12) {
    let {
      networkKey
    } = _ref12;
    const {
      apisMap
    } = bWindow.pdotApi; // eslint-disable-next-line no-prototype-builtins

    if (!_index.rpcsMap.hasOwnProperty(networkKey) || !_index.rpcsMap[networkKey]) {
      console.log('not support');
      return _KoniTypes.ApiInitStatus.NOT_SUPPORT;
    }

    if (apisMap[networkKey]) {
      console.log('existed');
      return _KoniTypes.ApiInitStatus.ALREADY_EXIST;
    }

    apisMap[networkKey] = (0, _dotsama.initApi)(networkKey, _index.rpcsMap[networkKey]);
    return _KoniTypes.ApiInitStatus.SUCCESS;
  }

  subscribeHistory(id, port) {
    const cb = (0, _subscriptions.createSubscription)(id, port);

    const historySubscription = _index.state.subscribeHistory().subscribe({
      next: rs => {
        cb(rs);
      }
    });

    port.onDisconnect.addListener(() => {
      (0, _subscriptions.unsubscribe)(id);
      historySubscription.unsubscribe();
    });
    return _index.state.getHistoryMap();
  }

  updateTransactionHistory(_ref13, id, port) {
    let {
      address,
      item,
      networkKey
    } = _ref13;
    const cb = (0, _subscriptions.createSubscription)(id, port);

    _index.state.setTransactionHistory(address, networkKey, item, items => {
      cb(items);
    });

    port.onDisconnect.addListener(() => {
      (0, _subscriptions.unsubscribe)(id);
    });
    return true;
  }

  setNftTransfer(request) {
    _index.state.setNftTransfer(request);

    return true;
  }

  forceUpdateNftState(request) {
    let selectedNftCollection = {
      collectionId: ''
    };

    const nftJson = _index.state.getNft();

    const nftCollectionJson = _index.state.getNftCollection();

    const filteredCollections = [];
    const filteredItems = [];
    const remainedItems = [];
    let itemCount = 0; // count item left in collection

    for (const collection of nftCollectionJson.nftCollectionList) {
      if (collection.chain === request.chain && collection.collectionId === request.collectionId) {
        selectedNftCollection = collection;
        break;
      }
    }

    if (!request.isSendingSelf) {
      for (const item of nftJson.nftList) {
        if (item.chain === request.chain && item.collectionId === request.collectionId) {
          if (item.id !== request.nft.id) {
            itemCount += 1;
            filteredItems.push(item);
            remainedItems.push(item);
          }
        } else {
          filteredItems.push(item);
        }
      }

      _index.state.setNft({
        nftList: filteredItems
      });

      if (itemCount <= 0) {
        for (const collection of nftCollectionJson.nftCollectionList) {
          if (collection.chain !== request.chain || collection.collectionId !== request.collectionId) {
            filteredCollections.push(collection);
          }
        }

        _index.state.setNftCollection({
          ready: true,
          nftCollectionList: filteredCollections
        });
      }
    } else {
      for (const item of nftJson.nftList) {
        if (item.chain === request.chain && item.collectionId === request.collectionId) {
          remainedItems.push(item);
        }
      }
    }

    _index.state.setNftTransfer({
      cronUpdate: false,
      forceUpdate: true,
      selectedNftCollection,
      nftItems: remainedItems
    });

    console.log('force update nft state done');
    return true;
  }

  async validateTransfer(networkKey, token, from, to, password, value, transferAll) {
    const errors = [];
    let keypair;
    let transferValue;

    if (!transferAll) {
      try {
        if (value === undefined) {
          errors.push({
            code: _KoniTypes.TransferErrorCode.INVALID_VALUE,
            message: 'Require transfer value'
          });
        }

        if (value) {
          transferValue = new _util.BN(value);
        }
      } catch (e) {
        errors.push({
          code: _KoniTypes.TransferErrorCode.INVALID_VALUE,
          // @ts-ignore
          message: String(e.message)
        });
      }
    }

    try {
      keypair = _uiKeyring.default.getPair(from);

      if (password) {
        keypair.unlock(password);
      }
    } catch (e) {
      errors.push({
        code: _KoniTypes.TransferErrorCode.KEYRING_ERROR,
        // @ts-ignore
        message: String(e.message)
      });
    }

    let tokenInfo;

    if (token) {
      const tokenInfo = await (0, _registry.getTokenInfo)(networkKey, _index.dotSamaAPIMap[networkKey].api, token);

      if (!tokenInfo) {
        errors.push({
          code: _KoniTypes.TransferErrorCode.INVALID_TOKEN,
          message: 'Not found token from registry'
        });
      }

      if ((0, _utilCrypto.isEthereumAddress)(from) && (0, _utilCrypto.isEthereumAddress)(to) && !(tokenInfo !== null && tokenInfo !== void 0 && tokenInfo.erc20Address)) {
        errors.push({
          code: _KoniTypes.TransferErrorCode.INVALID_TOKEN,
          message: 'Not found ERC20 address for this token'
        });
      }
    }

    return [errors, keypair, transferValue, tokenInfo];
  }

  async checkTransfer(_ref14) {
    let {
      from,
      networkKey,
      to,
      token,
      transferAll,
      value
    } = _ref14;
    const [errors, fromKeyPair, valueNumber, tokenInfo] = await this.validateTransfer(networkKey, token, from, to, undefined, value, transferAll);
    let fee = '0';
    let fromAccountFree = '0';
    let toAccountFree = '0';

    if ((0, _utilCrypto.isEthereumAddress)(from) && (0, _utilCrypto.isEthereumAddress)(to)) {
      [fromAccountFree, toAccountFree] = await Promise.all([(0, _balance.getFreeBalance)(networkKey, from, token), (0, _balance.getFreeBalance)(networkKey, to, token)]);
      const txVal = transferAll ? fromAccountFree : value || '0'; // Estimate with EVM API

      if (tokenInfo && !tokenInfo.isMainToken && tokenInfo.erc20Address) {
        [, fee] = await (0, _transfer2.getERC20TransactionObject)(tokenInfo.erc20Address, networkKey, from, to, txVal, !!transferAll);
      } else {
        [, fee] = await (0, _transfer2.getEVMTransactionObject)(networkKey, to, txVal, !!transferAll);
      }
    } else {
      // Estimate with DotSama API
      [fee, fromAccountFree, toAccountFree] = await Promise.all([(0, _transfer.estimateFee)(networkKey, fromKeyPair, to, value, !!transferAll), (0, _balance.getFreeBalance)(networkKey, from), (0, _balance.getFreeBalance)(networkKey, to)]);
    }

    const fromAccountFreeNumber = new _util.BN(fromAccountFree);
    const feeNumber = fee ? new _util.BN(fee) : undefined;

    if (!transferAll && value && feeNumber && valueNumber) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      if (fromAccountFreeNumber.lt(feeNumber.add(valueNumber))) {
        errors.push({
          code: _KoniTypes.TransferErrorCode.NOT_ENOUGH_VALUE,
          message: 'Not enough balance free to make transfer'
        });
      }
    }

    return {
      errors,
      fromAccountFree: fromAccountFree,
      toAccountFree: toAccountFree,
      estimateFee: fee
    };
  }

  async makeTransfer(id, port, _ref15) {
    let {
      from,
      networkKey,
      password,
      to,
      token,
      transferAll,
      value
    } = _ref15;
    const callback = (0, _subscriptions.createSubscription)(id, port);
    const [errors, fromKeyPair,, tokenInfo] = await this.validateTransfer(networkKey, token, from, to, password, value, transferAll);

    if (errors.length > 0) {
      setTimeout(() => {
        (0, _subscriptions.unsubscribe)(id);
      }, 500);
      return errors;
    }

    if (fromKeyPair && errors.length === 0) {
      let transferProm;

      if ((0, _utilCrypto.isEthereumAddress)(from) && (0, _utilCrypto.isEthereumAddress)(to)) {
        // Make transfer with EVM API
        const {
          privateKey
        } = this.accountExportPrivateKey({
          address: from,
          password
        });

        if (tokenInfo && !tokenInfo.isMainToken && tokenInfo.erc20Address) {
          transferProm = (0, _transfer2.makeERC20Transfer)(tokenInfo.erc20Address, networkKey, from, to, privateKey, value || '0', !!transferAll, callback);
        } else {
          transferProm = (0, _transfer2.makeEVMTransfer)(networkKey, to, privateKey, value || '0', !!transferAll, callback);
        }
      } else {
        // Make transfer with Dotsama API
        transferProm = (0, _transfer.makeTransfer)(networkKey, to, fromKeyPair, value || '0', !!transferAll, callback);
      }

      transferProm.then(() => {
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        console.log(`Start transfer ${transferAll ? 'all' : value} from ${from} to ${to}`);
      }).catch(e => {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,node/no-callback-literal,@typescript-eslint/no-unsafe-member-access
        callback({
          step: _KoniTypes.TransferStep.ERROR,
          errors: [{
            code: _KoniTypes.TransferErrorCode.TRANSFER_ERROR,
            message: e.message
          }]
        });
        console.error('Transfer error', e);
        setTimeout(() => {
          (0, _subscriptions.unsubscribe)(id);
        }, 500);
      });
    }

    port.onDisconnect.addListener(() => {
      (0, _subscriptions.unsubscribe)(id);
    });
    return errors;
  }

  async evmNftGetTransaction(_ref16) {
    let {
      networkKey,
      params,
      recipientAddress,
      senderAddress
    } = _ref16;
    const contractAddress = params.contractAddress;
    const tokenId = params.tokenId;

    try {
      const web3 = (0, _web.getWeb3Api)(networkKey); // eslint-disable-next-line @typescript-eslint/no-unsafe-argument

      const contract = new web3.eth.Contract(_web.TestERC721Contract, contractAddress);
      const [fromAccountTxCount, gasPriceGwei] = await Promise.all([web3.eth.getTransactionCount(senderAddress), web3.eth.getGasPrice()]); // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-member-access

      const gasLimit = await contract.methods.safeTransferFrom(senderAddress, recipientAddress, tokenId).estimateGas({
        from: senderAddress
      });
      const rawTransaction = {
        nonce: '0x' + fromAccountTxCount.toString(16),
        from: senderAddress,
        gasPrice: web3.utils.toHex(gasPriceGwei),
        gasLimit: web3.utils.toHex(gasLimit),
        to: contractAddress,
        value: '0x00',
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-assignment
        data: contract.methods.safeTransferFrom(senderAddress, recipientAddress, tokenId).encodeABI()
      }; // @ts-ignore

      const estimatedFee = gasLimit * parseFloat(gasPriceGwei) / 10 ** _endpoints.default[networkKey].decimals; // eslint-disable-next-line @typescript-eslint/restrict-plus-operands


      const feeString = estimatedFee.toString() + ' ' + _endpoints.default[networkKey].nativeToken;

      return {
        tx: rawTransaction,
        estimatedFee: feeString
      };
    } catch (e) {
      console.error('error handling web3 transfer nft', e);
      return {
        tx: null,
        estimatedFee: null
      };
    }
  }

  async evmNftSubmitTransaction(id, port, _ref17) {
    let {
      networkKey,
      password,
      rawTransaction,
      recipientAddress,
      senderAddress
    } = _ref17;
    const updateState = (0, _subscriptions.createSubscription)(id, port);
    let parsedPrivateKey = '';
    const txState = {
      isSendingSelf: (0, _utils.reformatAddress)(senderAddress, 1) === (0, _utils.reformatAddress)(recipientAddress, 1)
    };

    try {
      const {
        privateKey
      } = this.accountExportPrivateKey({
        address: senderAddress,
        password
      });
      parsedPrivateKey = privateKey.slice(2);
      txState.passwordError = null;
      updateState(txState);
    } catch (e) {
      txState.passwordError = 'Error unlocking account with password';
      updateState(txState);
      port.onDisconnect.addListener(() => {
        (0, _subscriptions.unsubscribe)(id);
      });
      return txState;
    }

    try {
      const web3 = (0, _web.getWeb3Api)(networkKey);

      const common = _common.default.forCustomChain('mainnet', {
        name: networkKey,
        networkId: _config.TRANSFER_CHAIN_ID[networkKey],
        chainId: _config.TRANSFER_CHAIN_ID[networkKey]
      }, 'petersburg'); // @ts-ignore


      const tx = new _ethereumjsTx.Transaction(rawTransaction, {
        common
      });
      tx.sign(Buffer.from(parsedPrivateKey, 'hex'));
      const callHash = tx.serialize();
      txState.callHash = callHash.toString('hex');
      updateState(txState);
      await web3.eth.sendSignedTransaction('0x' + callHash.toString('hex')).then(receipt => {
        if (receipt.status) {
          txState.status = receipt.status;
        }

        if (receipt.transactionHash) {
          txState.transactionHash = receipt.transactionHash;
        }

        updateState(txState);
      });
    } catch (e) {
      console.error('transfer nft error', e);
      txState.txError = true;
      updateState(txState);
    }

    port.onDisconnect.addListener(() => {
      (0, _subscriptions.unsubscribe)(id);
    });
    return txState;
  } // eslint-disable-next-line @typescript-eslint/require-await


  async handle(id, type, request, port) {
    switch (type) {
      case 'pri(api.init)':
        return this.apiInit(request);

      case 'pri(authorize.changeSiteAll)':
        return this.changeAuthorizationAll(request, id, port);

      case 'pri(authorize.changeSite)':
        return this.changeAuthorization(request, id, port);

      case 'pri(authorize.changeSitePerAccount)':
        return this.changeAuthorizationPerAcc(request, id, port);

      case 'pri(authorize.forgetSite)':
        return this.forgetSite(request, id, port);

      case 'pri(authorize.forgetAllSite)':
        return this.forgetAllSite(id, port);

      case 'pri(authorize.approveV2)':
        return this.authorizeApproveV2(request);

      case 'pri(authorize.rejectV2)':
        return this.authorizeRejectV2(request);

      case 'pri(authorize.requestsV2)':
        return this.authorizeSubscribeV2(id, port);

      case 'pri(authorize.listV2)':
        return this.getAuthListV2();

      case 'pri(accounts.create.suriV2)':
        return await this.accountsCreateSuriV2(request);

      case 'pri(accounts.forget)':
        return await this.accountsForgetOverride(request);

      case 'pri(seed.createV2)':
        return this.seedCreateV2(request);

      case 'pri(seed.validateV2)':
        return this.seedValidateV2(request);

      case 'pri(accounts.exportPrivateKey)':
        return this.accountExportPrivateKey(request);

      case 'pri(accounts.subscribeWithCurrentAddress)':
        return this.accountsGetAllWithCurrentAddress(id, port);

      case 'pri(accounts.triggerSubscription)':
        return this.triggerAccountsSubscription();

      case 'pri(currentAccount.saveAddress)':
        return this.saveCurrentAccountAddress(request, id, port);

      case 'pri(price.getPrice)':
        return await this.getPrice();

      case 'pri(price.getSubscription)':
        return await this.subscribePrice(id, port);

      case 'pri(balance.getBalance)':
        return this.getBalance();

      case 'pri(balance.getSubscription)':
        return this.subscribeBalance(id, port);

      case 'pri(crowdloan.getCrowdloan)':
        return this.getCrowdloan();

      case 'pri(crowdloan.getSubscription)':
        return this.subscribeCrowdloan(id, port);

      case 'pri(derivation.createV2)':
        return this.derivationCreateV2(request);

      case 'pri(json.restoreV2)':
        return this.jsonRestoreV2(request);

      case 'pri(json.batchRestoreV2)':
        return this.batchRestoreV2(request);

      case 'pri(networkMetadata.list)':
        return this.networkMetadataList();

      case 'pri(chainRegistry.getSubscription)':
        return this.subscribeChainRegistry(id, port);

      case 'pri(nft.getNft)':
        return await this.getNft();

      case 'pri(nft.getSubscription)':
        return await this.subscribeNft(id, port);

      case 'pri(nftCollection.getNftCollection)':
        return await this.getNftCollection();

      case 'pri(nftCollection.getSubscription)':
        return await this.subscribeNftCollection(id, port);

      case 'pri(staking.getStaking)':
        return this.getStaking();

      case 'pri(staking.getSubscription)':
        return this.subscribeStaking(id, port);

      case 'pri(stakingReward.getStakingReward)':
        return this.getStakingReward();

      case 'pri(stakingReward.getSubscription)':
        return this.subscribeStakingReward(id, port);

      case 'pri(transaction.history.add)':
        return this.updateTransactionHistory(request, id, port);

      case 'pri(transaction.history.getSubscription)':
        return this.subscribeHistory(id, port);

      case 'pri(nft.forceUpdate)':
        return this.forceUpdateNftState(request);

      case 'pri(nftTransfer.getNftTransfer)':
        return this.getNftTransfer();

      case 'pri(nftTransfer.getSubscription)':
        return this.subscribeNftTransfer(id, port);

      case 'pri(nftTransfer.setNftTransfer)':
        return this.setNftTransfer(request);

      case 'pri(accounts.checkTransfer)':
        return await this.checkTransfer(request);

      case 'pri(accounts.transfer)':
        return await this.makeTransfer(id, port, request);

      case 'pri(evmNft.getTransaction)':
        return this.evmNftGetTransaction(request);

      case 'pri(evmNft.submitTransaction)':
        return this.evmNftSubmitTransaction(id, port, request);

      default:
        return super.handle(id, type, request, port);
    }
  }

}

exports.default = KoniExtension;