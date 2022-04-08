"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAllSubsquidStaking = void 0;

var _axios = _interopRequireDefault(require("axios"));

var _KoniTypes = require("@polkadot/extension-base/background/KoniTypes");

var _endpoints = _interopRequireDefault(require("@polkadot/extension-koni-base/api/endpoints"));

var _config = require("@polkadot/extension-koni-base/api/staking/config");

var _utils = require("@polkadot/extension-koni-base/utils/utils");

// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0
const getSubsquidQuery = (account, chain) => {
  if (chain === 'astar') {
    return `
    query MyQuery {
      accountById(id: "${account}") {
        totalReward
        totalBond
        rewards(limit: 1, orderBy: blockNumber_DESC) {
          amount
          smartContract
        }
      }
    }`;
  }

  return `
  query MyQuery {
    accountById(id: "${account}") {
      totalReward
      totalSlash
      totalBond
      rewards(limit: 1, orderBy: blockNumber_DESC) {
        amount
      }
    }
  }`;
};

const getSubsquidStaking = async (accounts, chain, callback) => {
  try {
    const parsedResult = {};
    const rewards = await Promise.all(accounts.map(async account => {
      const parsedAccount = (0, _utils.reformatAddress)(account, _endpoints.default[chain].ss58Format);
      const result = {};
      const resp = await (0, _axios.default)({
        url: _config.SUBSQUID_ENDPOINTS[chain],
        method: 'post',
        data: {
          query: getSubsquidQuery(parsedAccount, chain)
        }
      });

      if (resp.status === 200) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        const respData = resp.data.data;
        const rewardItem = respData.accountById;

        if (rewardItem) {
          const latestReward = rewardItem.rewards[0];

          if (rewardItem.totalReward) {
            result.totalReward = parseFloat(rewardItem.totalReward);
          }

          if (rewardItem.totalSlash) {
            result.totalSlash = parseFloat(rewardItem.totalSlash);
          }

          if (rewardItem.totalBond) {
            result.totalBond = parseFloat(rewardItem.totalBond);
          }

          if (latestReward && latestReward.amount) {
            result.latestReward = parseFloat(latestReward.amount);
          }

          if (latestReward && latestReward.smartContract) {
            result.smartContract = latestReward.smartContract;
          }
        }
      }

      return result;
    }));

    for (const reward of rewards) {
      if (reward.smartContract) {
        parsedResult.smartContract = reward.smartContract;
      }

      if (reward.totalReward) {
        if (parsedResult.totalReward) {
          parsedResult.totalReward += (0, _utils.toUnit)(reward.totalReward, _endpoints.default[chain].decimals);
        } else {
          parsedResult.totalReward = (0, _utils.toUnit)(reward.totalReward, _endpoints.default[chain].decimals);
        }
      }

      if (reward.totalSlash) {
        if (parsedResult.totalSlash) {
          parsedResult.totalSlash += (0, _utils.toUnit)(reward.totalSlash, _endpoints.default[chain].decimals);
        } else {
          parsedResult.totalSlash = (0, _utils.toUnit)(reward.totalSlash, _endpoints.default[chain].decimals);
        }
      }

      if (reward.totalBond) {
        if (parsedResult.totalBond) {
          parsedResult.totalBond += (0, _utils.toUnit)(reward.totalBond, _endpoints.default[chain].decimals);
        } else {
          parsedResult.totalBond = (0, _utils.toUnit)(reward.totalBond, _endpoints.default[chain].decimals);
        }
      }

      if (reward.latestReward) {
        if (parsedResult.latestReward) {
          parsedResult.latestReward += (0, _utils.toUnit)(reward.latestReward, _endpoints.default[chain].decimals);
        } else {
          parsedResult.latestReward = (0, _utils.toUnit)(reward.latestReward, _endpoints.default[chain].decimals);
        }
      }
    }

    callback(chain, {
      name: _endpoints.default[chain].chain,
      chainId: chain,
      balance: parsedResult.totalBond ? parsedResult.totalBond.toString() : '0',
      nativeToken: _endpoints.default[chain].nativeToken,
      unit: _endpoints.default[chain].nativeToken,
      state: _KoniTypes.APIItemState.READY
    });
    return {
      name: _endpoints.default[chain].chain,
      chainId: chain,
      totalReward: parsedResult.totalReward ? parsedResult.totalReward.toString() : '0',
      latestReward: parsedResult.latestReward ? parsedResult.latestReward.toString() : '0',
      totalSlash: parsedResult.totalSlash ? parsedResult.totalSlash.toString() : '0',
      smartContract: parsedResult.smartContract,
      state: _KoniTypes.APIItemState.READY
    };
  } catch (e) {
    console.log(`error getting ${chain} staking reward from subsquid`, e);
    return {
      name: _endpoints.default[chain].chain,
      chainId: chain,
      totalReward: '0',
      latestReward: '0',
      totalSlash: '0',
      state: _KoniTypes.APIItemState.READY
    };
  }
};

const getAllSubsquidStaking = async (accounts, callback) => {
  let rewardList = [];
  const rewardItems = await Promise.all(_config.SUPPORTED_STAKING_CHAINS.map(async network => {
    return await getSubsquidStaking(accounts, network, callback);
  }));
  rewardList = rewardList.concat(rewardItems);
  return {
    details: rewardList
  };
};

exports.getAllSubsquidStaking = getAllSubsquidStaking;