"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

var _rxjs = require("rxjs");

var _helpers = require("@polkadot/extension-base/background/handlers/helpers");

var _State = _interopRequireDefault(require("@polkadot/extension-base/background/handlers/State"));

var _KoniTypes = require("@polkadot/extension-base/background/KoniTypes");

var _getId = require("@polkadot/extension-base/utils/getId");

var _coingecko = require("@polkadot/extension-koni-base/api/coingecko");

var _registry = require("@polkadot/extension-koni-base/api/dotsama/registry");

var _endpoints = _interopRequireDefault(require("@polkadot/extension-koni-base/api/endpoints"));

var _staking = require("@polkadot/extension-koni-base/api/staking");

var _crowdloan = require("@polkadot/extension-koni-base/api/subquery/crowdloan");

var _defaultEvmToken = require("@polkadot/extension-koni-base/api/web3/defaultEvmToken");

var _stores = require("@polkadot/extension-koni-base/stores");

var _AccountRef = _interopRequireDefault(require("@polkadot/extension-koni-base/stores/AccountRef"));

var _Authorize = _interopRequireDefault(require("@polkadot/extension-koni-base/stores/Authorize"));

var _CustomEvmToken = _interopRequireDefault(require("@polkadot/extension-koni-base/stores/CustomEvmToken"));

var _Settings = _interopRequireDefault(require("@polkadot/extension-koni-base/stores/Settings"));

var _TransactionHistory = _interopRequireDefault(require("@polkadot/extension-koni-base/stores/TransactionHistory"));

var _utils = require("@polkadot/extension-koni-base/utils/utils");

var _accounts = require("@polkadot/ui-keyring/observable/accounts");

var _util = require("@polkadot/util");

// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0
function generateDefaultBalanceMap() {
  const balanceMap = {};
  Object.keys(_endpoints.default).forEach(networkKey => {
    balanceMap[networkKey] = {
      state: _KoniTypes.APIItemState.PENDING,
      free: '0',
      reserved: '0',
      miscFrozen: '0',
      feeFrozen: '0'
    };
  });
  return balanceMap;
}

function generateDefaultStakingMap() {
  const stakingMap = {};
  Object.keys(_staking.DEFAULT_STAKING_NETWORKS).forEach(networkKey => {
    stakingMap[networkKey] = {
      name: _endpoints.default[networkKey].chain,
      chainId: networkKey,
      nativeToken: _endpoints.default[networkKey].nativeToken,
      state: _KoniTypes.APIItemState.PENDING
    };
  });
  return stakingMap;
}

function generateDefaultCrowdloanMap() {
  const crowdloanMap = {};
  Object.keys(_endpoints.default).forEach(networkKey => {
    crowdloanMap[networkKey] = {
      state: _KoniTypes.APIItemState.PENDING,
      contribute: '0'
    };
  });
  return crowdloanMap;
}

class KoniState extends _State.default {
  authSubjectV2 = new _rxjs.BehaviorSubject([]);
  customEvmTokenStore = new _CustomEvmToken.default();
  priceStore = new _stores.PriceStore();
  currentAccountStore = new _stores.CurrentAccountStore();
  settingsStore = new _Settings.default();
  accountRefStore = new _AccountRef.default();
  authorizeStore = new _Authorize.default();
  #authRequestsV2 = {}; // private readonly nftStore = new NftStore();
  // private readonly stakingStore = new StakingStore();

  priceStoreReady = false;
  transactionHistoryStore = new _TransactionHistory.default();

