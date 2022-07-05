// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { Promise as _Promise } from 'bluebird';
import fetch from 'cross-fetch';

jest.setTimeout(50000);

describe('test nft', () => {
  test('test concurrency', async () => {
    const allUrl = [
      'https://rmrk.mypinata.cloud/ipfs/bafkreigjuivdha3qtdfcfqufbdtaf5pzc7itoqqs472g65ixvejvbudmeu',
      'https://rmrk.mypinata.cloud/ipfs/bafkreiaeu6v4aplja3jwlhtuffm2tuxiubpjmpldnjcjeud7lkyry23x7e'
    ];

    await _Promise.map(allUrl, async (url) => {
      await fetch(url, {
        method: 'GET'
      })
        .then((res) => {
          console.log(res.json());
        });
    }, { concurrency: 1 });
  });
});
