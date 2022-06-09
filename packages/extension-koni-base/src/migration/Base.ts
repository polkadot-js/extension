// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import State from '@subwallet/extension-koni-base/background/handlers/State';

export default class BaseMigrationJob {
  readonly state: State;

  constructor (state: State) {
    this.state = state;
  }

  public run (): Promise<void> {
    return Promise.resolve(console.warn('Need to override function run from base.'));
  }
}
