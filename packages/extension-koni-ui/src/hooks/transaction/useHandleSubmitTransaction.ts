// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SWTransactionResponse } from '@subwallet/extension-base/services/transaction-service/types';
import { useCallback, useMemo } from 'react';

import { useNotification, useTranslation } from '../common';

const useHandleSubmitTransaction = (onDone: (extrinsicHash: string) => void, setIgnoreWarnings?: (value: boolean) => void) => {
  const notify = useNotification();
  const { t } = useTranslation();

  const onSuccess = useCallback((rs: SWTransactionResponse) => {
    const { errors, id, warnings } = rs;

    if (errors.length || warnings.length) {
      if (![t('Rejected by user'), 'Rejected by user'].includes(errors[0]?.message)) {
        notify({
          message: errors[0]?.message || warnings[0]?.message,
          type: errors.length ? 'error' : 'warning'
        });
      }

      if (!errors.length) {
        warnings[0] && setIgnoreWarnings?.(true);
      }
    } else if (id) {
      onDone(id);
    }
  }, [t, notify, onDone, setIgnoreWarnings]);

  const onError = useCallback((error: Error) => {
    notify({
      message: t(error.message),
      type: 'error'
    });
  }, [t, notify]);

  return useMemo(() => ({
    onSuccess,
    onError
  }), [onError, onSuccess]);
};

export default useHandleSubmitTransaction;
