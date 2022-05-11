"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getFreeBalance = getFreeBalance;
exports.subscribeBalance = subscribeBalance;
exports.subscribeEVMBalance = subscribeEVMBalance;
exports.subscribeFreeBalance = subscribeFreeBalance;

var _rxjs = require("rxjs");

var _KoniTypes = require("@polkadot/extension-base/background/KoniTypes");

var _apiHelper = require("@polkadot/extension-koni-base/api/dotsama/api-helper");

var _registry = require("@polkadot/extension-koni-base/api/dotsama/registry");

var _balance = require("@polkadot/extension-koni-base/api/web3/balance");

var _web = require("@polkadot/extension-koni-base/api/web3/web3");

var _handlers = require("@polkadot/extension-koni-base/background/handlers");

var _constants = require("@polkadot/extension-koni-base/constants");

var _utils = require("@polkadot/extension-koni-base/utils/utils");

var _util = require("@polkadot/util");

var _utilCrypto = require("@polkadot/util-crypto");

// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0
// eslint-disable-next-line @typescript-eslint/no-unused-vars
// @ts-ignore
function subscribeWithDerive(addresses, networkKey, networkAPI, callback) {
  const freeMap = {};
  const reservedMap = {};
  const miscFrozenMap = {};
  const feeFrozenMap = {};
  const unsubProms = addresses.map(address => {
    var _networkAPI$api$deriv;

    return (_networkAPI$api$deriv = networkAPI.api.derive.balances) === null || _networkAPI$api$deriv === void 0 ? void 0 : _networkAPI$api$deriv.all(address, balance => {
      var _balance$freeBalance, _balance$reservedBala, _balance$frozenMisc, _balance$frozenFee;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      freeMap[address] = ((_balance$freeBalance = balance.freeBalance) === null || _balance$freeBalance === void 0 ? void 0 : _balance$freeBalance.toBn()) || new _util.BN(0);
      reservedMap[address] = ((_balance$reservedBala = balance.reservedBalance) === null || _balance$reservedBala === void 0 ? void 0 : _balance$reservedBala.toBn()) || new _util.BN(0);
      miscFrozenMap[address] = ((_balance$frozenMisc = balance.frozenMisc) === null || _balance$frozenMisc === void 0 ? void 0 : _balance$frozenMisc.toBn()) || new _util.BN(0);
      feeFrozenMap[address] = ((_balance$frozenFee = balance.frozenFee) === null || _balance$frozenFee === void 0 ? void 0 : _balance$frozenFee.toBn()) || new _util.BN(0);
      const balanceItem = {
        state: _KoniTypes.APIItemState.READY,
        free: (0, _utils.sumBN)(Object.values(freeMap)).toString(),
        reserved: (0, _utils.sumBN)(Object.values(reservedMap)).toString(),
        miscFrozen: (0, _utils.sumBN)(Object.values(miscFrozenMap)).toString(),
        feeFrozen: (0, _utils.sumBN)(Object.values(feeFrozenMap)).toString()
      };
      callback(networkKey, balanceItem);
    });
  });
  return async () => {
    const unsubs = await Promise.all(unsubProms);
    unsubs.forEach(unsub => {
      unsub && unsub();
    });
  };
}

