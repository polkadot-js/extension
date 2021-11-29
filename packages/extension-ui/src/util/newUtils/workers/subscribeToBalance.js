// [object Object]
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import { ApiPromise, WsProvider } from '@polkadot/api';

import getNetworkInfo from '../getNetwork.ts';
import {handleAccountBalance} from '../pjpeUtils.ts';

async function subscribeToBalance (_address, _chain, _formattedAddress) {
  const { coin, decimals, url } = getNetworkInfo(_chain);
  const wsProvider = new WsProvider(url);
  const api = await ApiPromise.create({ provider: wsProvider });

  await api.query.system.account(_formattedAddress, ({ data: balance }) => {
    if (balance) {
      const result = {
        coin: coin,
        decimals: decimals,
        ...handleAccountBalance(balance)
      };

      const changes = { 
        address: _address,
        balanceInfo: result,
        subscribedChain: _chain
      };

      postMessage(changes);
    }
  });
}

onmessage = (e) => {
  const { address, chain, formattedAddress } = e.data;

  // console.log(`subscribing to balance change of formattedAddress: ${formattedAddress} on chain ${chain?.name}`);
  // eslint-disable-next-line no-void
  void subscribeToBalance(address, chain, formattedAddress);
};
