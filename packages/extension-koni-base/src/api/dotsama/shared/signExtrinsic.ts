// Copyright 2019-2022 @subwallet/extension-koni-base authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ApiProps, ExternalRequestPromise, HandleBasicTx } from '@subwallet/extension-base/background/KoniTypes';
import KeyringSigner from '@subwallet/extension-base/signers/substrates/KeyringSigner';
import LedgerSigner from '@subwallet/extension-base/signers/substrates/LedgerSigner';
import QrSigner from '@subwallet/extension-base/signers/substrates/QrSigner';
import { LedgerState, QrState, SignerExternal, SignerType } from '@subwallet/extension-base/signers/types';
import { unlockAccount } from '@subwallet/extension-koni-base/utils/keyring';

import { Signer, SubmittableExtrinsic } from '@polkadot/api/types';
import { keyring } from '@polkadot/ui-keyring';
import { assert } from '@polkadot/util';

interface AbstractSignExtrinsicProps {
  address: string;
  apiProps: ApiProps;
  callback: HandleBasicTx;
  extrinsic: SubmittableExtrinsic<'promise'>;
  id?: string;
  password?: string;
  setState?: (promise: ExternalRequestPromise) => void;
  type: SignerType;
  nonce?: number;
}

interface PasswordSignExtrinsicProps extends AbstractSignExtrinsicProps {
  type: SignerType.PASSWORD;
}

interface ExternalSignExtrinsicProps extends AbstractSignExtrinsicProps {
  id: string;
  setState: (promise: ExternalRequestPromise) => void;
  type: SignerExternal;
}

type SignExtrinsicProps = PasswordSignExtrinsicProps | ExternalSignExtrinsicProps;

export const signExtrinsic = async ({ address, apiProps, callback, extrinsic, id, nonce, password, setState, type }: SignExtrinsicProps): Promise<string | null> => {
  if (type === SignerType.PASSWORD) {
    const passwordError: string | null = unlockAccount(address, password);

    if (passwordError) {
      return passwordError;
    }
  }

  let signer: Signer | undefined;

  const registry = apiProps.api.registry;

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
      registry: registry,
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

    signer = new LedgerSigner(registry, ledgerCallback, id, setState);
  } else if (type === SignerType.PASSWORD) {
    const pair = keyring.getPair(address);

    assert(pair, 'Unable to find pair');
    signer = new KeyringSigner({ registry: registry, keyPair: pair });
  }

  await extrinsic.signAsync(address, { signer: signer, nonce });

  return null;
};
