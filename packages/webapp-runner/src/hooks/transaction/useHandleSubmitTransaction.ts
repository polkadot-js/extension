// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { SWTransactionResponse } from '@subwallet/extension-base/services/transaction-service/types';
import { useCallback, useMemo } from 'react';

import { useNotification } from '../common';

const useHandleSubmitTransaction = (onDone: (extrinsicHash: string) => void, setIgnoreWarnings?: (value: boolean) => void) => {
  const notify = useNotification();

  const onSuccess = useCallback((rs: SWTransactionResponse) => {
    const { errors, extrinsicHash, warnings } = rs;

    if (errors.length || warnings.length) {
      if (errors[0]?.message !== 'User reject request') {
        notify({
          message: errors[0]?.message || warnings[0]?.message,
          type: errors.length ? 'error' : 'warning'
        });
      }

      warnings[0] && setIgnoreWarnings?.(true);
    } else if (extrinsicHash) {
      onDone(extrinsicHash);
    }
  }, [notify, onDone, setIgnoreWarnings]);

  const onError = useCallback((error: Error) => {
    notify({
      message: error.message,
      type: 'error'
    });
  }, [notify]);

  return useMemo(() => ({
    onSuccess,
    onError
  }), [onError, onSuccess]);
};

export default useHandleSubmitTransaction;
