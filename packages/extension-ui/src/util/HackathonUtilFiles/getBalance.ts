// [object Object]
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import type { Chain } from '@polkadot/extension-chains/types';
import type { SettingsStruct } from '@polkadot/ui-settings/types';

import { ApiPromise, WsProvider } from '@polkadot/api';

import getNetworkInfo from './getNetwork';
import { getFormattedAddress, handleAccountBalance } from './hackathonUtils';
import { BalanceType} from './pjpeTypes';

export async function getBalance(_address: string | null | undefined, _chain: Chain | null | undefined, settings: SettingsStruct):
Promise<BalanceType | null> {
  return new Promise((resolve) => {
    try {
      const formattedAddress = getFormattedAddress(_address, _chain, settings.prefix);

      // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
      const { coin, decimals, url } = getNetworkInfo(_chain);

      console.log(`getting balance of ${formattedAddress} ${coin}`);

      // TODO: this is just for test  remove after test
      // if (coin === 'DOT') {
      //   formattedAddress = '12yc5VAj5X6rwAWB688EtAzNTncx8Ce4nP79jW1rdJkaeNEJ';
      // }

      const wsProvider = new WsProvider(url);

      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      ApiPromise.create({ provider: wsProvider }).then((api) => {
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        api.query.system.account(formattedAddress).then(({ data: balance }) => {
          const result = {
            coin: coin,
            decimals: decimals,
            ...handleAccountBalance(balance)
          };

          console.log(result);
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          // wsProvider.disconnect();
          resolve(result);
        });
      });
    } catch (error) {
      console.log('something went wrong while getting balance from ');
      resolve(null);
    }
  });
}
