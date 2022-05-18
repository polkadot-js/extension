// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeyringSectionOption } from '@polkadot/ui-keyring/options/types';
import type { Option } from './types';

import React from 'react';

import KeyPair from './KeyPair';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function createItem (option: KeyringSectionOption, isUppercase = true): Option {
  return {
    ...option,
    text: (
      <KeyPair
        address={option.key || ''}
        name={option.name || ''}
      />
    )
  };
}
