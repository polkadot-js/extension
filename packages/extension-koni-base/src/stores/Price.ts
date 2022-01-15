// Copyright 2019-2021 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import { EXTENSION_PREFIX } from '@polkadot/extension-base/defaults';
import SubscribableStore from '@polkadot/extension-koni-base/stores/SubcribableStore';
import { PriceJson } from '@polkadot/extension-koni-base/stores/types';

export default class PriceStore extends SubscribableStore<PriceJson> {
  constructor () {
    super(EXTENSION_PREFIX ? `${EXTENSION_PREFIX}price` : null);
  }
}
