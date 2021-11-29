// [object Object]
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import { ApiPromise, WsProvider } from '@polkadot/api';

import getNetworkInfo from '../getNetwork';

async function getFee (_senderKeyring, _receiverAddress, _amount, _chain) {
  const { decimals, url } = getNetworkInfo(_chain);

  const transferValue = _amount * BigInt(10 ** decimals);

  const wsProvider = new WsProvider(url);

  const api = await ApiPromise.create({ provider: wsProvider });

  const info = await api.tx.balances
    .transfer(_receiverAddress, transferValue)
    .paymentInfo(_senderKeyring);

  console.log(`
  class=${info.class.toString()},
  weight=${info.weight.toString()},
  partialFee=${info.partialFee},
  partialFeeInHuman=${info.partialFee.toHuman()}
`);

  return info.partialFee.toString();
}

onmessage = (e) => {
  const { amount, chain, receiverAddress, senderKeyring } = e.data;

  // eslint-disable-next-line no-void
  void getFee(senderKeyring, receiverAddress, amount, chain).then((fee) => {
    postMessage(fee);
  });
};
