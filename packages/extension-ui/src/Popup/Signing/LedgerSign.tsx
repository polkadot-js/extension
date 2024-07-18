// Copyright 2019-2024 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ExtrinsicPayload } from '@polkadot/types/interfaces';
import type { HexString } from '@polkadot/util/types';

import { faSync } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useEffect, useState } from 'react';

import { Button, Warning } from '../../components/index.js';
import { useLedger, useTranslation } from '../../hooks/index.js';
import { styled } from '../../styled.js';

interface Props {
  accountIndex?: number;
  addressOffset?: number;
  className?: string;
  error: string | null;
  genesisHash?: string;
  onSignature?: ({ signature }: { signature: HexString }) => void;
  payload?: ExtrinsicPayload;
  setError: (value: string | null) => void;
}

function LedgerSign ({ accountIndex, addressOffset, className, error, genesisHash, onSignature, payload, setError }: Props): React.ReactElement<Props> {
  console.log('signing with ledger');
  const [isBusy, setIsBusy] = useState(false);
  const { t } = useTranslation();
  const { chainInfo, error: ledgerError, isLoading: ledgerLoading, isLocked: ledgerLocked, ledger, rawMetadata, refresh, warning: ledgerWarning } = useLedger(genesisHash, accountIndex, addressOffset);

  console.log('chainInfo: ', chainInfo);
  console.log('raw: ', rawMetadata)
  const raw = rawMetadata ? rawMetadata : '0x00';
  const metaBuff = Buffer.from(raw, 'hex');
  console.log('metaBuff: ', metaBuff);
  useEffect(() => {
    if (ledgerError) {
      setError(ledgerError);
    }
  }, [ledgerError, setError]);

  const _onRefresh = useCallback(() => {
    refresh();
    setError(null);
  }, [refresh, setError]);

  const _onSignLedger = useCallback(
    (): void => {
    console.log('signing with ledger');
      if (!ledger || !payload || !onSignature) {
        return;
      }

      setError(null);
      setIsBusy(true);
      ledger.signWithMetadata(payload.toU8a(true), accountIndex, addressOffset, { metadata: metaBuff })
        .then((signature) => {
          onSignature(signature);
        }).catch((e: Error) => {
          setError(e.message);
          setIsBusy(false);
        });
    },
    [accountIndex, addressOffset, ledger, onSignature, payload, setError]
  );

  return (
    <div className={className}>
      {!!ledgerWarning && (
        <Warning>
          {ledgerWarning}
        </Warning>
      )}
      {error && (
        <Warning isDanger>
          {error}
        </Warning>
      )}
      {(ledgerLocked || error)
        ? (
          <Button
            isBusy={isBusy || ledgerLoading}
            onClick={_onRefresh}
          >
            <FontAwesomeIcon icon={faSync} />
            {t('Refresh')}
          </Button>
        )
        : (
          <Button
            isBusy={isBusy || ledgerLoading}
            onClick={_onSignLedger}
          >
            {t('Sign on Ledger')}
          </Button>
        )
      }
    </div>
  );
}

export default styled(LedgerSign)<Props>`
  flex-direction: column;
  padding: 6px 24px;

  .danger {
    margin-bottom: .5rem;
  }
`;
