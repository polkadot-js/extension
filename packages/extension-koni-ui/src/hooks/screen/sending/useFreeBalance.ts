// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useEffect, useState } from 'react';

import { cancelSubscription, subscribeFreeBalance } from '@polkadot/extension-koni-ui/messaging';

export default function useFreeBalance (networkKey: string, address: string | undefined | null, token: string | undefined): string {
  const [balance, setBalance] = useState<string>('0');

  useEffect(() => {
    let isSync = true;

    let id: string;

    if (address) {
      (async () => {
        id = await subscribeFreeBalance({ networkKey, address, token }, (free) => {
          if (isSync) {
            setBalance(free);
          }
        });

        if (!isSync) {
          cancelSubscription(id).catch((e) => console.log('Error when cancel subscription', e));
        }
      })().catch(console.log);
    }

    return () => {
      isSync = false;

      if (id) {
        cancelSubscription(id).catch((e) => console.log('Error when cancel subscription', e));
      }
    };
  }, [networkKey, address, token]);

  return balance;
}
