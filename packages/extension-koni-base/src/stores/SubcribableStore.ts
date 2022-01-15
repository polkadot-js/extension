// Copyright 2019-2021 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import { Subject } from 'rxjs';

import BaseStore from '@polkadot/extension-base/stores/Base';

export default abstract class SubscribableStore<T> extends BaseStore<T> {
  private readonly subject: Subject<T> = new Subject<T>();

  public getSubject (): Subject<T> {
    return this.subject;
  }

  public override set (_key: string, value: T, update?: () => void): void {
    super.set(_key, value, () => {
      this.subject.next(value);
      update && update();
    });
  }
}
