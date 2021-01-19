// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ExtrinsicPayload } from '@polkadot/types/interfaces';

import { faSync } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { Button, ButtonArea, Warning } from '../../components';
import { useLedger } from '../../hooks/useLedger';
import useTranslation from '../../hooks/useTranslation';

interface Props {
  accountIndex?: number;
  addressOffset? : number;
  className?: string;
  error: string | null;
  genesisHash?: string;
  onSignature?: ({ signature }: { signature: string }) => void;
  payload?: ExtrinsicPayload;
  setError: (value: string | null) => void;
}

function LedgerSign ({ accountIndex, addressOffset, className, error, genesisHash, onSignature, payload, setError } : Props): JSX.Element {
  const [isBusy, setIsBusy] = useState(false);
  const { t } = useTranslation();
  const { getLedger } = useLedger();
  const [refreshLock, setRefreshLock] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  const ledger = useMemo(() => {
    setIsLocked(false);
    setRefreshLock(false);

    // // this trick allows to refresh the ledger on demand
    // // when it is shown as locked and the user has actually
    // // unlocked it, which we can't know.
    if (refreshLock || genesisHash) {
      return genesisHash && getLedger(genesisHash);
    }

    return null;
  }, [genesisHash, getLedger, refreshLock]);

  useEffect(() => {
    if (!ledger) {
      return;
    }

    setError(null);

    ledger.getAddress()
      .then(() => {
        // do nothing, ledger is ready
      }).catch((e: Error) => {
        const errorMessage = e.message.includes('Unknown Status Code: 26628')
          ? t<string>('Is the ledger locked? - {{errorMessage}}', { replace: { errorMessage: e.message } })
          : t<string>('Ledger device error: {{errorMessage}}', { replace: { errorMessage: e.message } }
          );

        setError(errorMessage);
        setIsLocked(true);
        console.error(e);
      });
  }, [getLedger, ledger, setError, t]);

  const _onRefresh = useCallback(() => {
    setRefreshLock(true);
    setError(null);
  }, [setError]);

  const _onSignLedger = useCallback((): void => {
    if (!ledger || !payload || !onSignature) {
      return;
    }

    setError(null);
    setIsBusy(true);
    ledger.sign(payload.toU8a(true), Number(accountIndex), Number(addressOffset))
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
      {error && (
        <Warning
          isDanger
        >
          {error}
        </Warning>
      )}
      {isLocked
        ? (<Button
          isBusy={isBusy}
          onClick={_onRefresh}
        >
          <FontAwesomeIcon
            icon={faSync}
          />
          {t<string>('Refresh')}
        </Button>
        )
        : (<Button
          isBusy={isBusy}
          onClick={_onSignLedger}
        >
          {t<string>('Sign on Ledger')}
        </Button>)
      }
    </div>

  );
}

export default styled(LedgerSign)`
  flex-direction: column;
  padding: 6px 24px;

  .danger {
    margin-bottom: .5rem;
  }
`;
