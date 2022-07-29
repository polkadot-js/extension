// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApplicationMetadataType } from '@subwallet/extension-base/background/KoniTypes';
import { EXTENSION_PREFIX } from '@subwallet/extension-base/defaults';
import SubscribableStore from '@subwallet/extension-koni-base/stores/SubscribableStore';

const APPLICATION_METADATA_KEY = 'application';

export default class ApplicationStore extends SubscribableStore<ApplicationMetadataType> {
  constructor () {
    super(EXTENSION_PREFIX);
  }

  public async getVersion (): Promise<string> {
    const meta = await this.asyncGet(APPLICATION_METADATA_KEY);

    return meta?.version;
  }

  public async setVersion (version: string): Promise<void> {
    const meta = await this.asyncGet(APPLICATION_METADATA_KEY) || {};

    meta.version = version;

    return this.set(APPLICATION_METADATA_KEY, meta);
  }
}
