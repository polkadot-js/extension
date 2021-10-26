// [object Object]
// SPDX-License-Identifier: Apache-2.0

// Import the API, Keyring and some utility functions
// eslint-disable-next-line header/header
import type { Chain } from '@polkadot/extension-chains/types';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { AddressOrPair } from '@polkadot/api/types';

import getNetworkInfo from './getNetwork';

export default async function getFee (
  _senderKeyring: AddressOrPair,
  _receiverAddress: string,
  _amount: bigint, _chain: Chain | null | undefined): Promise<string> {
  const { decimals, url } = getNetworkInfo(_chain);

  const transferValue = _amount * BigInt(10 ** decimals);

  const wsProvider = new WsProvider(url);

  const api = await ApiPromise.create({ provider: wsProvider });

  const info = await api.tx.balances
    .transfer(_receiverAddress, transferValue)
    .paymentInfo(_senderKeyring);

//   console.log(`
//   class=${info.class.toString()},
//   weight=${info.weight.toString()},
//   partialFee=${info.partialFee.toHuman()}
// `);

  return info.partialFee.toString();
}
