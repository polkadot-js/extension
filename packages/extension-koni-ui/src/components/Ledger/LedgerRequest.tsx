// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faSync } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { LedgerState } from '@subwallet/extension-base/signers/types';
import { ExternalRequestContext } from '@subwallet/extension-koni-ui/contexts/ExternalRequestContext';
import { rejectExternalRequest, resolveExternalRequest } from '@subwallet/extension-koni-ui/messaging';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';

import { Ledger } from '@polkadot/hw-ledger';
import { KeyringPair$Meta } from '@polkadot/keyring/types';
import { hexToU8a } from '@polkadot/util';

import { Button, Warning } from '../../components';
import { useLedger } from '../../hooks/useLedger';
import useTranslation from '../../hooks/useTranslation';

interface OnSignLedgerFunction {
  (ledgerState: LedgerState): void
}

interface Props extends ThemeProps{
  accountMeta: KeyringPair$Meta;
  children: JSX.Element;
  className?: string;
  errorArr: string[];
  genesisHash: string;
  handlerSignLedger: (onSignLedger: OnSignLedgerFunction) => void;
  isBusy: boolean;
  setBusy: (val: boolean) => void;
  setErrorArr: (errors: string[]) => void;
  onCancel: () => void;
}

const LedgerSign = (props: Props) => {
  const { accountMeta, children, className, errorArr, genesisHash, handlerSignLedger, isBusy, setBusy, setErrorArr } = props;

  const { t } = useTranslation();

  const { createResolveExternalRequestData } = useContext(ExternalRequestContext);

  const { error: ledgerError, isLoading: ledgerLoading, isLocked: ledgerLocked, ledger, refresh, warning: ledgerWarning } = useLedger(genesisHash, accountMeta.accountIndex as number, accountMeta.addressOffset as number);

  const [loading, setLoading] = useState(false);

  const [, setUpdate] = useState({});

  const handlerOnErrorLedger = useCallback((id: string, error: string) => {
    setErrorArr([error]);
    rejectExternalRequest({ id: id, message: error })
      .finally(() => setBusy(false));
  }, [setErrorArr, setBusy]);

  const _onRefresh = useCallback(() => {
    refresh();
    setErrorArr([]);
  }, [refresh, setErrorArr]);

  const onSignLedger = useCallback((ledger: Ledger, ledgerState: LedgerState) => {
    ledger.sign(hexToU8a(ledgerState.ledgerPayload), accountMeta.accountIndex as number, accountMeta.accountOffset as number)
      .then(({ signature }) => {
        const resolveData = createResolveExternalRequestData({ signature });

        // eslint-disable-next-line no-void
        void resolveExternalRequest({ id: ledgerState.ledgerId, data: resolveData });
      })
      .catch((e) => {
        handlerOnErrorLedger(ledgerState.ledgerId, (e as Error).message);
      });
  }, [accountMeta, createResolveExternalRequestData, handlerOnErrorLedger]);

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
    if (errorArr && errorArr.length) {
      return errorArr.map((err) =>
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
  }, [errorArr, t]);

  useEffect(() => {
    if (ledgerError) {
      setErrorArr([ledgerError]);
    }
  }, [ledgerError, setErrorArr]);

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
          {(ledgerLocked || errorArr.length)
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

export default React.memo(styled(LedgerSign)(({ theme }: Props) => `
  display: flex;
  flex: 1;

  .auth-transaction-body {
    flex: 1;
    padding-left: 15px;
    padding-right: 15px;
    padding-bottom: 15px;
    padding-top: 25px;
    overflow-y: auto;
  }

  .auth-transaction__separator, .auth-transaction-error {
    margin-top: 10px;
  }

  .button-wrapper {
    margin-top: 10px;
  }
`));
