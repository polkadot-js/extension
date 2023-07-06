// Copyright 2019-2022 @subwallet/extension-base
// SPDX-License-Identifier: Apache-2.0

import { addLazy } from '@subwallet/extension-base/utils/lazy';

// Increase timeout to 20s
jest.setTimeout(20000);

describe('Test lazy', () => {
  test('Add lazy', async () => {
    const firedKeys = [] as number[];

    for (let i = 0; i < 100; i++) {
      setTimeout(() => {
        addLazy('test-lazy', () => {
          console.log('fired at i =', i);
          firedKeys.push(i);
        }, 1000, 1999);
      }, i * 100);
    }

    await new Promise((resolve) => {
      setTimeout(resolve, 12000);
    });

    expect(firedKeys.length).toBe(6);
  });
});
