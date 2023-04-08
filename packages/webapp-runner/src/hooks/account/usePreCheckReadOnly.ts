// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { useCallback } from 'react';

import { useNotification, useTranslation } from '../common';
import useIsReadOnlyAccount from './useIsReadOnlyAccount';

type VoidFunction = () => void;

const usePreCheckReadOnly = (address?: string, message?: string): ((onClick: VoidFunction) => VoidFunction) => {
  const notify = useNotification();
  const { t } = useTranslation();

  const isReadOnlyAccount = useIsReadOnlyAccount(address);

  return useCallback((onClick: VoidFunction) => {
    return () => {
      if (isReadOnlyAccount) {
        notify({
          message: t(message ?? 'The account you are using is read-only, you cannot use this feature with it'),
          type: 'info',
          duration: 3
        });
      } else {
        onClick();
      }
    };
  }, [isReadOnlyAccount, message, notify, t]);
};

export default usePreCheckReadOnly;