function subscribeERC20Interval(addresses, networkKey, api, originBalanceItem, callback) {
  let tokenList = {};
  const ERC20ContractMap = {};
  const tokenBalanceMap = {};

  const getTokenBalances = () => {
    Object.values(tokenList).map(async _ref => {
      let {
        decimals,
        symbol
      } = _ref;
      let free = new _util.BN(0);

      try {
        const contract = ERC20ContractMap[symbol];
        const bals = await Promise.all(addresses.map(address => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-return,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          return contract.methods.balanceOf(address).call();
        }));
        free = (0, _utils.sumBN)(bals.map(bal => new _util.BN(bal || 0))); // console.log('TokenBals', symbol, addresses, bals, free);

        tokenBalanceMap[symbol] = {
          reserved: '0',
          frozen: '0',
          free: free.toString(),
          decimals
        };
      } catch (err) {
        console.log('There is problem when fetching ' + symbol + ' token balance', err);
      }
    });
    originBalanceItem.children = tokenBalanceMap;
    callback && callback(networkKey, originBalanceItem);
  };

  (0, _registry.getRegistry)(networkKey, api, _handlers.state.getErc20Tokens()).then(_ref2 => {
    let {
      tokenMap
    } = _ref2;
    tokenList = Object.values(tokenMap).filter(_ref3 => {
      let {
        erc20Address
      } = _ref3;
      return !!erc20Address;
    });
    tokenList.forEach(_ref4 => {
      let {
        erc20Address,
        symbol
      } = _ref4;

      if (erc20Address) {
        ERC20ContractMap[symbol] = (0, _web.getERC20Contract)(networkKey, erc20Address);
      }
    });
    getTokenBalances();
  }).catch(console.error);
  const interval = setInterval(getTokenBalances, _constants.MOONBEAM_REFRESH_BALANCE_INTERVAL);
  return () => {
    clearInterval(interval);
  };
}

function subscribeTokensBalance(addresses, networkKey, api, originBalanceItem, callback, includeMainToken) {
  let forceStop = false;

  let unsubAll = () => {
    forceStop = true;
  };

  originBalanceItem.children = originBalanceItem.children || {};
  (0, _registry.getRegistry)(networkKey, api).then(_ref5 => {
    let {
      tokenMap
    } = _ref5;

    if (forceStop) {
      return;
    }

    let tokenList = Object.values(tokenMap);

    if (!includeMainToken) {
      tokenList = tokenList.filter(t => !t.isMainToken);
    }

    if (tokenList.length > 0) {
      console.log('Get tokens balance of', networkKey, tokenList);
    }

    const unsubList = tokenList.map(_ref6 => {
      let {
        decimals,
        specialOption,
        symbol
      } = _ref6;
      const observable = new _rxjs.Observable(subscriber => {
        // Get Token Balance
        // @ts-ignore
        const apiCall = api.query.tokens.accounts.multi(addresses.map(address => [address, options]), balances => {
          const tokenBalance = {
            reserved: (0, _utils.sumBN)(balances.map(b => b.reserved || new _util.BN(0))).toString(),
            frozen: (0, _utils.sumBN)(balances.map(b => b.frozen || new _util.BN(0))).toString(),
            free: (0, _utils.sumBN)(balances.map(b => b.free || new _util.BN(0))).toString(),
            decimals
          };
          subscriber.next(tokenBalance);
        });
      });
      const options = specialOption || {
        Token: symbol
      };
      return observable.subscribe({
        next: childBalance => {
          if (includeMainToken && tokenMap[symbol].isMainToken) {
            originBalanceItem.state = _KoniTypes.APIItemState.READY;
            originBalanceItem.free = childBalance.free;
            originBalanceItem.reserved = childBalance.reserved;
            originBalanceItem.feeFrozen = childBalance.frozen;
          } else {
            // @ts-ignore
            originBalanceItem.children[symbol] = childBalance;
          }

          callback(originBalanceItem);
        }
      });
    });

    unsubAll = () => {
      unsubList.forEach(unsub => {
        unsub && unsub.unsubscribe();
      });
    };
  }).catch(console.error);
  return unsubAll;
}

