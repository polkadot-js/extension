// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faSync } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import styled from 'styled-components';

import { useGetSupportedLedger } from '@polkadot/extension-koni-ui/util/legerChains';
import settings from '@polkadot/ui-settings';

import { AccountInfoEl, ActionContext, Button, ButtonArea, Dropdown, Warning } from '../components';
import { useLedger } from '../hooks/useLedger';
import useTranslation from '../hooks/useTranslation';
import { createAccountHardware } from '../messaging';
import { Header, Name } from '../partials';
import { ThemeProps } from '../types';

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
  const [accountIndex, setAccountIndex] = useState<number>(0);
  const [addressOffset, setAddressOffset] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [genesis, setGenesis] = useState<string | null>(null);
  const onAction = useContext(ActionContext);
  const [name, setName] = useState<string | null>(null);
  const { address, error: ledgerError, isLoading: ledgerLoading, isLocked: ledgerLocked, refresh, warning: ledgerWarning } = useLedger(genesis, accountIndex, addressOffset);
  const ledgerChains = useGetSupportedLedger();

  useEffect(() => {
    if (address) {
      settings.set({ ledgerConn: 'webusb' });
    }
  }, [address]);

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
      text: t('Select network'),
      value: ''
    },
    ...ledgerChains.map(({ displayName, genesisHash }): NetworkOption => ({
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      text: displayName,
      value: genesisHash[0]
    }))]
  );

  const _onSave = useCallback(
    () => {
      if (address && genesis && name) {
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

  // select element is returning a string
  const _onSetAccountIndex = useCallback((value: number) => setAccountIndex(Number(value)), []);
  const _onSetAddressOffset = useCallback((value: number) => setAddressOffset(Number(value)), []);

  return (
    <div className={className}>
      <Header
        showBackArrow
        showSubHeader
        subHeaderName={t<string>('Import Ledger Account')}
      />
      <div className={'import-ledger-body-area'}>
        <AccountInfoEl
          address={address}
          className={'import-ledger-account'}
          genesisHash={genesis}
          isExternal
          isHardware
          name={name}
        />
        <Dropdown
          className='import-ledger__item'
          label={t<string>('Network')}
          onChange={setGenesis}
          options={networkOps.current}
          value={genesis}
        />
        {!!genesis && !!address && !ledgerError && (
          <Name
            className='import-ledger__item'
            onChange={setName}
            value={name || ''}
          />
        )}
        {!!name && (
          <>
            <Dropdown
              className='import-ledger__item'
              isDisabled={ledgerLoading}
              label={t<string>('account type')}
              onChange={_onSetAccountIndex}
              options={accOps.current}
              value={accountIndex}
            />
            <Dropdown
              className='import-ledger__item'
              isDisabled={ledgerLoading}
              label={t<string>('address index')}
              onChange={_onSetAddressOffset}
              options={addOps.current}
              value={addressOffset}
            />
          </>
        )}
        {!!ledgerWarning && (
          <Warning>
            {ledgerWarning}
          </Warning>
        )}
        {(!!error || !!ledgerError) && (
          <Warning
            isDanger
          >
            {error || ledgerError}
          </Warning>
        )}
        <ButtonArea className={'import-ledger-button-area'}>
          {ledgerLocked
            ? (
              <Button
                isBusy={ledgerLoading || isBusy}
                onClick={refresh}
              >
                {/* @ts-ignore */}
                <FontAwesomeIcon icon={faSync} />
                {t<string>('Refresh')}
              </Button>
            )
            : (
              <Button
                isBusy={ledgerLoading || isBusy}
                isDisabled={!!error || !!ledgerError || !address || !genesis}
                onClick={_onSave}
              >
                {t<string>('Import Account')}
              </Button>
            )
          }
        </ButtonArea>
      </div>
    </div>
  );
}

export default styled(ImportLedger)`
  display: flex;
  flex-direction: column;
  height: 100%;

  .import-ledger-body-area {
    padding: 10px 15px 0;
    flex: 1;
    overflow: auto;
  }

  .refreshIcon {
    margin-right: 0.3rem;
  }

  .import-ledger__item {
    margin-bottom: 12px;
  }

  .import-ledger-account {
    position: relative;
    //padding: 0 15px;

    .account-info-chain {
      right: 0;
    }
  }

  .import-ledger-button-area {
    bottom: 0;
    z-index: 1;
  }
`;
