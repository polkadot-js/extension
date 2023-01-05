// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faSync } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { AccountJson } from '@subwallet/extension-base/background/types';
import { LedgerState } from '@subwallet/extension-base/signers/types';
import { Button, Warning } from '@subwallet/extension-koni-ui/components';
import { InternalRequestContext } from '@subwallet/extension-koni-ui/contexts/InternalRequestContext';
import { SigningContext } from '@subwallet/extension-koni-ui/contexts/SigningContext';
import { useLedger } from '@subwallet/extension-koni-ui/hooks/useLedger';
import useTranslation from '@subwallet/extension-koni-ui/hooks/useTranslation';
import { rejectExternalRequest, resolveExternalRequest } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { Ledger } from '@polkadot/hw-ledger';
import { hexToU8a } from '@polkadot/util';

interface OnSignLedgerFunction {
  (ledgerState: LedgerState): void
}

interface Props extends ThemeProps{
  account?: AccountJson;
  children: JSX.Element | JSX.Element[];
  className?: string;
  genesisHash: string;
  handlerSignLedger: (onSignLedger: OnSignLedgerFunction) => void;
}

const LedgerRequest = (props: Props) => {
  const { account, children, className, genesisHash, handlerSignLedger } = props;

  const { t } = useTranslation();

  const { clearError, onErrors, setBusy, signingState } = useContext(SigningContext);
  const { createResolveExternalRequestData } = useContext(InternalRequestContext);

  const { errors, isBusy } = signingState;

  const { error: ledgerError, isLoading: ledgerLoading, isLocked: ledgerLocked, ledger, refresh, warning: ledgerWarning } = useLedger(genesisHash, account?.accountIndex as number, account?.addressOffset as number);

  const [loading, setLoading] = useState(false);
  const [, setUpdate] = useState({});

  const handlerOnErrorLedger = useCallback((id: string, error: string) => {
    onErrors([error]);
    rejectExternalRequest({ id: id, message: error })
      .finally(() => setBusy(false));
  }, [onErrors, setBusy]);

  const _onRefresh = useCallback(() => {
    refresh();
    clearError();
  }, [refresh, clearError]);

  const onSignLedger = useCallback((ledger: Ledger, ledgerState: LedgerState) => {
    ledger.sign(hexToU8a(ledgerState.ledgerPayload), account?.accountIndex as number, account?.accountOffset as number)
      .then(({ signature }) => {
        const resolveData = createResolveExternalRequestData({ signature });

        // eslint-disable-next-line no-void
        void resolveExternalRequest({ id: ledgerState.ledgerId, data: resolveData });
      })
      .catch((e) => {
        handlerOnErrorLedger(ledgerState.ledgerId, (e as Error).message);
      });
  }, [account, createResolveExternalRequestData, handlerOnErrorLedger]);

  const onSign = useCallback((ledgerState: LedgerState) => {
    if (ledger) {
      onSignLedger(ledger, ledgerState);
    }
  }, [onSignLedger, ledger]);

  const _onClick = useCallback((): void => {
    if (!ledger || isBusy || loading) {
      setUpdate({});

      return;
    }

    setLoading(true);
    handlerSignLedger(onSign);
    setTimeout(() => {
      setLoading(false);
    }, 100);
  }, [loading, isBusy, ledger, handlerSignLedger, onSign]);

  const renderError = useCallback(() => {
    if (errors && errors.length) {
      return errors.map((err) =>
        (
          <Warning
            className='auth-transaction-error'
            isDanger
            key={err}
          >
            {t<string>(err)}
          </Warning>
        )
      );
    } else {
      return <></>;
    }
  }, [errors, t]);

  useEffect(() => {
    if (ledgerError) {
      onErrors([ledgerError]);
    }
  }, [ledgerError, onErrors]);

  return (
    <div className={className}>
      <div className='auth-transaction-body'>
        { children }
        <div className='auth-transaction__separator' />
        {!!ledgerWarning && (
          <Warning className='auth-transaction-error'>
            {ledgerWarning}
          </Warning>
        )}
        { renderError() }
        <div className={'button-wrapper'}>
          {(ledgerLocked || errors.length)
            ? (
              <Button
                isBusy={isBusy || ledgerLoading || loading}
                onClick={_onRefresh}
              >
                <FontAwesomeIcon icon={faSync} />
                {t<string>('Refresh')}
              </Button>
            )
            : (
              <Button
                isBusy={isBusy || ledgerLoading || loading}
                onClick={_onClick}
              >
                {t<string>('Sign on Ledger')}
              </Button>
            )
          }
        </div>
      </div>
    </div>
  );
};

export default React.memo(styled(LedgerRequest)(({ theme }: Props) => `
  display: flex;
  flex: 1;
  position: relative;

  .auth-transaction-body {
    flex: 1;
    padding-left: 15px;
    padding-right: 15px;
    padding-bottom: 15px;
    padding-top: 25px;
    overflow-y: auto;
  }

  .auth-transaction__separator{
    padding-top: 24px;
    margin-bottom: 24px;
    border-bottom: 1px solid ${theme.menuItemsBorder};
  }

  .auth-transaction__separator, .auth-transaction-error {
    margin-top: 10px;
  }

  .button-wrapper {
    margin-top: 10px;
  }
`));
