// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DefaultChainDoc } from '../databases';
import BaseStore from './BaseStore';

export default class BaseStoreWithChain<T extends DefaultChainDoc> extends BaseStore<T> {
  public convertToJsonObject (items: T[]): Record<string, T> {
    return items.reduce((a, v) => ({ ...a, [v.chain]: v }), {});
  }
}