  initEvmTokenState() {
    this.customEvmTokenStore.get('EvmToken', storedEvmTokens => {
      if (!storedEvmTokens) {
        this.evmTokenState = _defaultEvmToken.DEFAULT_EVM_TOKENS;
      } else {
        const _evmTokenState = _defaultEvmToken.DEFAULT_EVM_TOKENS;

        for (const storedToken of storedEvmTokens.erc20) {
          let exist = false;

          for (const defaultToken of _defaultEvmToken.DEFAULT_EVM_TOKENS.erc20) {
            if (defaultToken.smartContract === storedToken.smartContract && defaultToken.chain === storedToken.chain) {
              exist = true;
              break;
            }
          }

          if (!exist) {
            _evmTokenState.erc20.push(storedToken);
          }
        }

        for (const storedToken of storedEvmTokens.erc721) {
          let exist = false;

          for (const defaultToken of _defaultEvmToken.DEFAULT_EVM_TOKENS.erc721) {
            if (defaultToken.smartContract === storedToken.smartContract && defaultToken.chain === storedToken.chain) {
              exist = true;
              break;
            }
          }

          if (!exist) {
            _evmTokenState.erc721.push(storedToken);
          }
        }

        this.evmTokenState = _evmTokenState;
      }

      this.customEvmTokenStore.set('EvmToken', this.evmTokenState);
      this.evmTokenSubject.next(this.evmTokenState);
    });
  }

  evmTokenState = {
    erc20: [],
    erc721: []
  };
  evmTokenSubject = new _rxjs.Subject(); // private nftStoreReady = false;
  // private stakingStoreReady = false;
  // Todo: Persist data to balanceStore later
  // private readonly balanceStore = new BalanceStore();

  balanceMap = generateDefaultBalanceMap();
  balanceSubject = new _rxjs.Subject();
  nftState = {
    total: 0,
    nftList: []
  };
  nftCollectionState = {
    ready: false,
    nftCollectionList: []
  }; // Only for rendering nft after transfer

  nftTransferState = {
    cronUpdate: false,
    forceUpdate: false
  };
  stakingMap = generateDefaultStakingMap();
  stakingRewardState = {
    details: []
  }; // eslint-disable-next-line camelcase

  crowdloanFundmap = {};
  crowdloanMap = generateDefaultCrowdloanMap();
  crowdloanSubject = new _rxjs.Subject();
  nftTransferSubject = new _rxjs.Subject();
  nftSubject = new _rxjs.Subject();
  nftCollectionSubject = new _rxjs.Subject();
  stakingSubject = new _rxjs.Subject();
  stakingRewardSubject = new _rxjs.Subject();
  historyMap = {};
  historySubject = new _rxjs.Subject();
  _serviceInfoSubject = new _rxjs.Subject(); // Todo: persist data to store later

  chainRegistryMap = {};
  chainRegistrySubject = new _rxjs.Subject();
  lazyMap = {};
  lazyNext = (key, callback) => {
    if (this.lazyMap[key]) {
      // @ts-ignore
      clearTimeout(this.lazyMap[key]);
    }

    const lazy = setTimeout(() => {
      callback();
      clearTimeout(lazy);
    }, 300);
    this.lazyMap[key] = lazy;
  };

  getAuthRequestV2(id) {
    return this.#authRequestsV2[id];
  }

  get numAuthRequestsV2() {
    return Object.keys(this.#authRequestsV2).length;
  }

  get allAuthRequestsV2() {
    return Object.values(this.#authRequestsV2).map(_ref => {
      let {
        id,
        request,
        url
      } = _ref;
      return {
        id,
        request,
        url
      };
    });
  }

  setAuthorize(data, callback) {
    this.authorizeStore.set('authUrls', data, callback);
  }

  getAuthorize(update) {
    this.authorizeStore.get('authUrls', update);
  }

  updateIconV2(shouldClose) {
    const authCount = this.numAuthRequestsV2;
    const text = authCount ? 'Auth' : '';
    (0, _helpers.withErrorLog)(() => chrome.browserAction.setBadgeText({
      text
    }));

    if (shouldClose && text === '') {
      this.popupClose();
    }
  }

  getAuthList() {
    return new Promise((resolve, reject) => {
      this.getAuthorize(rs => {
        resolve(rs);
      });
    });
  }

  getAddressList() {
    let value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : false;
    const addressList = Object.keys(_accounts.accounts.subject.value).filter(address => _accounts.accounts.subject.value[address].type !== 'ethereum');
    const addressListMap = addressList.reduce((addressList, v) => ({ ...addressList,
      [v]: value
    }), {});
    return addressListMap;
  }

  updateIconAuthV2(shouldClose) {
    this.authSubjectV2.next(this.allAuthRequestsV2);
    this.updateIconV2(shouldClose);
  }

