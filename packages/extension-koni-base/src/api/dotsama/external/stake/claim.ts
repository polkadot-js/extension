// Copyright 2019-2022 @subwallet/extension-koni authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, ExternalRequestPromise, NetworkJson, ResponseClaimRewardExternal, ResponseClaimRewardLedger, ResponseClaimRewardQr } from '@subwallet/extension-base/background/KoniTypes';
import LedgerSigner from '@subwallet/extension-base/signers/substrates/LedgerSigner';
import QrSigner from '@subwallet/extension-base/signers/substrates/QrSigner';
import { LedgerState, QrState } from '@subwallet/extension-base/signers/types';
import { getClaimRewardExtrinsic } from '@subwallet/extension-koni-base/api/bonding';
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

interface ClaimRewardExternalProps extends ExternalProps {
  address: string;
  validatorAddress?: string;
  callback: (data: ResponseClaimRewardExternal) => void;
}

interface CreateClaimExtrinsicProps {
  apiProp: ApiProps;
  address: string;
  validatorAddress?: string;
  network: NetworkJson;
}

// Shared function

const createClaimExtrinsic = async ({ address,
  apiProp,
  network,
  validatorAddress }: CreateClaimExtrinsicProps): Promise<SubmittableExtrinsic<'promise'>> => {
  return await getClaimRewardExtrinsic(apiProp, network.key, address, validatorAddress);
};

// Qr

interface ClaimRewardQrProps extends ClaimRewardExternalProps {
  callback: (data: ResponseClaimRewardQr) => void;
}

export const createClaimRewardQr = async ({ address,
  apiProp,
  callback,
  id,
  network,
  setState,
  updateState,
  validatorAddress }: ClaimRewardQrProps): Promise<void> => {
  const txState: ResponseClaimRewardQr = {};

  const extrinsic = await createClaimExtrinsic({
    apiProp,
    network,
    validatorAddress,
    address
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
      console.error('error claimReward', e);
      txState.txError = true;
      txState.status = false;
      callback(txState);
    }
  } else {
    callback(txState);
  }
};

// Ledger

interface ClaimRewardLedgerProps extends ClaimRewardExternalProps {
  callback: (data: ResponseClaimRewardLedger) => void;
}

export const createClaimRewardLedger = async ({ address,
  apiProp,
  callback,
  id,
  network,
  setState,
  updateState,
  validatorAddress }: ClaimRewardLedgerProps): Promise<void> => {
  const txState: ResponseClaimRewardLedger = {};

  const extrinsic = await createClaimExtrinsic({
    apiProp,
    network,
    validatorAddress,
    address
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
      console.error('error claimReward', e);
      txState.txError = true;
      txState.status = false;
      callback(txState);
    }
  } else {
    callback(txState);
  }
};
