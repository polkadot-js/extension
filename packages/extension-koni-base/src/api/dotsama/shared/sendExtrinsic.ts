// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BasicTxResponse, ExternalRequestPromise, ExternalRequestPromiseStatus, HandleBasicTx } from '@subwallet/extension-base/background/KoniTypes';

import { SubmittableExtrinsic } from '@polkadot/api/types';
import { EventRecord } from '@polkadot/types/interfaces';

interface SendExtrinsicProps {
  extrinsic: SubmittableExtrinsic<'promise'>;
  callback: HandleBasicTx;
  txState: BasicTxResponse;
  updateState?: (promise: Partial<ExternalRequestPromise>) => void;
  updateResponseTxResult?: (response: BasicTxResponse, records: EventRecord[]) => void;
}

export const sendExtrinsic = async ({ callback, extrinsic, txState, updateResponseTxResult, updateState }: SendExtrinsicProps) => {
  const unsubscribe = await extrinsic.send((result) => {
    if (!result || !result.status) {
      return;
    }

    if (result.status.isInBlock || result.status.isFinalized) {
      txState.isFinalized = result.status.isFinalized;
      updateResponseTxResult && updateResponseTxResult(txState, result.events);

      result.events
        .filter(({ event: { section } }) => section === 'system')
        .forEach(({ event: { method } }): void => {
          txState.extrinsicHash = extrinsic.hash.toHex();
          callback(txState);

          if (method === 'ExtrinsicFailed') {
            txState.status = false;
            callback(txState);
            updateState && updateState({ status: ExternalRequestPromiseStatus.FAILED });
          } else if (method === 'ExtrinsicSuccess') {
            txState.status = true;
            callback(txState);
            updateState && updateState({ status: ExternalRequestPromiseStatus.COMPLETED });
          }
        });
    } else if (result.isError) {
      txState.txError = true;
      txState.status = false;
      callback(txState);
    }

    if (result.isCompleted) {
      unsubscribe();
    }
  });
};
