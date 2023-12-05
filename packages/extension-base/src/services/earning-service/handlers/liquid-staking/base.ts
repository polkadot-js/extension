// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { YIELD_POOL_STAT_REFRESH_INTERVAL } from '@subwallet/extension-base/koni/api/yield/helper/utils';
import { EarningRewardItem, LiquidYieldPoolInfo, YieldPoolInfo, YieldPoolType } from '@subwallet/extension-base/types';

import { noop } from '@polkadot/util';

import BasePoolHandler from '../base';

export default abstract class BaseLiquidStakingPoolHandler extends BasePoolHandler {
  protected readonly type: YieldPoolType.LIQUID_STAKING = YieldPoolType.LIQUID_STAKING;
  protected abstract altInputAssets: string[];
  protected abstract derivativeAssets: string[];
  protected abstract inputAssets: string[];
  protected abstract rewardAssets: string[];
  protected abstract feeAssets: string[];

  protected override get defaultInfo (): Omit<
  LiquidYieldPoolInfo,
  'metadata'
  > {
    return {
      description: this.description,
      name: this.name,
      group: this.group,
      chain: this.chain,
      slug: this.slug,
      altInputAssets: this.altInputAssets,
      derivativeAssets: this.derivativeAssets,
      inputAssets: this.inputAssets,
      rewardAssets: this.rewardAssets,
      feeAssets: this.feeAssets,
      type: this.type
    };
  }

  protected get defaultBaseInfo (): Pick<YieldPoolInfo, 'name' | 'group' | 'chain' | 'slug'> {
    return super.defaultInfo;
  }

  /* Subscribe pool info */

  abstract getPoolStat (): Promise<LiquidYieldPoolInfo>;

  async subscribePoolInfo (callback: (data: YieldPoolInfo) => void): Promise<VoidFunction> {
    let cancel = false;

    const getStatInterval = () => {
      this.getPoolStat()
        .then((rs) => {
          if (cancel) {
            callback(rs);
          }
        })
        .catch(console.error);
    };

    getStatInterval();

    const interval = setInterval(() => {
      if (cancel) {
        clearInterval(interval);
      } else {
        getStatInterval();
      }
    }, YIELD_POOL_STAT_REFRESH_INTERVAL);

    return new Promise<VoidFunction>((resolve) => {
      const rs = () => {
        cancel = true;
        clearInterval(interval);
      };

      resolve(rs);
    });
  }

  /* Subscribe pool info */

  /* Get pool reward */

  async getPoolReward (useAddresses: string[], callBack: (rs: EarningRewardItem) => void): Promise<VoidFunction> {
    return new Promise((resolve) => resolve(noop));
  }

  /* Get pool reward */
}
