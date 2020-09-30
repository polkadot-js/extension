// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useMemo } from 'react';

export default function useIsPopup (): {isPopup: boolean} {
  return useMemo(() => {
    return { isPopup: window.innerWidth <= 560 };
  }, []);
}
