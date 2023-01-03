// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { IExtraDelegationInfo } from '@subwallet/extension-base/services/storage-service/databases';
import BaseStoreWithAddress from '@subwallet/extension-base/services/storage-service/db-stores/BaseStoreWithAddress';

export default class ExtraDelegationInfoStore extends BaseStoreWithAddress<IExtraDelegationInfo> {
  getDelegationInfo (chain: string, address: string) {
    return this.table.where('[chain+address]').equals([chain, address]).first();
  }
}
