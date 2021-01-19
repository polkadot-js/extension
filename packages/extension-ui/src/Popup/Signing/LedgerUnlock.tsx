// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faSync } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { useLedger } from '@polkadot/extension-ui/hooks/useLedger';
import { Ledger } from '@polkadot/hw-ledger';

import { Button, Warning } from '../../components';
import useTranslation from '../../hooks/useTranslation';

interface Props {
  className?: string;
  error?: string | null;
  genesisHash? : string;
  isBusy: boolean;
  onSign: (ledger: Ledger) => Promise<void>;
  password: string;
  setError: (error: string | null) => void;
  setPassword: (password: string) => void;
}

function LedgerUnlock ({ className, error, genesisHash, isBusy, onSign, setError }: Props): React.ReactElement<Props> {
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
      .then((res) => {
        console.log('restult', res);
      }).catch((e: Error) => {
        setError(t<string>(
          'Ledger device error: {{errorMessage}}',
          { replace: { errorMessage: e.message } }
        ));
        setIsLocked(true);
        console.error(e);
      });
  }, [getLedger, ledger, setError, t]);

  const _onRefresh = useCallback(() => {
    setRefreshLock(true);
  }, []);

  const _onSign = useCallback(() => {
    if (!ledger) {
      return;
    }

    onSign(ledger).catch(console.error);
  }, [ledger, onSign]);

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
          onClick={_onSign}
        >
          {t<string>('Sign on Ledger')}
        </Button>)
      }
    </div>
  );
}

export default React.memo(styled(LedgerUnlock)`
  .danger {
    margin-bottom: .5rem;
  }
`);
