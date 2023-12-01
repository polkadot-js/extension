// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import State from '@subwallet/extension-base/koni/background/handlers/State';

import MigrateProvider from './MigrateProvider';

export interface MigrateProviderTarget {
  slug: string;
  oldProvider: string;
  newProvider: string;
}

export default class MigrateGeneralProvider extends MigrateProvider {
  readonly newProvider: string;
  readonly oldProvider: string;
  readonly slug: string;

  constructor (state: State, target: MigrateProviderTarget) {
    super(state);

    this.slug = target.slug;
    this.oldProvider = target.oldProvider;
    this.newProvider = target.newProvider;
  }
}
