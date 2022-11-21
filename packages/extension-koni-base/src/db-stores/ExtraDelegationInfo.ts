// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { IExtraDelegationInfo } from '@subwallet/extension-koni-base/databases';
import BaseStoreWithAddress from '@subwallet/extension-koni-base/db-stores/BaseStoreWithAddress';

export default class ExtraDelegationInfoStore extends BaseStoreWithAddress<IExtraDelegationInfo> {
  getDelegationInfo (chain: string, address: string) {
    return this.table.where('[chain+address]').equals([chain, address]).first();
  }
}
