// Copyright 2019 @polkadot/extension-base authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { MetadataDef } from '@polkadot/extension-inject/types';

import BaseStore from './Base';

export default class MetadataStore extends BaseStore {
  constructor () {
    super('metadata');
  }

  public all (cb: (key: string, value: MetadataDef) => void): void {
    super.all(cb);
  }

  public get (key: string, cb: (value: MetadataDef) => void): void {
    super.get(key, cb);
  }

  public remove (key: string, cb?: () => void): void {
    super.remove(key, cb);
  }

  public set (key: string, value: MetadataDef, cb?: () => void): void {
    super.set(key, value, cb);
  }
}
