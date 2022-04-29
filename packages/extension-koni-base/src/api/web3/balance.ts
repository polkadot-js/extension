// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Web3 from 'web3';

export async function getEVMBalance (networkKey: string, addresses: string[], web3ApiMap: Record<string, Web3>): Promise<string[]> {
  const web3Api = web3ApiMap[networkKey];

  return await Promise.all(addresses.map(async (address) => {
    return await web3Api.eth.getBalance(address);
  }));
}
