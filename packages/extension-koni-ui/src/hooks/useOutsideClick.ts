// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { RefObject, useCallback, useEffect } from 'react';

export default function useOutsideClick (ref: RefObject<HTMLDivElement>, callback: () => void): void {
  const handleClick = useCallback((e: MouseEvent): void => {
    if (ref.current && !ref.current.contains(e.target as HTMLInputElement)) {
      callback();
    }
  }, [callback, ref]);

  useEffect(() => {
    document.addEventListener('mousedown', handleClick);

    return (): void => {
      document.removeEventListener('mousedown', handleClick);
    };
  });
}
