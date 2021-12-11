// [object Object]
// SPDX-License-Identifier: Apache-2.0

// Import the API, Keyring and some utility functions
// eslint-disable-next-line header/header
import { ApiPromise, WsProvider } from '@polkadot/api';

import getNetworkInfo from './getNetwork';

export default async function getGenesishash(_chainName: string): Promise<string> {
  const { url } = getNetworkInfo(null,_chainName);

  const wsProvider = new WsProvider(url);

  const api = await ApiPromise.create({ provider: wsProvider });

  return api.genesisHash.toHex();
}
