// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { liveQuery } from 'dexie';

import { INftCollection } from '../databases';
import BaseStore from './BaseStore';

export default class NftCollectionStore extends BaseStore<INftCollection> {
  subscribeNftCollection () {
    return liveQuery(
      () => this.table.toArray()
    );
  }
}
