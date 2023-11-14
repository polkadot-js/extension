// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { NominatorMetadata, YieldPoolType, YieldPositionInfo } from '@subwallet/extension-base/background/KoniTypes';
import BaseStore from '@subwallet/extension-base/services/storage-service/db-stores/BaseStore';
import { liveQuery } from 'dexie';

export default class YieldPositionStore extends BaseStore<YieldPositionInfo> {
  async getAll () {
    return this.table.filter((item) => {
      let isValidLiquidStaking = false;

      if (item.type === YieldPoolType.LIQUID_STAKING) {
        const nominatorMetadata = item.metadata as NominatorMetadata;

        if (nominatorMetadata.unstakings.length > 0) {
          console.log('true', item);
          isValidLiquidStaking = true;
        }
      }

      return parseInt(item.balance[0].activeBalance) > 0 || isValidLiquidStaking;
    }).toArray();
  }

  async getByAddress (addresses: string[]) {
    if (addresses.length === 0) {
      return this.getAll();
    }

    return this.table.where('address').anyOfIgnoreCase(addresses).filter((item) => {
      let isValidLiquidStaking = false;

      if (item.type === YieldPoolType.LIQUID_STAKING) {
        const nominatorMetadata = item.metadata as NominatorMetadata;

        if (nominatorMetadata && nominatorMetadata?.unstakings?.length > 0) {
          isValidLiquidStaking = true;
        }
      }

      return parseInt(item.balance[0].activeBalance) > 0 || isValidLiquidStaking;
    }).toArray();
  }

  async getByAddressAndChains (addresses: string[], chains: string[]) {
    return this.table.where('address').anyOfIgnoreCase(addresses).filter((item) => chains.includes(item.chain)).toArray();
  }

  subscribeYieldPositions (addresses: string[]) {
    return liveQuery(
      () => this.getByAddress(addresses)
    );
  }
}
