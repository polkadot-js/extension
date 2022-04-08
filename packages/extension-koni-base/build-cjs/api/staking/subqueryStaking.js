"use strict";

var _interopRequireDefault = require("@babel/runtime/helpers/interopRequireDefault");

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.getAllSubqueryStakingReward = void 0;

var _axios = _interopRequireDefault(require("axios"));

var _KoniTypes = require("@polkadot/extension-base/background/KoniTypes");

var _endpoints = _interopRequireDefault(require("@polkadot/extension-koni-base/api/endpoints"));

var _config = require("@polkadot/extension-koni-base/api/staking/config");

var _utils = require("@polkadot/extension-koni-base/utils/utils");

// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0
const getSubqueryStakingReward = async (accounts, chain) => {
  const amounts = await Promise.all(accounts.map(async account => {
    const parsedAccount = (0, _utils.reformatAddress)(account, _endpoints.default[chain].ss58Format);
    const resp = await (0, _axios.default)({
      url: _config.SUBQUERY_ENDPOINTS[chain],
      method: 'post',
      data: {
        query: `
        query {
          accumulatedRewards (filter: {id: {equalTo: "${parsedAccount}"}}) {
            nodes {
              id
              amount
            }
          }
        }
      `
      }
    });

    if (resp.status === 200) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      const respData = resp.data.data; // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access

      const rewardList = respData.accumulatedRewards.nodes;

      if (rewardList.length > 0) {
        return parseFloat(rewardList[0].amount);
      }

      return 0;
    }

    return 0;
  }));
  let parsedAmount = 0;

  for (const amount of amounts) {
    parsedAmount += amount;
  } // @ts-ignore


  parsedAmount = (0, _utils.toUnit)(parsedAmount, _endpoints.default[chain].decimals);
  return {
    name: _endpoints.default[chain].chain,
    chainId: chain,
    totalReward: parsedAmount.toString(),
    state: _KoniTypes.APIItemState.READY
  };
};

const getAllSubqueryStakingReward = async accounts => {
  let rewardList = [];
  const rewardItems = await Promise.all(_config.SUPPORTED_STAKING_CHAINS.map(async chain => {
    return await getSubqueryStakingReward(accounts, chain);
  }));
  rewardList = rewardList.concat(rewardItems);
  return {
    details: rewardList
  };
};

exports.getAllSubqueryStakingReward = getAllSubqueryStakingReward;