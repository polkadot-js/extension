// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { InputRef } from '@subwallet/react-ui';
import { ForwardedRef, RefObject, useEffect, useRef } from 'react';

export function useForwardInputRef (ref: ForwardedRef<InputRef>): RefObject<InputRef> {
  const inputRef = useRef<InputRef>(null);

  useEffect(() => {
    if (typeof ref === 'function') {
      ref(inputRef.current);
    }
  }, [ref]);

  return inputRef;
}
