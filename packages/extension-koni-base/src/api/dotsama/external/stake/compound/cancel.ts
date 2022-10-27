// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, ExternalRequestPromise, NetworkJson, ResponseCancelCompoundStakeExternal, ResponseCancelCompoundStakeLedger, ResponseCancelCompoundStakeQr } from '@subwallet/extension-base/background/KoniTypes';
import LedgerSigner from '@subwallet/extension-base/signers/substrates/LedgerSigner';
import QrSigner from '@subwallet/extension-base/signers/substrates/QrSigner';
import { LedgerState, QrState } from '@subwallet/extension-base/signers/types';
import { getTuringCancelCompoundingExtrinsic } from '@subwallet/extension-koni-base/api/bonding/paraChain';
import { sendExtrinsic } from '@subwallet/extension-koni-base/api/dotsama/external/shared';

import { SubmittableExtrinsic } from '@polkadot/api/types';

// Interface

interface ExternalProps {
  id: string;
  setState: (promise: ExternalRequestPromise) => void;
  updateState: (promise: Partial<ExternalRequestPromise>) => void;
  apiProp: ApiProps;
  network: NetworkJson;
}

interface CancelCompoundExternalProps extends ExternalProps {
  address: string;
  taskId: string;
  callback: (data: ResponseCancelCompoundStakeExternal) => void;
}

interface CreateCancelCompoundExtrinsicProps {
  apiProp: ApiProps;
  taskId: string;
}

// Shared function

const createCancelCompoundExtrinsic = async ({ apiProp, taskId }: CreateCancelCompoundExtrinsicProps): Promise<SubmittableExtrinsic<'promise'>> => {
  return await getTuringCancelCompoundingExtrinsic(apiProp, taskId);
};

// Qr

interface CancelCompoundQrProps extends CancelCompoundExternalProps {
  callback: (data: ResponseCancelCompoundStakeQr) => void;
}

export const createCancelCompoundQr = async ({ address,
  apiProp,
  callback,
  id,
  setState,
  taskId,
  updateState }: CancelCompoundQrProps): Promise<void> => {
  const txState: ResponseCancelCompoundStakeQr = {};

  const extrinsic = await createCancelCompoundExtrinsic({
    apiProp,
    taskId
  });

  if (extrinsic !== null) {
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

    await extrinsic.signAsync(
      address,
      {
        signer: new QrSigner({
          registry: apiProp.registry,
          callback: qrCallBack,
          id,
          setState,
          resolver: qrResolver
        })
      }
    );

    try {
      await sendExtrinsic({
        callback,
        extrinsic,
        txState,
        updateState
      });
    } catch (e) {
      console.error('error cancelCompound', e);
      txState.txError = true;
      txState.status = false;
      callback(txState);
    }
  } else {
    callback(txState);
  }
};

// Ledger

interface CancelCompoundLedgerProps extends CancelCompoundExternalProps {
  callback: (data: ResponseCancelCompoundStakeLedger) => void;
}

export const createCancelCompoundLedger = async ({ address,
  apiProp,
  callback,
  id,
  setState,
  taskId,
  updateState }: CancelCompoundLedgerProps): Promise<void> => {
  const txState: ResponseCancelCompoundStakeLedger = {};

  const extrinsic = await createCancelCompoundExtrinsic({
    apiProp,
    taskId
  });

  if (extrinsic !== null) {
    const ledgerCallback = ({ ledgerState }: {ledgerState: LedgerState}) => {
      // eslint-disable-next-line node/no-callback-literal
      callback({
        ledgerState: ledgerState,
        externalState: {
          externalId: ledgerState.ledgerId
        }
      });
    };

    await extrinsic.signAsync(address, { signer: new LedgerSigner(apiProp.registry, ledgerCallback, id, setState) });

    try {
      await sendExtrinsic({
        callback,
        extrinsic,
        txState,
        updateState
      });
    } catch (e) {
      console.error('error cancelCompound', e);
      txState.txError = true;
      txState.status = false;
      callback(txState);
    }
  } else {
    callback(txState);
  }
};