  authCompleteV2 = (id, resolve, reject) => {
    const isAllowedMap = this.getAddressList();

    const complete = (result, accounts) => {
      const isAllowed = result === true;

      if (accounts && accounts.length) {
        Object.keys(isAllowedMap).forEach(address => {
          if (accounts.includes(address)) {
            isAllowedMap[address] = true;
          } else {
            isAllowedMap[address] = false;
          }
        });
      } else {
        // eslint-disable-next-line no-return-assign
        Object.keys(isAllowedMap).forEach(address => isAllowedMap[address] = false);
      }

      const {
        idStr,
        request: {
          origin
        },
        url
      } = this.#authRequestsV2[id];
      this.getAuthorize(value => {
        let authorizeList = {};

        if (value) {
          authorizeList = value;
        }

        authorizeList[this.stripUrl(url)] = {
          count: 0,
          id: idStr,
          isAllowed,
          isAllowedMap,
          origin,
          url
        };
        this.setAuthorize(authorizeList);
        delete this.#authRequestsV2[id];
        this.updateIconAuthV2(true);
      });
    };

    return {
      reject: error => {
        complete(error);
        reject(error);
      },
      resolve: _ref2 => {
        let {
          accounts,
          result
        } = _ref2;
        complete(result, accounts);
        resolve(result);
      }
    };
  };

  async authorizeUrlV2(url, request) {
    const idStr = this.stripUrl(url); // Do not enqueue duplicate authorization requests.

    const isDuplicate = Object.values(this.#authRequestsV2).some(request => request.idStr === idStr);
    (0, _util.assert)(!isDuplicate, `The source ${url} has a pending authorization request`);
    let authList = await this.getAuthList();

    if (!authList) {
      authList = {};
    }

    if (authList[idStr]) {
      // this url was seen in the past
      const isConnected = Object.keys(authList[idStr].isAllowedMap).some(address => authList[idStr].isAllowedMap[address]);
      (0, _util.assert)(isConnected, `The source ${url} is not allowed to interact with this extension`);
      return false;
    }

    return new Promise((resolve, reject) => {
      const id = (0, _getId.getId)();
      this.#authRequestsV2[id] = { ...this.authCompleteV2(id, resolve, reject),
        id,
        idStr,
        request,
        url
      };
      this.updateIconAuthV2();
      this.popupOpen();
    });
  }

  getStaking() {
    return {
      ready: true,
      details: this.stakingMap
    };
  }

  subscribeStaking() {
    return this.stakingSubject;
  }

  ensureUrlAuthorizedV2(url) {
    const idStr = this.stripUrl(url);
    this.getAuthorize(value => {
      if (!value) {
        value = {};
      }

      const isConnected = Object.keys(value[idStr].isAllowedMap).some(address => value[idStr].isAllowedMap[address]);
      const entry = Object.keys(value).includes(idStr);
      (0, _util.assert)(entry, `The source ${url} has not been enabled yet`);
      (0, _util.assert)(isConnected, `The source ${url} is not allowed to interact with this extension`);
    });
    return true;
  }

  setStakingItem(networkKey, item) {
    this.stakingMap[networkKey] = item;
    this.lazyNext('setStakingItem', () => {
      this.stakingSubject.next(this.getStaking());
    });
  }

  setNftTransfer(data, callback) {
    this.nftTransferState = data;

    if (callback) {
      callback(data);
    }

    this.nftTransferSubject.next(data);
  }

  getNftTransfer() {
    return this.nftTransferState;
  }

  getNftTransferSubscription(update) {
    update(this.nftTransferState);
  }

  subscribeNftTransfer() {
    return this.nftTransferSubject;
  }

  setNftCollection(data, callback) {
    this.nftCollectionState = data;

    if (callback) {
      callback(data);
    }

    this.nftCollectionSubject.next(this.nftCollectionState);
  }

  updateNftCollection(data, callback) {
    this.nftCollectionState.nftCollectionList.push(data);

    if (callback) {
      callback(data);
    }

    this.nftCollectionSubject.next(this.nftCollectionState);
  }

  updateNftReady(ready, callback) {
    this.nftCollectionState.ready = ready;

    if (callback) {
      callback(ready);
    }

    this.nftCollectionSubject.next(this.nftCollectionState);
  }