function subscribeAssetsBalance(addresses, networkKey, api, originBalanceItem, callback) {
  let forceStop = false;

  let unsubAll = () => {
    forceStop = true;
  };

  originBalanceItem.children = originBalanceItem.children || {};
  (0, _registry.getRegistry)(networkKey, api).then(_ref7 => {
    let {
      tokenMap
    } = _ref7;

    if (forceStop) {
      return;
    }

    let tokenList = Object.values(tokenMap);
    tokenList = tokenList.filter(t => !t.isMainToken && t.assetIndex);

    if (tokenList.length > 0) {
      console.log('Get tokens assets of', networkKey, tokenList);
    }

    const unsubList = tokenList.map(_ref8 => {
      let {
        assetIndex,
        decimals,
        symbol
      } = _ref8;
      const observable = new _rxjs.Observable(subscriber => {
        // Get Token Balance
        // @ts-ignore
        const apiCall = api.query.assets.account.multi(addresses.map(address => [assetIndex, address]), balances => {
          let free = new _util.BN(0);
          let frozen = new _util.BN(0);
          balances.forEach(b => {
            // @ts-ignore
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-assignment
            const bdata = b === null || b === void 0 ? void 0 : b.toJSON();

            if (bdata) {
              // @ts-ignore
              // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-argument
              const addressBalance = new _util.BN(String(bdata === null || bdata === void 0 ? void 0 : bdata.balance) || '0'); // @ts-ignore

              if (bdata !== null && bdata !== void 0 && bdata.isFrozen) {
                frozen = frozen.add(addressBalance);
              } else {
                free = free.add(addressBalance);
              }
            }
          });
          const tokenBalance = {
            reserved: '0',
            frozen: frozen.toString(),
            free: free.toString(),
            decimals
          };
          subscriber.next(tokenBalance);
        });
      });
      return observable.subscribe({
        next: childBalance => {
          // @ts-ignore
          originBalanceItem.children[symbol] = childBalance;
          callback(originBalanceItem);
        }
      });
    });

    unsubAll = () => {
      unsubList.forEach(unsub => {
        unsub && unsub.unsubscribe();
      });
    };
  }).catch(console.error);
  return unsubAll;
}

function subscribeWithAccountMulti(addresses, networkKey, networkAPI, callback) {
  const balanceItem = {
    state: _KoniTypes.APIItemState.PENDING,
    free: '0',
    reserved: '0',
    miscFrozen: '0',
    feeFrozen: '0',
    children: undefined
  }; // @ts-ignore

  let unsub;

  if (!['kintsugi', 'interlay', 'kintsugi_test'].includes(networkKey)) {
    unsub = networkAPI.api.query.system.account.multi(addresses, balances => {
      let [free, reserved, miscFrozen, feeFrozen] = [new _util.BN(0), new _util.BN(0), new _util.BN(0), new _util.BN(0)];
      balances.forEach(balance => {
        var _balance$data, _balance$data$free, _balance$data2, _balance$data2$reserv, _balance$data3, _balance$data3$miscFr, _balance$data4, _balance$data4$feeFro;

        free = free.add(((_balance$data = balance.data) === null || _balance$data === void 0 ? void 0 : (_balance$data$free = _balance$data.free) === null || _balance$data$free === void 0 ? void 0 : _balance$data$free.toBn()) || new _util.BN(0));
        reserved = reserved.add(((_balance$data2 = balance.data) === null || _balance$data2 === void 0 ? void 0 : (_balance$data2$reserv = _balance$data2.reserved) === null || _balance$data2$reserv === void 0 ? void 0 : _balance$data2$reserv.toBn()) || new _util.BN(0));
        miscFrozen = miscFrozen.add(((_balance$data3 = balance.data) === null || _balance$data3 === void 0 ? void 0 : (_balance$data3$miscFr = _balance$data3.miscFrozen) === null || _balance$data3$miscFr === void 0 ? void 0 : _balance$data3$miscFr.toBn()) || new _util.BN(0));
        feeFrozen = feeFrozen.add(((_balance$data4 = balance.data) === null || _balance$data4 === void 0 ? void 0 : (_balance$data4$feeFro = _balance$data4.feeFrozen) === null || _balance$data4$feeFro === void 0 ? void 0 : _balance$data4$feeFro.toBn()) || new _util.BN(0));
      });
      balanceItem.state = _KoniTypes.APIItemState.READY;
      balanceItem.free = free.toString();
      balanceItem.reserved = reserved.toString();
      balanceItem.miscFrozen = miscFrozen.toString();
      balanceItem.feeFrozen = feeFrozen.toString();
      callback(networkKey, balanceItem);
    });
  }

  let unsub2;

  if (['bifrost', 'acala', 'karura', 'acala_testnet'].includes(networkKey)) {
    unsub2 = subscribeTokensBalance(addresses, networkKey, networkAPI.api, balanceItem, balanceItem => {
      callback(networkKey, balanceItem);
    });
  } else if (['kintsugi', 'interlay', 'kintsugi_test'].includes(networkKey)) {
    unsub2 = subscribeTokensBalance(addresses, networkKey, networkAPI.api, balanceItem, balanceItem => {
      callback(networkKey, balanceItem);
    }, true);
  } else if (['statemine'].indexOf(networkKey) > -1) {
    unsub2 = subscribeAssetsBalance(addresses, networkKey, networkAPI.api, balanceItem, balanceItem => {
      callback(networkKey, balanceItem);
    });
  } else if (_apiHelper.moonbeamBaseChains.indexOf(networkKey) > -1) {
    unsub2 = subscribeERC20Interval(addresses, networkKey, networkAPI.api, balanceItem, callback);
  }

  return async () => {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    unsub && (await unsub)();
    unsub2 && unsub2();
  };
}

