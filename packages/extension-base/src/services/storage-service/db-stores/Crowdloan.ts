// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseStoreWithAddressAndChain from '@subwallet/extension-base/services/storage-service/db-stores/BaseStoreWithAddressAndChain';

import { ICrowdloanItem } from '../databases';

export default class CrowdloanStore extends BaseStoreWithAddressAndChain<ICrowdloanItem> {
  async removeEndedCrowdloans () {
    const now = new Date();
    const removeList: string[] = [];

    await this.table.each((obj, cursor) => {
      try {
        if (!obj.endTime || new Date(obj.endTime) < now) {
          removeList.push(cursor.primaryKey as string);
        }
      } catch (e) {
        console.error(e);
      }
    });

    await this.table.bulkDelete(removeList);
  }

  getCrowdloan (address: string) {
    return this.table.where('address').equals(address).toArray();
  }

  deleteByChainAndAddress (chain: string, address: string) {
    return this.table.where({ chain, address }).delete();
  }

  checkCrowdloanByChain (chain: string, filterFunc: (i: ICrowdloanItem) => boolean) {
    return this.table.where({ chain }).filter(filterFunc).count();
  }

  checkCrowdloanExist (filterFunc: (i: ICrowdloanItem) => boolean) {
    return this.table.filter(filterFunc).count();
  }
}
