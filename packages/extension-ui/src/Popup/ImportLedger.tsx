// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { HexString } from '@polkadot/util/types';

import { faSync } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';

import { settings } from '@polkadot/ui-settings';

import { ActionContext, Address, Button, ButtonArea, Dropdown, Switch, VerticalSpace, Warning } from '../components/index.js';
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
  value: string | null;
}

const AVAIL: number[] = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

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
  const [isEcdsa, setIsEcdsa] = useState(false);
  const onAction = useContext(ActionContext);
  const [name, setName] = useState<string | null>(null);
  const { address, error: ledgerError, isLoading: ledgerLoading, isLocked: ledgerLocked, refresh, type, warning: ledgerWarning } = useLedger(genesis, accountIndex, addressOffset, isEcdsa);

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
      text: displayName,
      value: genesisHash[0]
    }))]
  );

  const _onSave = useCallback(
    () => {
      if (address && genesis && name && type) {
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
        />
        <Dropdown
          className='network'
          label={t('Network')}
          onChange={setGenesis}
          options={networkOps.current}
          value={genesis}
        />
        {!!genesis && !!address && !ledgerError && (
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
            <div className='ecdsa-toggle'>
              <Switch
                checked={isEcdsa}
                checkedLabel={t('ECDSA Account')}
                onChange={setIsEcdsa}
                uncheckedLabel={t('ED25519 Account')}
              />
            </div>
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
              isDisabled={!!error || !!ledgerError || !address || !genesis}
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

  .ecdsa-toggle {
    margin: 1rem 0;
  }
`;
