// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ExtrinsicPayload } from '@polkadot/types/interfaces';
import type { HexString } from '@polkadot/util/types';

import { faSync } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { cancelSignRequest } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { ActionContext, Button, Warning } from '../../components';
import { useLedger } from '../../hooks/useLedger';
import useTranslation from '../../hooks/useTranslation';

interface Props extends ThemeProps{
  accountIndex?: number;
  addressOffset?: number;
  className?: string;
  error: string | null;
  genesisHash?: string;
  onSignature?: ({ signature }: { signature: HexString }) => void;
  payload?: ExtrinsicPayload;
  setError: (value: string | null) => void;
  signId: string;
}

function LedgerSign ({ accountIndex, addressOffset, className, error, genesisHash, onSignature, payload, setError, signId }: Props): React.ReactElement<Props> {
  const [isBusy, setIsBusy] = useState(false);
  const { t } = useTranslation();

  const onAction = useContext(ActionContext);

  const { error: ledgerError, isLoading: ledgerLoading, isLocked: ledgerLocked, ledger, refresh, warning: ledgerWarning } = useLedger(genesisHash, accountIndex, addressOffset);

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
      if (!ledger || !payload || !onSignature) {
        return;
      }

      setError(null);
      setIsBusy(true);
      ledger.sign(payload.toU8a(true), accountIndex, addressOffset)
        .then((signature) => {
          onSignature(signature);
        }).catch((e: Error) => {
          setError(e.message);
          setIsBusy(false);
        });
    },
    [accountIndex, addressOffset, ledger, onSignature, payload, setError]
  );

  const _onCancel = useCallback((): void => {
    cancelSignRequest(signId)
      .then(() => onAction())
      .catch((error: Error) => console.error(error));
  }, [onAction, signId]);

  return (
    <>
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
      </div>
      <div className='sign-button-container'>
        <Button
          className='sign-button'
          onClick={_onCancel}
        >
          <span>
            {t<string>('Cancel')}
          </span>
        </Button>
        <Button
          className='sign-button'
          isBusy={isBusy || ledgerLoading}
          onClick={(ledgerLocked || error) ? _onRefresh : _onSignLedger}
        >
          {
            (ledgerLocked || error)
              ? (
                <>
                  <FontAwesomeIcon icon={faSync} />
                  {t<string>('Refresh')}
                </>
              )
              : (t<string>('Sign on Ledger'))
          }
        </Button>
      </div>
    </>
  );
}

export default styled(LedgerSign)`
  flex-direction: column;
  padding: 6px 24px;

  .danger {
    margin-bottom: .5rem;
  }
`;
