// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { getWeb3Api } from '@subwallet/extension-koni-base/api/web3/web3';

export async function getEVMBalance (networkKey: string, addresses: string[]): Promise<string[]> {
  const web3Api = getWeb3Api(networkKey);

  return await Promise.all(addresses.map(async (address) => {
    return await web3Api.eth.getBalance(address);
  }));
}
