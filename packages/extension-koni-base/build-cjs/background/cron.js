"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.KoniCron = void 0;

var _rxjs = require("rxjs");

var _coingecko = require("@polkadot/extension-koni-base/api/coingecko");

var _history = require("@polkadot/extension-koni-base/api/subquery/history");

var _handlers = require("@polkadot/extension-koni-base/background/handlers");

var _constants = require("@polkadot/extension-koni-base/constants");

// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0
class KoniCron {
  constructor(subscriptions) {
    this.subscriptions = subscriptions;
  }

  cronMap = {};
  subjectMap = {};

  getCron(name) {
    return this.cronMap[name];
  }

  getSubjectMap(name) {
    return this.subjectMap[name];
  }

  addCron(name, callback, interval) {
    let runFirst = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : true;

    if (runFirst) {
      callback();
    }

    this.cronMap[name] = setInterval(callback, interval);
  }

  addSubscribeCron(name, callback, interval) {
    const sb = new _rxjs.Subject();
    callback(sb);
    this.subjectMap[name] = sb;
    this.cronMap[name] = setInterval(callback, interval);
  }

  removeCron(name) {
    const interval = this.cronMap[name];

    if (interval) {
      clearInterval(interval);
      delete this.cronMap[name];
    }
  }

  init() {
    this.addCron('refreshPrice', this.refreshPrice, _constants.CRON_REFRESH_PRICE_INTERVAL);
    this.addCron('recoverAPI', this.recoverAPI, _constants.CRON_AUTO_RECOVER_DOTSAMA_INTERVAL, false);

    _handlers.state.getCurrentAccount(currentAccountInfo => {
      if (currentAccountInfo) {
        this.addCron('refreshNft', this.refreshNft(currentAccountInfo.address), _constants.CRON_REFRESH_NFT_INTERVAL);
        this.addCron('refreshStakingReward', this.refreshStakingReward(currentAccountInfo.address), _constants.CRON_REFRESH_STAKING_REWARD_INTERVAL);
        this.addCron('refreshHistory', this.refreshHistory(currentAccountInfo.address), _constants.CRON_REFRESH_HISTORY_INTERVAL);
      }

      _handlers.state.subscribeCurrentAccount().subscribe({
        next: _ref => {
          let {
            address
          } = _ref;
          this.resetNft();
          this.resetNftTransferMeta();
          this.resetStakingReward();
          this.resetHistory();
          this.removeCron('refreshNft');
          this.removeCron('refreshStakingReward');
          this.removeCron('refreshHistory');
          this.addCron('refreshNft', this.refreshNft(address), _constants.CRON_REFRESH_NFT_INTERVAL);
          this.addCron('refreshStakingReward', this.refreshStakingReward(address), _constants.CRON_REFRESH_STAKING_REWARD_INTERVAL);
          this.addCron('refreshHistory', this.refreshHistory(address), _constants.CRON_REFRESH_HISTORY_INTERVAL);
        }
      });
    });
  }

  recoverAPI() {
    _handlers.state.getCurrentAccount(_ref2 => {
      var _this$subscriptions;

      let {
        address
      } = _ref2;
      console.log('Auto recovering API');
      Object.values(_handlers.dotSamaAPIMap).forEach(apiProp => {
        if (apiProp.apiRetry && apiProp.apiRetry > _constants.DOTSAMA_MAX_CONTINUE_RETRY) {
          apiProp.recoverConnect && apiProp.recoverConnect();
        }
      });
      ((_this$subscriptions = this.subscriptions) === null || _this$subscriptions === void 0 ? void 0 : _this$subscriptions.subscribeBalancesAndCrowdloans) && this.subscriptions.subscribeBalancesAndCrowdloans(address);
    });
  }

  refreshPrice() {
    (0, _coingecko.getTokenPrice)().then(rs => {
      _handlers.state.setPrice(rs, () => {
        console.log('Get Token Price From CoinGecko');
      });
    }).catch(err => console.log(err));
  }

  refreshNft(address) {
    return () => {
      console.log('Refresh Nft state');
      this.subscriptions.subscribeNft(address);
    };
  }

  resetNft() {
    _handlers.state.resetNft();

    _handlers.state.resetNftCollection();

    console.log('Reset Nft state');
  }

  resetNftTransferMeta() {
    _handlers.state.setNftTransfer({
      cronUpdate: false,
      forceUpdate: false
    });
  }

  resetStakingReward() {
    _handlers.state.resetStakingMap();

    _handlers.state.setStakingReward({
      details: []
    }); // console.log('Reset Staking reward state');

  }

  refreshStakingReward(address) {
    return () => {
      this.subscriptions.subscribeStakingReward(address).then(() => console.log('Refresh staking reward state')).catch(console.error);
    };
  }

  refreshHistory(address) {
    return () => {
      console.log('Refresh History state');
      (0, _history.fetchDotSamaHistory)(address, historyMap => {
        console.log('--- historyMap ---', historyMap);

        _handlers.state.setHistory(historyMap);
      });
    };
  }

  resetHistory() {
    _handlers.state.setHistory({});
  }

}

exports.KoniCron = KoniCron;