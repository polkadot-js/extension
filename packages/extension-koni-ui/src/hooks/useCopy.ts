// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import useNotification from '@subwallet/extension-koni-ui/hooks/useNotification';
import { copyToClipboard } from '@subwallet/extension-koni-ui/util/dom';
import { useCallback } from 'react';

const useCopy = (value: string): () => void => {
  const notify = useNotification();

  return useCallback(() => {
    copyToClipboard(value);
    notify({
      message: 'Copied'
    });
  }, [value, notify]);
};

export default useCopy;