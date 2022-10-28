// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, BasicTxErrorCode, BasicTxResponse, ExternalRequestPromise, ExternalRequestPromiseStatus, HandleBasicTx, PrepareExternalRequest } from '@subwallet/extension-base/background/KoniTypes';
import LedgerSigner from '@subwallet/extension-base/signers/substrates/LedgerSigner';
import QrSigner from '@subwallet/extension-base/signers/substrates/QrSigner';
import { LedgerState, QrState } from '@subwallet/extension-base/signers/types';

import { Signer, SubmittableExtrinsic } from '@polkadot/api/types';
import { AddressOrPair } from '@polkadot/api-base/types/submittable';
import { KeyringPair } from '@polkadot/keyring/types';

interface SendExtrinsicProps {
  extrinsic: SubmittableExtrinsic<'promise'>;
  callback: HandleBasicTx;
  txState: BasicTxResponse;
  updateState?: (promise: Partial<ExternalRequestPromise>) => void;
}

export const sendExtrinsic = async ({ callback, extrinsic, txState, updateState }: SendExtrinsicProps) => {
  const unsubscribe = await extrinsic.send((result) => {
    if (!result || !result.status) {
      return;
    }

    if (result.status.isInBlock || result.status.isFinalized) {
      result.events
        .filter(({ event: { section } }) => section === 'system')
        .forEach(({ event: { method } }): void => {
          txState.transactionHash = extrinsic.hash.toHex();
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

export enum SignerType {
  PASSWORD = 'PASSWORD',
  QR = 'QR',
  LEDGER = 'LEDGER',
}

export type SignerExternal = SignerType.LEDGER | SignerType.QR;

interface AbstractSignAndSendExtrinsicProps extends Partial<PrepareExternalRequest>{
  extrinsic: SubmittableExtrinsic<'promise'>;
  callback: HandleBasicTx;
  txState: BasicTxResponse;
  addressOrPair: AddressOrPair;
  type: SignerType;
  errorMessage: string;
  apiProp?: ApiProps;
}

interface PasswordSignAndSendExtrinsicProps extends AbstractSignAndSendExtrinsicProps {
  addressOrPair: KeyringPair;
  type: SignerType.PASSWORD;
}

interface ExternalSignAndSendExtrinsicProps extends AbstractSignAndSendExtrinsicProps {
  addressOrPair: string;
  apiProp: ApiProps;
  id: string;
  setState: (promise: ExternalRequestPromise) => void;
  updateState: (promise: Partial<ExternalRequestPromise>) => void;
}

interface QrSignAndSendExtrinsicProps extends ExternalSignAndSendExtrinsicProps{
  type: SignerType.QR;
}

interface LedgerSignAndSendExtrinsicProps extends ExternalSignAndSendExtrinsicProps{
  type: SignerType.LEDGER;
}

type SignAndSendExtrinsicProps = QrSignAndSendExtrinsicProps | LedgerSignAndSendExtrinsicProps | PasswordSignAndSendExtrinsicProps;

export const signAndSendExtrinsic = async ({ addressOrPair, apiProp, callback, errorMessage, extrinsic, id, setState, txState, type, updateState }: SignAndSendExtrinsicProps) => {
  if (extrinsic !== null) {
    let signer: Signer | undefined;

    if (type === SignerType.QR) {
      const qrCallBack = ({ qrState }: {qrState: QrState}) => {
        // eslint-disable-next-line node/no-callback-literal
        callback({
          qrState: qrState,
          externalState: {
            externalId: qrState.qrId
          }
        });
      };

      const qrResolver = () => {
        // eslint-disable-next-line node/no-callback-literal
        callback({
          isBusy: true
        });
      };

      signer = new QrSigner({
        registry: apiProp.registry,
        callback: qrCallBack,
        id,
        setState,
        resolver: qrResolver
      });
    } else if (type === SignerType.LEDGER) {
      const ledgerCallback = ({ ledgerState }: {ledgerState: LedgerState}) => {
        // eslint-disable-next-line node/no-callback-literal
        callback({
          ledgerState: ledgerState,
          externalState: {
            externalId: ledgerState.ledgerId
          }
        });
      };

      signer = new LedgerSigner(apiProp.registry, ledgerCallback, id, setState);
    }

    await extrinsic.signAsync(addressOrPair, { signer: signer });

    try {
      await sendExtrinsic({
        callback,
        extrinsic,
        txState,
        updateState
      });
    } catch (e) {
      console.error(errorMessage, e);

      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/no-unsafe-member-access
      if (e.toString().message.includes('Invalid Transaction: Inability to pay some fees , e.g. account balance too low')) {
        txState.errors = [{ code: BasicTxErrorCode.BALANCE_TO_LOW, message: (e as Error).message }];
      }

      txState.txError = true;
      txState.status = false;
      callback(txState);
    }
  } else {
    callback(txState);
  }
};
