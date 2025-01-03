// Copyright 2019-2025 @polkadot/extension-inject authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type * as _ from '@polkadot/dev-test/globals.d.ts';

import { cyrb53 } from './cyrb53.js';

const TESTS = [
  { input: 'a', seed: 0, test: '501c2ba782c97901' },
  { input: 'b', seed: 0, test: '459eda5bc254d2bf' },
  { input: 'revenge', seed: 0, test: 'fbce64cc3b748385' },
  { input: 'revenue', seed: 0, test: 'fb1d85148d13f93a' },
  { input: 'revenue', seed: 1, test: '76fee5e6598ccd5c' },
  { input: 'revenue', seed: 2, test: '1f672e2831253862' },
  { input: 'revenue', seed: 3, test: '2b10de31708e6ab7' }
] as const;

describe('cyrb53', (): void => {
  for (let i = 0, count = TESTS.length; i < count; i++) {
    const { input, seed, test } = TESTS[i];

    it(`correctly encodes ${input}`, (): void => {
      // expected values, known input & seed
      expect(cyrb53(input, seed)).toEqual(test);

      // seed set as Date.now(), should not match previous
      expect(cyrb53(input)).not.toEqual(test);
    });
  }
});