  resetNftCollection() {
    this.nftCollectionState = {
      ready: false,
      nftCollectionList: []
    };
    this.nftCollectionSubject.next(this.nftCollectionState);
  }

  getNftCollection() {
    return this.nftCollectionState;
  }

  getNftCollectionSubscription(update) {
    update(this.nftCollectionState);
  }

  subscribeNftCollection() {
    return this.nftCollectionSubject;
  }

  resetNft() {
    this.nftState = {
      total: 0,
      nftList: []
    };
    this.nftSubject.next(this.nftState);
  }

  setNft(data, callback) {
    this.nftState = data;

    if (callback) {
      callback(data);
    }

    this.nftSubject.next(this.nftState);
  }

  updateNft(nftData, callback) {
    this.nftState.nftList.push(nftData);

    if (callback) {
      callback(nftData);
    }

    this.nftSubject.next(this.nftState);
  }

  getNft() {
    return this.nftState;
  }

  getNftSubscription(update) {
    update(this.nftState);
  }

  subscribeNft() {
    return this.nftSubject;
  }

  setStakingReward(stakingRewardData, callback) {
    this.stakingRewardState = stakingRewardData;

    if (callback) {
      callback(stakingRewardData);
    }

    this.stakingRewardSubject.next(stakingRewardData);
  }

  getAccountRefMap(callback) {
    const refMap = {};
    this.accountRefStore.get('refList', refList => {
      if (refList) {
        refList.forEach(accRef => {
          accRef.forEach(acc => {
            refMap[acc] = [...accRef].filter(r => !(r === acc));
          });
        });
      }

      callback(refMap);
    });
  }

  addAccountRef(addresses, callback) {
    this.accountRefStore.get('refList', refList => {
      const newList = refList ? [...refList] : [];
      newList.push(addresses);
      this.accountRefStore.set('refList', newList, callback);
    });
  }

  removeAccountRef(address, callback) {
    this.accountRefStore.get('refList', refList => {
      if (refList) {
        refList.forEach(accRef => {
          if (accRef.indexOf(address) > -1) {
            accRef.splice(accRef.indexOf(address), 1);
          }

          if (accRef.length < 2) {
            refList.splice(refList.indexOf(accRef), 1);
          }
        });
        this.accountRefStore.set('refList', refList, () => {
          callback();
        });
      } else {
        callback();
      }
    });
  }

  getStakingReward(update) {
    update(this.stakingRewardState);
  }

  subscribeStakingReward() {
    return this.stakingRewardSubject;
  }

  setHistory(historyMap) {
    this.historyMap = historyMap;
    this.historySubject.next(this.historyMap);
  }

  getCurrentAccount(update) {
    this.currentAccountStore.get('CurrentAccountInfo', update);
  }

  setCurrentAccount(data, callback) {
    this.currentAccountStore.set('CurrentAccountInfo', data, callback);
    this.updateServiceInfo_(this.chainRegistryMap, this.getErc721Tokens());
  }

  getSettings(update) {
    this.settingsStore.get('Settings', value => {
      if (!value) {
        update({
          isShowBalance: false,
          accountAllLogo: '',
          theme: 'dark'
        });
      } else {
        update(value);
      }
    });
  }

  setSettings(data, callback) {
    this.settingsStore.set('Settings', data, callback);
  }

  subscribeSettingsSubject() {
    return this.settingsStore.getSubject();
  }

  subscribeCurrentAccount() {
    return this.currentAccountStore.getSubject();
  }

  getAccountAddress() {
    return new Promise((resolve, reject) => {
      this.getCurrentAccount(account => {
        if (account) {
          resolve(account.address);
        } else {
          resolve(null);
        }
      });
    });
  }

  getBalance() {
    return {
      details: this.balanceMap
    };
  }

  resetBalanceMap() {
    Object.values(this.balanceMap).forEach(balance => {
      balance.state = _KoniTypes.APIItemState.PENDING;
    });
    this.balanceSubject.next(this.getBalance());
  }

