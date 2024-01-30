// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useTranslation } from '@subwallet/extension-web-ui/hooks';
import useNotification from '@subwallet/extension-web-ui/hooks/common/useNotification';
import { copyToClipboard } from '@subwallet/extension-web-ui/utils/common/dom';
import { useCallback } from 'react';

const useCopy = (value: string): () => void => {
  const notify = useNotification();
  const { t } = useTranslation();

  return useCallback(() => {
    copyToClipboard(value);
    notify({
      message: t('Copied to clipboard')
    });
  }, [value, notify, t]);
};

export default useCopy;
