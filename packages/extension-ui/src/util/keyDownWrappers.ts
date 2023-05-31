// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { KeyboardEvent } from 'react';

const triggerOnCodes = <T>(
  callback: ((event: KeyboardEvent<T>) => void) | undefined,
  codes: string[]
): ((event: KeyboardEvent<T>) => void) => {
  return (event: KeyboardEvent<T>) => {
    if (codes.includes(event.code)) {
      callback?.(event);
    }
  };
};

export const triggerOnSpace = <T>(callback: ((event: KeyboardEvent<T>) => void) | undefined) =>
  triggerOnCodes(callback, ['Space']);
export const triggerOnEnterSpace = <T>(callback: ((event: KeyboardEvent<T>) => void) | undefined) =>
  triggerOnCodes(callback, ['Space', 'Enter']);
