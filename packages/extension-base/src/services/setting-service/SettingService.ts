// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RequestSettingsType } from '@subwallet/extension-base/background/KoniTypes';
import SettingsStore from '@subwallet/extension-base/stores/Settings';
import { Subject } from 'rxjs';

import { DEFAULT_SETTING } from './constants';

export default class SettingService {
  private readonly settingsStore = new SettingsStore();

  public getSubject (): Subject<RequestSettingsType> {
    return this.settingsStore.getSubject();
  }

  public getSettings (update: (value: RequestSettingsType) => void): void {
    this.settingsStore.get('Settings', (value) => {
      if (!value) {
        update(DEFAULT_SETTING);
      } else {
        update(value);
      }
    });
  }

  public setSettings (data: RequestSettingsType, callback?: () => void): void {
    this.settingsStore.set('Settings', data, callback);
  }

  public resetWallet () {
    this.settingsStore.set('Settings', DEFAULT_SETTING);
  }
}
