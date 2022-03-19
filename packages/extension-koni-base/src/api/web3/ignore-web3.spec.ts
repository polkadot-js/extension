// Copyright 2019-2022 @polkadot/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ERC20Contract, web3Map } from '@polkadot/extension-koni-base/api/web3/web3';

describe('test web3 APIs', () => {
  const exampleAddress = '0x4deFD3781271F92fA7dc47c97DB576bb3c916e6C';

  test('web3 get balance', async () => {
    const rs = await web3Map.moonbase.eth.getBalance(exampleAddress);

    console.log(rs);
  });

  test('web3 get assets', async () => {
    const assetAddress = '0xFFFFFFFF1FAE104DC4C134306BCA8E2E1990ACFD'; // xcBNCAddress
    const accountAddress = '0x4deFD3781271F92fA7dc47c97DB576bb3c916e6C';
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
    const tokenContract = new web3Map.moonbase.eth.Contract(ERC20Contract.abi, assetAddress, {});

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment,@typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
    const rs = await tokenContract.methods.balanceOf(accountAddress).call();

    console.log(rs);
  });
});
