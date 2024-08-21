// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AmountData } from '@subwallet/extension-base/background/KoniTypes';
import { SWTransactionResponse } from '@subwallet/extension-base/services/transaction-service/types';
import { useTransactionContext } from '@subwallet/extension-web-ui/hooks';
import { CommonActionType, CommonProcessAction } from '@subwallet/extension-web-ui/reducer';
import { ClaimRewardParams } from '@subwallet/extension-web-ui/types';
import { useCallback, useMemo } from 'react';

import { useNotification, useTranslation } from '../common';

const useHandleSubmitMultiTransaction = (dispatchProcessState: (value: CommonProcessAction) => void, setIgnoreWarnings?: (value: boolean) => void, handleDataForInsufficientAlert?: (estimateFee: AmountData) => Record<string, string>) => {
  const notify = useNotification();
  const { t } = useTranslation();

  const { onDone } = useTransactionContext<ClaimRewardParams>();

  const onError = useCallback(
    (error: Error) => {
      notify({
        message: error.message,
        type: 'error',
        duration: 8
      });

      dispatchProcessState({
        type: CommonActionType.STEP_ERROR_ROLLBACK,
        payload: error
      });
    },
    [dispatchProcessState, notify]
  );

  const onSuccess = useCallback(
    (lastStep: boolean, needRollback: boolean): ((rs: SWTransactionResponse) => boolean) => {
      return (rs: SWTransactionResponse): boolean => {
        const { errors: _errors, id, warnings } = rs;

        if (_errors.length || warnings.length) {
          if (_errors[0]?.message !== 'Rejected by user') {
            if (
              _errors[0]?.message.startsWith('UnknownError Connection to Indexed DataBase server lost') ||
              _errors[0]?.message.startsWith('Provided address is invalid, the capitalization checksum test failed') ||
              _errors[0]?.message.startsWith('connection not open on send()')
            ) {
              notify({
                message: t('Your selected network has lost connection. Update it by re-enabling it or changing network provider'),
                type: 'error',
                duration: 8
              });

              return false;
            } else {
              notify({
                message: _errors[0]?.message || warnings[0]?.message,
                type: _errors.length ? 'error' : 'warning',
                duration: 8
              });
            }

            if (!_errors.length) {
              warnings[0] && setIgnoreWarnings?.(true);
            } else {
              // hideAll();
              onError(_errors[0]);
            }

            return false;
          } else {
            dispatchProcessState({
              type: needRollback ? CommonActionType.STEP_ERROR_ROLLBACK : CommonActionType.STEP_ERROR,
              payload: _errors[0]
            });

            return false;
          }
        } else if (id) {
          dispatchProcessState({
            type: CommonActionType.STEP_COMPLETE,
            payload: rs
          });

          if (lastStep) {
            onDone(id);

            return false;
          }

          return true;
        }

        return false;
      };
    },
    [dispatchProcessState, notify, onDone, onError, setIgnoreWarnings, t]
  );

  return useMemo(() => ({
    onSuccess,
    onError
  }), [onError, onSuccess]);
};

export default useHandleSubmitMultiTransaction;
