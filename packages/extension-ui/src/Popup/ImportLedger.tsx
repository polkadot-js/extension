// Copyright 2019-2026 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { HexString } from '@polkadot/util/types';

import { faSync } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

import { settings } from '@polkadot/ui-settings';

import { ActionContext, Address, Button, ButtonArea, Dropdown, SettingsContext, Switch, VerticalSpace, Warning } from '../components/index.js';
import { useLedger, useTranslation } from '../hooks/index.js';
import { createAccountHardware } from '../messaging.js';
import { Header, Name } from '../partials/index.js';
import { styled } from '../styled.js';
import ledgerChains from '../util/legerChains.js';

interface AccOption {
  text: string;
  value: number;
}

interface NetworkOption {
  text: string;
  value: string;
}

const AVAIL: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];
const SELECT_NETWORK = '';
const ALLOW_ANY_NETWORK = '__allow_any_network__';

interface Props {
  className?: string;
}

function ImportLedger ({ className }: Props): React.ReactElement {
  const { t } = useTranslation();
  const [accountIndex, setAccountIndex] = useState<number>(0);
  const [addressOffset, setAddressOffset] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [genesis, setGenesis] = useState<HexString | null>(null);
  const [isEthereum, setIsEthereum] = useState(false);
  const onAction = useContext(ActionContext);
  const { ledgerApp } = useContext(SettingsContext);
  const [name, setName] = useState<string | null>(null);
  const isGenericLedgerApp = ledgerApp === 'generic';
  const isChainSpecific = ledgerApp === 'chainSpecific';
  const { address, error: ledgerError, isLoading: ledgerLoading, isLocked: ledgerLocked, refresh, type, warning: ledgerWarning } = useLedger(genesis, accountIndex, addressOffset, isEthereum);

  useEffect(() => {
    if (address) {
      settings.set({ ledgerConn: 'webusb' });
    }
  }, [address]);

  useEffect(() => {
    if (isChainSpecific) {
      setIsEthereum(false);
    }
  }, [isChainSpecific]);

  const accOps = useRef(AVAIL.map((value): AccOption => ({
    text: t('Account type {{index}}', { replace: { index: value } }),
    value
  })));

  const addOps = useRef(AVAIL.map((value): AccOption => ({
    text: t('Address index {{index}}', { replace: { index: value } }),
    value
  })));

  const onNetworkChange = useCallback((value: string) => {
    if (value === ALLOW_ANY_NETWORK) {
      setGenesis(null);

      return;
    }

    setGenesis(value ? value as HexString : null);
  }, []);

  const networkOps = useMemo(
    () => [
      ...(isGenericLedgerApp
        ? [{ text: t('Allow use on any chain'), value: ALLOW_ANY_NETWORK }]
        : [{ text: t('Select network'), value: SELECT_NETWORK }]),
      ...ledgerChains.map(({ displayName, genesisHash }): NetworkOption => ({
        text: displayName,
        value: genesisHash[0]
      }))
    ],
    [isGenericLedgerApp, t]
  );

  const _onSave = useCallback(
    () => {
      if (address && name && type) {
        setIsBusy(true);

        createAccountHardware(address, 'ledger', accountIndex, addressOffset, name, genesis, type)
          .then(() => onAction('/'))
          .catch((error: Error) => {
            console.error(error);

            setIsBusy(false);
            setError(error.message);
          });
      }
    },
    [accountIndex, address, addressOffset, genesis, name, onAction, type]
  );

  // select element is returning a string
  const _onSetAccountIndex = useCallback((value: number) => setAccountIndex(Number(value)), []);
  const _onSetAddressOffset = useCallback((value: number) => setAddressOffset(Number(value)), []);

  return (
    <>
      <Header
        showBackArrow
        text={t('Import Ledger Account')}
      />
      <div className={className}>
        <Address
          address={address}
          genesisHash={genesis}
          isExternal
          isHardware
          name={name}
          type={type ?? undefined}
        />
        <div className='ethereum-toggle'>
          <Switch
            checked={isEthereum}
            checkedLabel={t('Ethereum Account')}
            isDisabled={isChainSpecific}
            onChange={setIsEthereum}
            uncheckedLabel={t('ED25519 Account')}
          />
        </div>
        <Dropdown
          className='network'
          label={t('Network')}
          onChange={onNetworkChange}
          options={networkOps}
          value={genesis ?? (isGenericLedgerApp ? ALLOW_ANY_NETWORK : SELECT_NETWORK)}
        />
        {!!address && !ledgerError && (
          <Name
            onChange={setName}
            value={name || ''}
          />
        )}
        {!!name && (
          <>
            <Dropdown
              className='accountType'
              isDisabled={ledgerLoading}
              label={t('account type')}
              onChange={_onSetAccountIndex}
              options={accOps.current}
              value={accountIndex}
            />
            <Dropdown
              className='accountIndex'
              isDisabled={ledgerLoading}
              label={t('address index')}
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
      </div>
      <VerticalSpace />
      <ButtonArea>
        {ledgerLocked
          ? (
            <Button
              isBusy={ledgerLoading || isBusy}
              onClick={refresh}
            >
              <FontAwesomeIcon icon={faSync} />
              {t('Refresh')}
            </Button>
          )
          : (
            <Button
              isBusy={ledgerLoading || isBusy}
              isDisabled={!!error || !!ledgerError || !address || (!isGenericLedgerApp && !genesis)}
              onClick={_onSave}
            >
              {t('Import Account')}
            </Button>
          )
        }
      </ButtonArea>
    </>
  );
}

export default styled(ImportLedger)<Props>`
  .refreshIcon {
    margin-right: 0.3rem;
  }

  .ethereum-toggle {
    margin: 1rem 0;
  }
`;
