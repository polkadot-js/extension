// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faSync } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';

import { ActionContext, Address, Button, ButtonArea, Dropdown, VerticalSpace, Warning } from '../components';
import { useLedger } from '../hooks/useLedger';
import useTranslation from '../hooks/useTranslation';
import { createAccountHardware } from '../messaging';
import { Header } from '../partials';
import { ThemeProps } from '../types';
import ledgerChains from '../util/legerChains';

interface AccOption {
  text: string;
  value: number;
}

interface NetworkOption {
  text: string;
  value: string | null;
}

const AVAIL: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

interface Props extends ThemeProps {
  className?: string;
}

function ImportLedger ({ className }: Props): React.ReactElement {
  const { t } = useTranslation();
  const { getLedger } = useLedger();
  const [address, setAddress] = useState<string | null>(null);
  const [accountIndex, setAccountIndex] = useState<number>(0);
  const [addressOffset, setAddressOffset] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [genesis, setGenesis] = useState<string | null>(null);
  const [warning, setWarning] = useState<string | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [refreshLock, setRefreshLock] = useState(false);
  const onAction = useContext(ActionContext);
  const name = useMemo(() => `ledger ${accountIndex}/${addressOffset}`, [accountIndex, addressOffset]);
  const ledger = useMemo(() => {
    setIsLocked(false);
    setRefreshLock(false);

    // this trick allows to refresh the ledger on demand
    // when it is shown as locked and the user has actually
    // unlocked it, which we can't know.
    if (refreshLock || genesis) {
      return genesis && getLedger(genesis);
    }

    return null;
  }, [genesis, getLedger, refreshLock]);

  useEffect(() => {
    if (!ledger) {
      setAddress(null);

      return;
    }

    setIsBusy(true);
    setError(null);
    setWarning(null);

    // I don't get how this is possible, but sometimes addIndex was a string...
    ledger.getAddress(false, Number(accountIndex), Number(addressOffset))
      .then((res) => {
        console.log('restult', res);
        setIsBusy(false);
        setAddress(res.address);
      }).catch((e: Error) => {
        setIsBusy(false);

        const warningMessage = e.message.includes('App does not seem to be open')
          ? t<string>('Did you select the network corresponding to the ledger app?')
          : e.message.includes('Code: 26628')
            ? t<string>('Is your ledger locked?')
            : null;

        setIsLocked(true);
        setWarning(warningMessage);
        setError(t<string>(
          'Ledger device error: {{errorMessage}}',
          { replace: { errorMessage: e.message } }
        ));
        console.error(e);
        setAddress(null);
      });
  }, [accountIndex, addressOffset, genesis, getLedger, ledger, t]);

  const accOps = useRef(AVAIL.map((value): AccOption => ({
    text: t('Account type {{index}}', { replace: { index: value } }),
    value
  })));

  const addOps = useRef(AVAIL.map((value): AccOption => ({
    text: t('Address index {{index}}', { replace: { index: value } }),
    value
  })));

  const networkOps = useRef(
    [{
      text: 'Select network',
      value: ''
    },
    ...ledgerChains.map(({ displayName, genesisHash }): NetworkOption => ({
      text: displayName,
      value: genesisHash[0]
    }))]
  );

  const _onSave = useCallback(
    () => {
      if (address && genesis) {
        setIsBusy(true);

        createAccountHardware(address, 'ledger', accountIndex, addressOffset, name, genesis)
          .then(() => onAction('/'))
          .catch((error: Error) => {
            console.error(error);

            setIsBusy(false);
            setError(error.message);
          });
      }
    },
    [accountIndex, address, addressOffset, genesis, name, onAction]
  );

  const _onRefresh = useCallback(() => {
    setRefreshLock(true);
  }, []);

  return (
    <>
      <Header
        showBackArrow
        text={t<string>('Import Ledger Account')}
      />
      <div className={className}>
        <Address
          address={address}
          genesisHash={genesis}
          isExternal
          isHardware
          name={address ? name : ''}
        />
        <Dropdown
          className='network'
          label={t<string>('Network')}
          onChange={setGenesis}
          options={networkOps.current}
          value={genesis}
        />
        {genesis && address && !error && (
          <>
            <Dropdown
              className='accountType'
              label={t<string>('account type')}
              onChange={setAccountIndex}
              options={accOps.current}
              value={accountIndex}
            />
            <Dropdown
              className='accountIndex'
              label={t<string>('address index')}
              onChange={setAddressOffset}
              options={addOps.current}
              value={addressOffset}
            />
          </>
        )}
        {!!warning && (
          <Warning>
            {warning}
          </Warning>
        )}
        {!!error && (
          <Warning
            isDanger
          >
            {error}
          </Warning>
        )}
      </div>
      <VerticalSpace/>
      <ButtonArea>
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
            isDisabled={!!error || !address || !genesis}
            onClick={_onSave}
          >
            {t<string>('Import Account')}
          </Button>)
        }
      </ButtonArea>
    </>
  );
}

export default styled(ImportLedger)`
  .refreshIcon {
    margin-right: 0.3rem;
  }
`;
