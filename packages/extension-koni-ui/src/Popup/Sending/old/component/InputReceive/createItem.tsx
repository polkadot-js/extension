// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Option } from './types';

import React from 'react';

import KeyPair from './KeyPair';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function createItem (option: Option, isUppercase = true): Option {
  return {
    ...option,
    text: (
      <KeyPair
        address={option.key || ''}
        icon={option.icon}
        name={option.name || ''}
      />
    )
  };
}
