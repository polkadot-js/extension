// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

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
  value: string;
}

const AVAIL: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
const KUSAMA_GENESIS: string = ledgerChains[0].genesisHash[0];

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
  const [genesis, setGenesis] = useState(KUSAMA_GENESIS);
  const onAction = useContext(ActionContext);
  const name = useMemo(() => `ledger ${accountIndex}/${addressOffset}`, [accountIndex, addressOffset]);

  useEffect(() => {
    setIsBusy(true);

    // I don't get how this is possible, but sometimes addIndex was a string...
    getLedger(genesis).getAddress(false, Number(accountIndex), Number(addressOffset))
      .then(({ address }) => {
        setIsBusy(false);
        setAddress(address);
      }).catch((e: Error) => {
        setIsBusy(false);
        const errorMessage = e.message.includes('unkown')
          ? t<string>(
            'Is your ledger locked? Error from ledger: {{errorMessage}}',
            { replace: { errorMessage: e.message } }
          )
          : t<string>(
            'Ledger device error: {{errorMessage}}',
            { replace: { errorMessage: e.message } }
          );

        setError(errorMessage);
        console.error(e);
        setAddress(null);
      });
  }, [accountIndex, addressOffset, genesis, getLedger, t]);

  const accOps = useRef(AVAIL.map((value): AccOption => ({
    text: t('Account type {{index}}', { replace: { index: value } }),
    value
  })));

  const addOps = useRef(AVAIL.map((value): AccOption => ({
    text: t('Address index {{index}}', { replace: { index: value } }),
    value
  })));

  const networkOps = useRef(ledgerChains.map(({ displayName, genesisHash }): NetworkOption => ({
    text: displayName,
    value: genesisHash[0]
  })));

  const _onSave = useCallback(
    () => {
      if (address) {
        setError(null);
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
          name={name}
        />
        <Dropdown
          className='network'
          label={t<string>('Network')}
          onChange={setGenesis}
          options={networkOps.current}
          value={genesis}
        />
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
        <Button
          isBusy={isBusy}
          isDisabled={!address}
          onClick={_onSave}
        >
          {t<string>('Import Account')}
        </Button>
      </ButtonArea>
    </>
  );
}

export default styled(ImportLedger)`
`;
