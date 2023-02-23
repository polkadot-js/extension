// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { BasicTxErrorCode, BasicTxResponse, HandleBasicTx } from '@subwallet/extension-base/background/KoniTypes';
import { _SubstrateApi } from '@subwallet/extension-base/services/chain-service/types';
import { KoniTransactionStatus, PrepareInternalRequest, SWTransaction } from '@subwallet/extension-base/services/transaction-service/types';
import ExtensionSigner from '@subwallet/extension-base/signers/substrates/ExtensionSigner';
import { sendExtrinsic } from '@subwallet/extension-koni-base/api/dotsama/shared/sendExtrinsic';
import { noop } from 'rxjs';

import { SubmittableExtrinsic } from '@polkadot/api/types';
import { EventRecord } from '@polkadot/types/interfaces';

interface ConvertToTransactionProps extends PrepareInternalRequest{
  extrinsic: SubmittableExtrinsic<'promise'> | null;
  callback: HandleBasicTx;
  txState: BasicTxResponse;
  address: string;
  network: string;
  errorMessage: string;
  data: any;
  nonce?: number;
  substrateApi: _SubstrateApi;
  updateResponseTxResult?: (response: BasicTxResponse, records: EventRecord[]) => void;
}

export const convertToTransaction = ({ addTransaction,
  address,
  callback,
  convertToRequest,
  data,
  errorMessage,
  extrinsic,
  id,
  network,
  substrateApi,
  txState,
  updateResponseTxResult }: ConvertToTransactionProps) => {
  if (extrinsic !== null) {
    const transaction: SWTransaction = {
      id: id,
      createdAt: new Date(),
      status: KoniTransactionStatus.PENDING,
      updatedAt: new Date(),
      resolve: noop,
      reject: noop,
      address,
      network,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      data,

      extrinsicHash: ''
    } as unknown as SWTransaction;

    transaction.convertToRequest = convertToRequest;

    transaction.sendRequest = () => {
      // eslint-disable-next-line no-void
      void extrinsic.signAsync(address, { signer: new ExtensionSigner({ transaction }) }).then((data) => {
        transaction.doStart?.();
      });
    };

    addTransaction(transaction);

    const doStart = async () => {
      try {
        await sendExtrinsic({
          substrateApi: substrateApi,
          callback: callback,
          extrinsic: extrinsic,
          txState: txState,
          updateResponseTxResult: updateResponseTxResult
        });
      } catch (e) {
        console.error(errorMessage, e);

        // @ts-ignore
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
        if ((e as Error).message.includes('Invalid Transaction: Inability to pay some fees , e.g. account balance too low')) {
          txState.errors = [{ code: BasicTxErrorCode.BALANCE_TO_LOW, message: (e as Error).message }];
        } else {
          txState.errors = [{ code: BasicTxErrorCode.INVALID_PARAM, message: (e as Error).message }];
        }

        txState.txError = true;
        txState.status = false;
        callback(txState);
      }
    };

    transaction.doStart = () => {
      // eslint-disable-next-line no-void
      void doStart();
    };

    transaction.sendRequest();
  } else {
    txState.txError = true;
    txState.status = false;
    callback(txState);
  }
};
