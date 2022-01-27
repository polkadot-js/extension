// Copyright 2019-2022 @polkadot/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Subject } from 'rxjs';

import { BalanceItem, BalanceRPCResponse } from '@polkadot/extension-base/background/KoniTypes';
import { dotSamaAPIMap } from '@polkadot/extension-koni-base/background/handlers';

export class KoniSubcription {
  private subscriptionMap: Record<string, Subject<any>> = {};

  getSubscriptionMap () {
    return this.subscriptionMap;
  }

  getSubscription (name: string): Subject<any> {
    return this.subscriptionMap[name];
  }

  init () {
    this.subscriptionMap.balance = this.initBalanceSubscription();
  }

  initBalanceSubscription () {
    const balanceSubject = new Subject<BalanceItem>();
    const address = '5FEdUhBmtK1rYifarmUXYzZhi6fmLbC6SZ7jcNvGuC2gaa2r';

    const subList = [];

    Object.entries(dotSamaAPIMap).forEach(([networkName, apiProps]) => {
      apiProps.isReady
        .then(async (networkAPI) => {
          const sub = await networkAPI.api.query.system.account(address, ({ data }: BalanceRPCResponse) => {
            const balanceItem = {
              ready: true,
              free: data.free?.toString() || '0',
              reserved: data.reserved?.toString() || '0',
              miscFrozen: data.feeFrozen?.toString() || '0',
              feeFrozen: data.miscFrozen?.toString() || '0'
            } as BalanceItem;

            console.log(balanceItem);
          });

          subList.push(sub);
        }).catch((err) => console.error(err));
    });

    return balanceSubject;
  }
}
