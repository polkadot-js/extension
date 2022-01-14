// Copyright 2019-2021 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Tabs from '@polkadot/extension-base/background/handlers/Tabs';
import { MessageTypes, RequestTypes, ResponseTypes } from '@polkadot/extension-base/background/types';
import { RandomTestRequest } from '@polkadot/extension-base/background/KoniTypes';

export default class KoniTabs extends Tabs {
  private static getRandom ({ end, start }: RandomTestRequest): number {
    return Math.floor(Math.random() * (end - start + 1) + start);
  }

  public override async handle<TMessageType extends MessageTypes> (id: string, type: TMessageType, request: RequestTypes[TMessageType], url: string, port: chrome.runtime.Port): Promise<ResponseTypes[keyof ResponseTypes]> {
    if (type === 'pub(phishing.redirectIfDenied)') {
      return this.redirectIfPhishing(url);
    }

    if (type !== 'pub(authorize.tab)') {
      this.getState().ensureUrlAuthorized(url);
    }

    switch (type) {
      case 'pub:utils.getRandom':
        return KoniTabs.getRandom(request as RandomTestRequest);
      default:
        return super.handle(id, type, request, url, port);
    }
  }
}
