// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { LedgerState } from '@subwallet/extension-base/signers/types';
import { ExternalRequestContext } from '@subwallet/extension-koni-ui/contexts/ExternalRequestContext';
import { useLedger } from '@subwallet/extension-koni-ui/hooks/useLedger';
import { resolveExternalRequest } from '@subwallet/extension-koni-ui/messaging';
import { useCallback, useContext } from 'react';

import { KeyringPair$Meta } from '@polkadot/keyring/types';
import { hexToU8a } from '@polkadot/util';

interface Props {
  onError: (id: string, error: string) => void;
  genesisHash: string;
  accountMeta: KeyringPair$Meta;
}

interface Result {
  signLedger: (ledgerState: LedgerState) => void
}

export const useSignLedger = (props: Props): Result => {
  const { accountMeta, genesisHash, onError } = props;

  const { createResolveExternalRequestData } = useContext(ExternalRequestContext);

  const { error: ledgerError, ledger } = useLedger(genesisHash, accountMeta.accountIndex as number, accountMeta.addressOffset as number);

  const handlerSignLedger = useCallback((ledgerState: LedgerState) => {
    if (ledger) {
      ledger
        .sign(hexToU8a(ledgerState.ledgerPayload), accountMeta.accountIndex as number, accountMeta.accountOffset as number)
        .then(({ signature }) => {
          const resolveData = createResolveExternalRequestData({ signature });

          // eslint-disable-next-line no-void
          void resolveExternalRequest({ id: ledgerState.ledgerId, data: resolveData });
        })
        .catch((e) => {
          onError(ledgerState.ledgerId, (e as Error).message);
        });
    } else {
      let error;

      if (ledgerError) {
        error = ledgerError;
      } else {
        error = 'Cannot find ledger';
      }

      onError(ledgerState.ledgerId, error);
    }
  }, [accountMeta, createResolveExternalRequestData, ledger, ledgerError, onError]);

  return {
    signLedger: handlerSignLedger
  };
};
