// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ICrowdloanItem } from '../databases';
import BaseStoreWithAddress from './BaseStoreWithAddress';

export default class CrowdloanStore extends BaseStoreWithAddress <ICrowdloanItem> {
  getCrowdloan (address: string) {
    return this.table.where('address').equals(address).toArray();
  }

  deleteByChainAndAddress (chainHash: string, address: string) {
    return this.table.where({ chainHash, address }).delete();
  }
}
