// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Tabs from '@polkadot/extension-base/background/handlers/Tabs';
import { RandomTestRequest } from '@polkadot/extension-base/background/KoniTypes';
import { MessageTypes, RequestTypes, ResponseTypes } from '@polkadot/extension-base/background/types';
import { state } from '@polkadot/extension-koni-base/background/handlers/index';

export default class KoniTabs extends Tabs {
  private static getRandom ({ end, start }: RandomTestRequest): number {
    return Math.floor(Math.random() * (end - start + 1) + start);
  }

  public override async handle<TMessageType extends MessageTypes> (id: string, type: TMessageType, request: RequestTypes[TMessageType], url: string, port: chrome.runtime.Port): Promise<ResponseTypes[keyof ResponseTypes]> {
    if (type === 'pub(phishing.redirectIfDenied)') {
      return this.redirectIfPhishing(url);
    }

    if (type !== 'pub(authorize.tab)') {
      state.ensureUrlAuthorized(url);
    }

    switch (type) {
      case 'pub:utils.getRandom':
        return KoniTabs.getRandom(request as RandomTestRequest);
      default:
        return super.handle(id, type, request, url, port);
    }
  }
}
