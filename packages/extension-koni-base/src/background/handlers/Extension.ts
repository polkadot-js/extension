// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Extension from '@polkadot/extension-base/background/handlers/Extension';
import { createSubscription, unsubscribe } from '@polkadot/extension-base/background/handlers/subscriptions';
import { PriceJson } from '@polkadot/extension-base/background/KoniTypes';
import { MessageTypes, RequestTypes, ResponseType } from '@polkadot/extension-base/background/types';
import { state } from '@polkadot/extension-koni-base/background/handlers/index';

export default class KoniExtension extends Extension {
  private getPrice (): Promise<PriceJson> {
    return new Promise<PriceJson>((resolve, reject) => {
      state.getPrice((rs: PriceJson) => {
        resolve(rs);
      });
    });
  }

  private subscribePrice (id: string, port: chrome.runtime.Port): boolean {
    const cb = createSubscription<'pri(price.getSubscription)'>(id, port);

    state.subscribePrice().subscribe({
      next: (rs) => {
        cb(rs);
      }
    });

    port.onDisconnect.addListener((): void => {
      unsubscribe(id);
    });

    return true;
  }

  // eslint-disable-next-line @typescript-eslint/require-await
  public override async handle<TMessageType extends MessageTypes> (id: string, type: TMessageType, request: RequestTypes[TMessageType], port: chrome.runtime.Port): Promise<ResponseType<TMessageType>> {
    switch (type) {
      case 'pri(price.getPrice)':
        return await this.getPrice();
      case 'pri(price.getSubscription)':
        return this.subscribePrice(id, port);
      default:
        return super.handle(id, type, request, port);
    }
  }
}