  resetStakingMap() {
    Object.values(this.stakingMap).forEach(staking => {
      staking.state = _KoniTypes.APIItemState.PENDING;
    });
    this.stakingSubject.next(this.getStaking());
  }

  resetCrowdloanMap() {
    Object.values(this.crowdloanMap).forEach(item => {
      item.state = _KoniTypes.APIItemState.PENDING;
    });
    this.crowdloanSubject.next(this.getCrowdloan());
  }

  setBalanceItem(networkKey, item) {
    this.balanceMap[networkKey] = item;
    this.lazyNext('setBalanceItem', () => {
      this.balanceSubject.next(this.getBalance());
    });
  }

  subscribeBalance() {
    return this.balanceSubject;
  }

  async fetchCrowdloanFundMap() {
    this.crowdloanFundmap = await (0, _crowdloan.fetchDotSamaCrowdloan)();
  }

  getCrowdloan() {
    return {
      details: this.crowdloanMap
    };
  }

  setCrowdloanItem(networkKey, item) {
    // Fill para state
    const crowdloanFundNode = this.crowdloanFundmap[networkKey];

    if (crowdloanFundNode) {
      item.paraState = (0, _utils.convertFundStatus)(crowdloanFundNode.status);
    } // Update crowdloan map


    this.crowdloanMap[networkKey] = item;
    this.lazyNext('setCrowdloanItem', () => {
      this.crowdloanSubject.next(this.getCrowdloan());
    });
  }

  subscribeCrowdloan() {
    return this.crowdloanSubject;
  }

  getChainRegistryMap() {
    return this.chainRegistryMap;
  }

  setChainRegistryItem(networkKey, registry) {
    this.chainRegistryMap[networkKey] = registry;
    this.lazyNext('setChainRegistry', () => {
      this.chainRegistrySubject.next(this.getChainRegistryMap());
    });
  }

  upsertChainRegistry(tokenData) {
    const chainRegistry = this.chainRegistryMap[tokenData.chain];
    let tokenKey = '';

    for (const [key, token] of Object.entries(chainRegistry.tokenMap)) {
      if (token.erc20Address === tokenData.smartContract) {
        tokenKey = key;
        break;
      }
    }

    if (tokenKey !== '') {
      chainRegistry.tokenMap[tokenKey] = {
        isMainToken: false,
        symbol: tokenData.symbol,
        name: tokenData.name,
        erc20Address: tokenData.smartContract,
        decimals: tokenData.decimals
      };
    } else {
      // @ts-ignore
      chainRegistry.tokenMap[tokenData.symbol] = {
        isMainToken: false,
        symbol: tokenData.symbol,
        name: tokenData.symbol,
        erc20Address: tokenData.smartContract,
        decimals: tokenData.decimals
      };
    }

    _registry.cacheRegistryMap[tokenData.chain] = chainRegistry;
    this.chainRegistrySubject.next(this.getChainRegistryMap());
  }

  subscribeChainRegistryMap() {
    return this.chainRegistrySubject;
  }

  getTransactionKey(address, networkKey) {
    return `${address}_${networkKey}`;
  }

  getTransactionHistory(address, networkKey, update) {
    this.transactionHistoryStore.get(this.getTransactionKey(address, networkKey), items => {
      if (!items) {
        update([]);
      } else {
        update(items);
      }
    });
  }

  getTransactionHistoryByMultiNetworks(address, networkKeys, update) {
    const keys = networkKeys.map(n => this.getTransactionKey(address, n));
    this.transactionHistoryStore.getByMultiKeys(keys, items => {
      if (!items) {
        update([]);
      } else {
        items.sort((a, b) => b.time - a.time);
        update(items);
      }
    });
  }

  subscribeHistory() {
    return this.historySubject;
  }

  getHistoryMap() {
    return this.historyMap;
  }

  setTransactionHistory(address, networkKey, item, callback) {
    this.getTransactionHistory(address, networkKey, items => {
      if (!items || !items.length) {
        items = [item];
      } else {
        items.unshift(item);
      }

      this.transactionHistoryStore.set(this.getTransactionKey(address, networkKey), items, () => {
        callback && callback(items);
      });
    });
  }

