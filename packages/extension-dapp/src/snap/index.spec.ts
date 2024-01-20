// Copyright 2019-2023 @polkadot/extension authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { getMetaDataList, injectedMetamaskSnap } from ".";

declare global {
  interface Window {
    ethereum: any;
  }
}

const substrateAddress = '5D1tRvT9afsfwzv8n1GBGG5mMMEUagrdf29rrcxnBDVWtz4f';

describe('Connection to Snap', () => {
  it('Get addresses from Snap', async () => {
    global.window = {
      ethereum: {
        isMetaMask: true,
        request: jest.fn(() => substrateAddress)
      }
    } as Window & typeof globalThis;

    if (!injectedMetamaskSnap.connect) {
      return;
    }

    const connectToSnap = await injectedMetamaskSnap.connect('Random Dapp');
    const accountsArray = await connectToSnap?.accounts.get()

    expect(accountsArray).toEqual([{
      address: substrateAddress,
      name: 'Metamask account 1 🍻',
      type: 'sr25519'
    }]);
  });

  it('getMetaDataList error', async () => {
    global.window.ethereum = {
      isMetaMask: true,
      request: jest.fn(() => { throw new Error('error') })
    };

    const metaDataList = await getMetaDataList();

    expect(metaDataList).toBeFalsy();
  });

  it('getMetaDataList empty', async () => {
    const expectedResult = [{ "genesisHash": "0x", "specVersion": 0 }];

    global.window.ethereum = {
      isMetaMask: true,
      request: jest.fn(() => expectedResult)
    };

    const metaDataList = await getMetaDataList();

    expect(metaDataList).toEqual(expectedResult);
  });
});
