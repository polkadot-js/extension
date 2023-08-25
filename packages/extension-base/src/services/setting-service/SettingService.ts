// Copyright 2019-2022 @subwallet/extension-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { PassPhishing, RequestSettingsType } from '@subwallet/extension-base/background/KoniTypes';
import PassPhishingStore from '@subwallet/extension-base/stores/PassPhishingStore';
import SettingsStore from '@subwallet/extension-base/stores/Settings';
import { Subject } from 'rxjs';

import { DEFAULT_SETTING } from './constants';

export default class SettingService {
  private readonly settingsStore = new SettingsStore();
  private readonly passPhishingStore = new PassPhishingStore();

  public getSubject (): Subject<RequestSettingsType> {
    return this.settingsStore.getSubject();
  }

  public getSettings (update: (value: RequestSettingsType) => void): void {
    this.settingsStore.get('Settings', (value) => {
      update({
        ...DEFAULT_SETTING,
        ...(value || {})
      });
    });
  }

  public setSettings (data: RequestSettingsType, callback?: () => void): void {
    this.settingsStore.set('Settings', data, callback);
  }

  public passPhishingSubject (): Subject<Record<string, PassPhishing>> {
    return this.passPhishingStore.getSubject();
  }

  public getPassPhishingList (update: (value: Record<string, PassPhishing>) => void): void {
    this.passPhishingStore.get('PassPhishing', (value) => {
      update(value || {});
    });
  }

  public setPassPhishing (data: Record<string, PassPhishing>, callback?: () => void): void {
    this.passPhishingStore.set('PassPhishing', data, callback);
  }

  public resetWallet () {
    this.settingsStore.set('Settings', DEFAULT_SETTING);
    this.passPhishingStore.set('PassPhishing', {});
  }
}