  setPrice(priceData, callback) {
    this.priceStore.set('PriceData', priceData, () => {
      if (callback) {
        callback(priceData);
        this.priceStoreReady = true;
      }
    });
  }

  getPrice(update) {
    this.priceStore.get('PriceData', rs => {
      if (this.priceStoreReady) {
        update(rs);
      } else {
        (0, _coingecko.getTokenPrice)().then(rs => {
          this.setPrice(rs);
          update(rs);
        }).catch(err => {
          console.error(err);
          throw err;
        });
      }
    });
  }

  subscribePrice() {
    return this.priceStore.getSubject();
  }

  subscribeEvmToken() {
    return this.evmTokenSubject;
  }

  getEvmTokenState() {
    return this.evmTokenState;
  }

  getErc20Tokens() {
    return this.evmTokenState.erc20;
  }

  getErc721Tokens() {
    return this.evmTokenState.erc721;
  }

  getEvmTokenStore(callback) {
    return this.customEvmTokenStore.get('EvmToken', data => {
      callback(data);
    });
  }

  upsertEvmToken(data) {
    let isExist = false;

    for (const token of this.evmTokenState[data.type]) {
      if (token.smartContract === data.smartContract && token.type === data.type && token.chain === data.chain) {
        isExist = true;
        break;
      }
    }

    if (!isExist) {
      this.evmTokenState[data.type].push(data);
    } else {
      this.evmTokenState[data.type] = this.evmTokenState[data.type].map(token => {
        if (token.smartContract === data.smartContract) {
          return data;
        }

        return token;
      });
    }

    if (data.type === 'erc20') {
      this.upsertChainRegistry(data);
    }

    this.evmTokenSubject.next(this.evmTokenState);
    this.customEvmTokenStore.set('EvmToken', this.evmTokenState);
    this.updateServiceInfo_(this.chainRegistryMap, this.getErc721Tokens());
  }

  deleteEvmTokens(targetTokens) {
    const _evmTokenState = this.evmTokenState;
    let needUpdateChainRegistry = false;

    for (const targetToken of targetTokens) {
      for (let index = 0; index < _evmTokenState.erc20.length; index++) {
        if (_evmTokenState.erc20[index].smartContract === targetToken.smartContract && _evmTokenState.erc20[index].chain === targetToken.chain && targetToken.type === 'erc20') {
          _evmTokenState.erc20.splice(index, 1);

          needUpdateChainRegistry = true;
        }
      }
    }

    if (needUpdateChainRegistry) {
      for (const targetToken of targetTokens) {
        const chainRegistry = this.chainRegistryMap[targetToken.chain];
        let deleteKey = '';

        for (const [key, token] of Object.entries(chainRegistry.tokenMap)) {
          if (token.erc20Address === targetToken.smartContract && targetToken.type === 'erc20') {
            deleteKey = key;
          }
        }

        delete chainRegistry.tokenMap[deleteKey];
        this.chainRegistryMap[targetToken.chain] = chainRegistry;
        _registry.cacheRegistryMap[targetToken.chain] = chainRegistry;
      }
    }

    for (const targetToken of targetTokens) {
      for (let index = 0; index < _evmTokenState.erc721.length; index++) {
        if (_evmTokenState.erc721[index].smartContract === targetToken.smartContract && _evmTokenState.erc721[index].chain === targetToken.chain && targetToken.type === 'erc721') {
          _evmTokenState.erc721.splice(index, 1);

          needUpdateChainRegistry = true;
        }
      }
    }

    this.evmTokenState = _evmTokenState;
    this.evmTokenSubject.next(this.evmTokenState);
    this.chainRegistrySubject.next(this.getChainRegistryMap());
    this.customEvmTokenStore.set('EvmToken', this.evmTokenState);
    this.updateServiceInfo_(this.chainRegistryMap, this.getErc721Tokens());
  }

  subscribeServiceInfo_() {
    return this._serviceInfoSubject;
  }

  updateServiceInfo_(chainRegistry, customErc721Registry) {
    this.currentAccountStore.get('CurrentAccountInfo', value => {
      this._serviceInfoSubject.next({
        currentAccount: value.address,
        chainRegistry,
        customErc721Registry
      });
    });
  }

}

exports.default = KoniState;