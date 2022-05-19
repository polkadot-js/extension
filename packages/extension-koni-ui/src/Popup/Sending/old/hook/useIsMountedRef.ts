// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { createNamedHook } from '@subwallet/extension-koni-ui/hooks/createNamedHook';
import { useEffect, useRef } from 'react';

export type MountedRef = React.MutableRefObject<boolean>;

function useIsMountedRefImpl (): MountedRef {
  const isMounted = useRef(false);

  useEffect((): () => void => {
    isMounted.current = true;

    return (): void => {
      isMounted.current = false;
    };
  }, []);

  return isMounted;
}

export const useIsMountedRef = createNamedHook('useIsMountedRef', useIsMountedRefImpl);
