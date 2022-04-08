"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.KoniSubcription = void 0;

var _rxjs = require("rxjs");

var _balance = require("@polkadot/extension-koni-base/api/dotsama/balance");

var _crowdloan = require("@polkadot/extension-koni-base/api/dotsama/crowdloan");

var _subsquidStaking = require("@polkadot/extension-koni-base/api/staking/subsquidStaking");

var _handlers = require("@polkadot/extension-koni-base/background/handlers");

var _constants = require("@polkadot/extension-koni-base/constants");

var _accounts = require("@polkadot/ui-keyring/observable/accounts");

// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0
class KoniSubcription {
  subscriptionMap = {}; // @ts-ignore

  getSubscriptionMap() {
    return this.subscriptionMap;
  }

  getSubscription(name) {
    return this.subscriptionMap[name];
  }

  init() {
    _handlers.state.getAuthorize(value => {
      const authString = localStorage.getItem('authUrls') || '{}';
      const previousAuth = JSON.parse(authString);

      if (previousAuth && Object.keys(previousAuth).length) {
        Object.keys(previousAuth).forEach(url => {
          if (previousAuth[url].isAllowed) {
            previousAuth[url].isAllowedMap = _handlers.state.getAddressList(true);
          } else {
            previousAuth[url].isAllowedMap = _handlers.state.getAddressList();
          }
        });
      }

      const migrateValue = { ...previousAuth,
        ...value
      };

      _handlers.state.setAuthorize(migrateValue);

      localStorage.setItem('authUrls', '{}');
    });

    _handlers.state.fetchCrowdloanFundMap().then(console.log).catch(console.error);

    _handlers.state.getCurrentAccount(currentAccountInfo => {
      if (currentAccountInfo) {
        const {
          address
        } = currentAccountInfo;
        this.subscribeBalancesAndCrowdloans(address);
      }

      _handlers.state.subscribeCurrentAccount().subscribe({
        next: _ref => {
          let {
            address
          } = _ref;
          this.subscribeBalancesAndCrowdloans(address);
        }
      });
    });
  }

  detectAddresses(currentAccountAddress) {
    return new Promise((resolve, reject) => {
      if (currentAccountAddress === _constants.ALL_ACCOUNT_KEY) {
        _accounts.accounts.subject.pipe((0, _rxjs.take)(1)).subscribe(accounts => {
          resolve([...Object.keys(accounts)]);
        });
      } else {
        return resolve([currentAccountAddress]);
      }
    });
  }

  subscribeBalancesAndCrowdloans(address) {
    this.unsubBalances && this.unsubBalances();
    this.unsubCrowdloans && this.unsubCrowdloans();

    _handlers.state.resetBalanceMap();

    _handlers.state.resetCrowdloanMap();

    this.detectAddresses(address).then(addresses => {
      this.unsubBalances = this.initBalanceSubscription(addresses);
      this.unsubCrowdloans = this.initCrowdloanSubscription(addresses);
    }).catch(console.error);
  }

  initBalanceSubscription(addresses) {
    const subscriptionPromises = (0, _balance.subscribeBalance)(addresses, _handlers.dotSamaAPIMap, (networkKey, rs) => {
      _handlers.state.setBalanceItem(networkKey, rs);
    });
    return () => {
      subscriptionPromises.forEach(subProm => {
        subProm.then(unsub => {
          unsub && unsub();
        }).catch(console.error);
      });
    };
  }

  initCrowdloanSubscription(addresses) {
    const subscriptionPromise = (0, _crowdloan.subscribeCrowdloan)(addresses, _handlers.dotSamaAPIMap, (networkKey, rs) => {
      _handlers.state.setCrowdloanItem(networkKey, rs);
    });
    return () => {
      subscriptionPromise.then(unsubMap => {
        Object.values(unsubMap).forEach(unsub => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-call
          unsub && unsub();
        });
      }).catch(console.error);
    };
  }

  subscribeNft(address) {
    this.detectAddresses(address).then(addresses => {
      this.initNftSubscription(addresses);
    }).catch(console.error);
  }

  initNftSubscription(addresses) {
    const {
      cronUpdate,
      forceUpdate,
      selectedNftCollection
    } = _handlers.state.getNftTransfer();

    if (forceUpdate && !cronUpdate) {
      console.log('skipping set nft state due to transfer');

      _handlers.state.setNftTransfer({
        cronUpdate: true,
        forceUpdate: true,
        selectedNftCollection
      });
    } else {
      // after skipping 1 time of cron update
      _handlers.state.setNftTransfer({
        cronUpdate: false,
        forceUpdate: false,
        selectedNftCollection
      });

      _handlers.nftHandler.setAddresses(addresses);

      _handlers.nftHandler.handleNfts(data => {
        _handlers.state.updateNft(data);
      }, data => {
        if (data !== null) {
          _handlers.state.updateNftCollection(data);
        }
      }, ready => {
        _handlers.state.updateNftReady(ready);
      }).then(() => {
        console.log('nft state updated');
      }).catch(console.log);
    }
  }

  async subscribeStakingReward(address) {
    const addresses = await this.detectAddresses(address);
    await (0, _subsquidStaking.getAllSubsquidStaking)(addresses, (networkKey, rs) => {
      _handlers.state.setStakingItem(networkKey, rs);

      console.log('set staking item', rs);
    }).then(result => {
      _handlers.state.setStakingReward(result);

      console.log('set staking reward state done', result);
    }).catch(console.error);
  }

}

exports.KoniSubcription = KoniSubcription;