// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import BaseStoreWithAddressAndChain from '@subwallet/extension-base/services/storage-service/db-stores/BaseStoreWithAddressAndChain';

import { IOrdinal } from '../databases';

export default class NftStore extends BaseStoreWithAddressAndChain<IOrdinal> {
  getByChainAndAddress (chain: string, address: string) {
    return this.table.where('[chain+address]').equals([chain, address]).toArray();
  }
}
