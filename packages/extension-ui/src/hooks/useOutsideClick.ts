// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { RefObject } from 'react';

import { useCallback, useEffect } from 'react';

export default function useOutsideClick (refs: RefObject<HTMLDivElement|null>[], callback: () => void): void {
  const handleClick = useCallback((e: MouseEvent): void => {
    refs.every(({ current }) =>
      current &&
      !current.contains(e.target as HTMLInputElement)
    ) && callback();
  }, [callback, refs]);

  useEffect(() => {
    document.addEventListener('click', handleClick);

    return (): void => {
      document.removeEventListener('click', handleClick);
    };
  });
}
