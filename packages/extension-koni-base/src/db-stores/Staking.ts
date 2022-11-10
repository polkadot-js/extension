// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakingType } from '@subwallet/extension-base/background/KoniTypes';
import { liveQuery } from 'dexie';

import { IStakingItem } from '../databases';
import BaseStoreWithAddress from './BaseStoreWithAddress';

export default class StakingStore extends BaseStoreWithAddress<IStakingItem> {
  getSingleRecord (chainHash: string, address: string, type: StakingType) {
    return this.table.where('[chainHash+address+type]').equals([chainHash, address, type]).first();
  }

  getStakings (addresses: string[], chainHashes: string[] = []) {
    if (addresses.length) {
      return this.table.where('address').anyOfIgnoreCase(addresses).and((item) => (!chainHashes.length || chainHashes.includes(item.chainHash)) && parseFloat(item.balance as string) > 0).toArray();
    }

    return this.table.filter((item) => (!chainHashes.length || chainHashes.includes(item.chainHash)) && parseFloat(item.balance as string) > 0).toArray();
  }

  subscribeStaking (addresses: string[], chainHashes: string[] = []) {
    return liveQuery(
      () => this.getStakings(addresses, chainHashes)
    );
  }
}
