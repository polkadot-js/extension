// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from 'react';

export default function useIsPopup (): boolean {
  return useMemo(() => {
    return window.innerWidth <= 560;
  }, []);
}
