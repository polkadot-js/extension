// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, ExternalRequestPromise, NetworkJson, ResponseCreateCompoundStakeExternal, ResponseCreateCompoundStakeLedger, ResponseCreateCompoundStakeQr } from '@subwallet/extension-base/background/KoniTypes';
import LedgerSigner from '@subwallet/extension-base/signers/substrates/LedgerSigner';
import QrSigner from '@subwallet/extension-base/signers/substrates/QrSigner';
import { LedgerState, QrState } from '@subwallet/extension-base/signers/types';
import { getTuringCompoundExtrinsic } from '@subwallet/extension-koni-base/api/bonding/paraChain';
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

interface CreateCompoundExternalProps extends ExternalProps {
  address: string;
  collatorAddress: string;
  accountMinimum: string;
  bondedAmount: string;
  callback: (data: ResponseCreateCompoundStakeExternal) => void;
}

interface CreateCreateCompoundExtrinsicProps {
  apiProp: ApiProps;
  address: string;
  collatorAddress: string;
  network: NetworkJson;
  bondedAmount: string;
  accountMinimum: string;
}

// Shared function

const createCreateCompoundExtrinsic = async ({ accountMinimum,
  address,
  apiProp,
  bondedAmount,
  collatorAddress,
  network }: CreateCreateCompoundExtrinsicProps): Promise<SubmittableExtrinsic<'promise'>> => {
  const parsedAccountMinimum = parseFloat(accountMinimum) * 10 ** (network.decimals as number);

  return await getTuringCompoundExtrinsic(apiProp, address, collatorAddress, parsedAccountMinimum.toString(), bondedAmount);
};

// Qr

interface CreateCompoundQrProps extends CreateCompoundExternalProps {
  callback: (data: ResponseCreateCompoundStakeQr) => void;
}

export const createCreateCompoundQr = async ({ accountMinimum,
  address,
  apiProp,
  bondedAmount,
  callback,
  collatorAddress,
  id,
  network,
  setState,
  updateState }: CreateCompoundQrProps): Promise<void> => {
  const txState: ResponseCreateCompoundStakeQr = {};

  const extrinsic = await createCreateCompoundExtrinsic({
    apiProp,
    network,
    address,
    accountMinimum,
    bondedAmount,
    collatorAddress
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
      console.error('error createCompound', e);
      txState.txError = true;
      txState.status = false;
      callback(txState);
    }
  } else {
    callback(txState);
  }
};

// Ledger

interface CreateCompoundLedgerProps extends CreateCompoundExternalProps {
  callback: (data: ResponseCreateCompoundStakeLedger) => void;
}

export const createCreateCompoundLedger = async ({ accountMinimum,
  address,
  apiProp,
  bondedAmount,
  callback,
  collatorAddress,
  id,
  network,
  setState,
  updateState }: CreateCompoundLedgerProps): Promise<void> => {
  const txState: ResponseCreateCompoundStakeLedger = {};

  const extrinsic = await createCreateCompoundExtrinsic({
    apiProp,
    network,
    collatorAddress,
    address,
    bondedAmount,
    accountMinimum
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
      console.error('error createCompound', e);
      txState.txError = true;
      txState.status = false;
      callback(txState);
    }
  } else {
    callback(txState);
  }
};
