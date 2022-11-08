// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { StakingType } from '@subwallet/extension-base/background/KoniTypes';

import { IStakingItem } from '../databases';
import BaseStoreWithAddress from './BaseStoreWithAddress';

export default class StakingStore extends BaseStoreWithAddress<IStakingItem> {
  getSingleRecord (chainHash: string, address: string, type: StakingType) {
    console.log('querying', chainHash, address, type);
    return this.table.where('[chainHash+address+type]').equals([chainHash, address, type]).first();
  }
}
