// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BasicTxErrorCode, BasicTxResponse, ExternalRequestPromise, ExternalRequestPromiseStatus, HandleBasicTx } from '@subwallet/extension-base/background/KoniTypes';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';

import { SubmittableExtrinsic } from '@polkadot/api/types';
import { EventRecord } from '@polkadot/types/interfaces';

interface SendExtrinsicProps {
  extrinsic: SubmittableExtrinsic<'promise'>;
  callback: HandleBasicTx;
  txState: BasicTxResponse;
  updateState?: (promise: Partial<ExternalRequestPromise>) => void;
  updateResponseTxResult?: (response: BasicTxResponse, records: EventRecord[]) => void;
  substrateApi: _SubstrateApi;
}

export const sendExtrinsic = async ({ callback, extrinsic, substrateApi, txState, updateResponseTxResult, updateState }: SendExtrinsicProps) => {
  const unsubscribe = await extrinsic.send((result) => {
    if (!result || !result.status) {
      return;
    }

    if (result.status.isInBlock || result.status.isFinalized) {
      txState.isFinalized = result.status.isFinalized;

      if (result.status.isInBlock) {
        updateResponseTxResult && updateResponseTxResult(txState, result.events);
      }

      result.events
        .filter(({ event: { section } }) => section === 'system')
        .forEach(({ event: { method, data: [error] } }): void => {
          txState.extrinsicHash = extrinsic.hash.toHex();

          if (method === 'ExtrinsicFailed') {
            txState.status = false;

            txState.txError = true;

            // @ts-ignore
            if (error.isModule) {
              const api = substrateApi.api;

              try {
                // @ts-ignore
                // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
                const decoded = api.registry.findMetaError(error.asModule);
                const { docs, method, section } = decoded;

                const errorMessage = docs.join(' ');

                console.log(`${section}.${method}: ${errorMessage}`);
                txState.errors?.push({
                  code: BasicTxErrorCode.UNKNOWN_ERROR,
                  message: errorMessage
                });
              } catch (e) {
                const errorMessage = error.toString();

                txState.errors?.push({
                  code: BasicTxErrorCode.UNKNOWN_ERROR,
                  message: errorMessage
                });
              }
            } else {
              // Other, CannotLookup, BadOrigin, no extra info
              const errorMessage = error.toString();

              console.log(errorMessage);
              txState.errors?.push({
                code: BasicTxErrorCode.UNKNOWN_ERROR,
                message: errorMessage
              });
            }

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
