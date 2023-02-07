// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ExtraDelegationInfo } from '@subwallet/extension-base/background/KoniTypes';
import BaseStoreWithAddressAndChain from '@subwallet/extension-base/services/storage-service/db-stores/BaseStoreWithAddressAndChain';

export default class ExtraDelegationInfoStore extends BaseStoreWithAddressAndChain<ExtraDelegationInfo> {
  getDelegationInfo (chain: string, address: string) {
    return this.table.where('[chain+address]').equals([chain, address]).first();
  }
}
