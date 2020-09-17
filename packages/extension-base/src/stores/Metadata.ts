// Copyright 2019-2020 @polkadot/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { MetadataDef } from '@polkadot/extension-inject/types';

import BaseStore from './Base';

export default class MetadataStore extends BaseStore<MetadataDef> {
  constructor () {
    super('metadata');
  }

  public all (cb: (key: string, value: MetadataDef) => void): void {
    super.all(cb);
  }

  public get (key: string, update: (value: MetadataDef) => void): void {
    super.get(key, update);
  }

  public remove (key: string, update?: () => void): void {
    super.remove(key, update);
  }

  public set (key: string, value: MetadataDef, update?: () => void): void {
    super.set(key, value, update);
  }
}
