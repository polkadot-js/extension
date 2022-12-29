// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DefaultChainDocV2 } from '../databases';
import BaseStore from './BaseStore';

export default class BaseStoreWithChainV2<T extends DefaultChainDocV2> extends BaseStore<T> {
  public convertToJsonObject (items: T[]): Record<string, T> {
    return items.reduce((a, v) => ({ ...a, [v._chain]: v }), {});
  }
}