function subscribeEVMBalance(networkKey, api, addresses, callback) {
  const balanceItem = {
    state: _KoniTypes.APIItemState.PENDING,
    free: '0',
    reserved: '0',
    miscFrozen: '0',
    feeFrozen: '0'
  };

  function getBalance() {
    (0, _balance.getEVMBalance)(networkKey, addresses).then(balances => {
      balanceItem.free = (0, _utils.sumBN)(balances.map(b => new _util.BN(b || '0'))).toString();
      balanceItem.state = _KoniTypes.APIItemState.READY;
      callback(networkKey, balanceItem);
    }).catch(console.error);
  }

  getBalance();
  const interval = setInterval(getBalance, _constants.ASTAR_REFRESH_BALANCE_INTERVAL);
  const unsub2 = subscribeERC20Interval(addresses, networkKey, api, balanceItem, callback);
  return () => {
    clearInterval(interval);
    unsub2 && unsub2();
  };
}

function subscribeBalance(addresses, dotSamaAPIMap, callback) {
  const [substrateAddresses, evmAddresses] = (0, _utils.categoryAddresses)(addresses);
  return Object.entries(dotSamaAPIMap).map(async _ref9 => {
    let [networkKey, apiProps] = _ref9;
    const networkAPI = await apiProps.isReady;
    const useAddresses = _apiHelper.ethereumChains.indexOf(networkKey) > -1 ? evmAddresses : substrateAddresses;

    if (networkKey === 'astarEvm' || networkKey === 'shidenEvm') {
      return subscribeEVMBalance(networkKey, networkAPI.api, useAddresses, callback);
    }

    if (!useAddresses || useAddresses.length === 0 || _constants.IGNORE_GET_SUBSTRATE_FEATURES_LIST.indexOf(networkKey) > -1) {
      // Return zero balance if not have any address
      const zeroBalance = {
        state: _KoniTypes.APIItemState.READY,
        free: '0',
        reserved: '0',
        miscFrozen: '0',
        feeFrozen: '0'
      };
      callback(networkKey, zeroBalance);
      return undefined;
    } // eslint-disable-next-line @typescript-eslint/no-misused-promises


    return subscribeWithAccountMulti(useAddresses, networkKey, networkAPI, callback);
  });
}

