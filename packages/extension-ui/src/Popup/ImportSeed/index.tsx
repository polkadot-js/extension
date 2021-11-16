// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useEffect, useState } from 'react';

import { AccountContext, ActionContext, Address, Dropdown } from '../../components';
import AccountNamePasswordCreation from '../../components/AccountNamePasswordCreation';
import useGenesisHashOptions from '../../hooks/useGenesisHashOptions';
import useMetadata from '../../hooks/useMetadata';
import useTranslation from '../../hooks/useTranslation';
import { createAccountSuri } from '../../messaging';
import { HeaderWithSteps } from '../../partials';
import { DEFAULT_TYPE } from '../../util/defaultType';
import SeedAndPath from './SeedAndPath';

export interface AccountInfo {
  address: string;
  genesis?: string;
  suri: string;
}

function ImportSeed (): React.ReactElement {
  const { t } = useTranslation();
  const genesisOptions = useGenesisHashOptions();
  const { accounts } = useContext(AccountContext);
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [step1, setStep1] = useState(true);
  const [type, setType] = useState(DEFAULT_TYPE);
  const [genesisHash, setGenesisHash] = useState('');
  const chain = useMetadata(genesisHash, true);

  useEffect((): void => {
    !accounts.length && onAction();
  }, [accounts, onAction]);

  useEffect((): void => {
    setType(
      chain && chain.definition.chainType === 'ethereum'
        ? 'ethereum'
        : DEFAULT_TYPE
    );
  }, [chain, genesisHash]);

  const _onCreate = useCallback((name: string, password: string): void => {
    // this should always be the case
    if (name && password && account) {
      setIsBusy(true);

      createAccountSuri(name, password, account.suri, type, account.genesis)
        .then(() => onAction('/'))
        .catch((error): void => {
          setIsBusy(false);
          console.error(error);
        });
    }
  }, [account, onAction, type]);

  const _onNextStep = useCallback(
    () => setStep1(false),
    []
  );

  const _onBackClick = useCallback(
    () => setStep1(true),
    []
  );

  return (
    <>
      <HeaderWithSteps
        step={step1 ? 1 : 2}
        text={t<string>('Import account')}
      />
      <div>
        <Address
          address={account?.address}
          genesisHash={genesisHash}
          name={name}
        />
      </div>
      {step1
        ? (
          <>
            <Dropdown
              className='genesisSelection'
              label={t<string>('Network')}
              onChange={setGenesisHash}
              options={genesisOptions}
              value={genesisHash}
            />
            <SeedAndPath
              genesisHash={genesisHash}
              onAccountChange={setAccount}
              onNextStep={_onNextStep}
              type={type}
            />
          </>
        )
        : (
          <AccountNamePasswordCreation
            buttonLabel={t<string>('Add the account with the supplied seed')}
            isBusy={isBusy}
            onBackClick={_onBackClick}
            onCreate={_onCreate}
            onNameChange={setName}
          />
        )
      }
    </>
  );
}

export default ImportSeed;
