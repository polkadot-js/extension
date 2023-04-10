// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseStoreWithAddressAndChain from '@subwallet/extension-base/services/storage-service/db-stores/BaseStoreWithAddressAndChain';

import { ICrowdloanItem } from '../databases';

export default class CrowdloanStore extends BaseStoreWithAddressAndChain<ICrowdloanItem> {
  getCrowdloan (address: string) {
    return this.table.where('address').equals(address).toArray();
  }

  deleteByChainAndAddress (chain: string, address: string) {
    return this.table.where({ chain, address }).delete();
  }
}