async function getFreeBalance(networkKey, address, token) {
  var _balance$data5, _balance$data5$free;

  const apiProps = await _handlers.dotSamaAPIMap[networkKey].isReady;
  const api = apiProps.api;

  if (token) {
    const tokenInfo = await (0, _registry.getTokenInfo)(networkKey, api, token);
    const isMainToken = !!(tokenInfo !== null && tokenInfo !== void 0 && tokenInfo.isMainToken);

    if (_apiHelper.ethereumChains.includes(networkKey) && tokenInfo !== null && tokenInfo !== void 0 && tokenInfo.erc20Address) {
      if (!isMainToken) {
        const contract = (0, _web.getERC20Contract)(networkKey, tokenInfo.erc20Address); // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access

        const free = await contract.methods.balanceOf(address).call(); // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-return

        return (free === null || free === void 0 ? void 0 : free.toString()) || '0';
      }
    } else {
      if (!isMainToken || ['kintsugi', 'kintsugi_test', 'interlay'].includes(networkKey)) {
        var _balance$free;

        // @ts-ignore
        const balance = await api.query.tokens.accounts(address, (tokenInfo === null || tokenInfo === void 0 ? void 0 : tokenInfo.specialOption) || {
          Token: token
        });
        return ((_balance$free = balance.free) === null || _balance$free === void 0 ? void 0 : _balance$free.toString()) || '0';
      }
    }
  }

  const balance = await api.query.system.account(address);
  return ((_balance$data5 = balance.data) === null || _balance$data5 === void 0 ? void 0 : (_balance$data5$free = _balance$data5.free) === null || _balance$data5$free === void 0 ? void 0 : _balance$data5$free.toString()) || '0';
}

async function subscribeFreeBalance(networkKey, address, token, update) {
  const apiProps = await _handlers.dotSamaAPIMap[networkKey].isReady;
  const api = apiProps.api; // todo: Need update the condition if the way to get ethereum chains is dynamic

  if (_apiHelper.ethereumChains.includes(networkKey)) {
    if (!(0, _utilCrypto.isEthereumAddress)(address)) {
      update('0');
      return () => undefined;
    }
  } else {
    if ((0, _utilCrypto.isEthereumAddress)(address)) {
      update('0');
      return () => undefined;
    }
  }

  if (token) {
    const tokenInfo = await (0, _registry.getTokenInfo)(networkKey, api, token);
    const isMainToken = !!(tokenInfo !== null && tokenInfo !== void 0 && tokenInfo.isMainToken);

    if (_apiHelper.ethereumChains.includes(networkKey) && tokenInfo !== null && tokenInfo !== void 0 && tokenInfo.erc20Address) {
      if (!isMainToken) {
        const getFreeBalance = () => {
          if (!(tokenInfo !== null && tokenInfo !== void 0 && tokenInfo.erc20Address)) {
            return;
          }

          const contract = (0, _web.getERC20Contract)(networkKey, tokenInfo.erc20Address); // @ts-ignore
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access

          contract.methods.balanceOf(address).call().then(free => {
            // eslint-disable-next-line node/no-callback-literal,@typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
            update((free === null || free === void 0 ? void 0 : free.toString()) || '0');
          });
        };

        getFreeBalance();
        const interval = setInterval(getFreeBalance, _constants.MOONBEAM_REFRESH_BALANCE_INTERVAL);
        return () => {
          clearInterval(interval);
        };
      }
    } else {
      if (!isMainToken || ['kintsugi', 'kintsugi_test', 'interlay'].includes(networkKey)) {
        // @ts-ignore
        const unsub = await api.query.tokens.accounts(address, (tokenInfo === null || tokenInfo === void 0 ? void 0 : tokenInfo.specialOption) || {
          Token: token
        }, balance => {
          var _balance$free2;

          // eslint-disable-next-line node/no-callback-literal,@typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
          update(((_balance$free2 = balance.free) === null || _balance$free2 === void 0 ? void 0 : _balance$free2.toString()) || '0');
        });
        return () => {
          // @ts-ignore
          unsub && unsub();
        };
      }
    }
  } // @ts-ignore


  const unsub = await api.query.system.account(address, balance => {
    var _balance$data6, _balance$data6$free;

    // eslint-disable-next-line node/no-callback-literal,@typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    update(((_balance$data6 = balance.data) === null || _balance$data6 === void 0 ? void 0 : (_balance$data6$free = _balance$data6.free) === null || _balance$data6$free === void 0 ? void 0 : _balance$data6$free.toString()) || '0');
  });
  return () => {
    // @ts-ignore
    unsub && unsub();
  };
}