// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useEffect, useState } from 'react';

import useGenesisHashOptions from '@polkadot/extension-ui/hooks/useGenesisHashOptions';

import { AccountContext, ActionContext } from '../../components';
import AccountNamePasswordCreation from '../../components/AccountNamePasswordCreation';
import useMetadata from '../../hooks/useMetadata';
import useTranslation from '../../hooks/useTranslation';
import { createAccountSuri } from '../../messaging';
import { HeaderWithSteps } from '../../partials';
import { DEFAULT_TYPE } from '../../util/defaultType';
import NetworkSelection from './NetworkSelection';
import SeedAndPath from './SeedAndPath';

export interface AccountInfo {
  address: string;
  genesis?: string;
  suri: string;
}

function ImportSeed(): React.ReactElement {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const [account, setAccount] = useState<AccountInfo | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [step, setStep] = useState<number>(1);
  const [type, setType] = useState(DEFAULT_TYPE);
  const [path, setPath] = useState<string | null>(null);
  const [genesis, setGenesis] = useState('');
  const [seed, setSeed] = useState<string | null>(null);
  const chain = useMetadata(account && account.genesis, true);
  const genesisOptions = useGenesisHashOptions();

  useEffect((): void => {
    !accounts.length && onAction();
  }, [accounts, onAction]);

  useEffect((): void => {
    setType(chain && chain.definition.chainType === 'ethereum' ? 'ethereum' : DEFAULT_TYPE);
  }, [chain]);

  const _onCreate = useCallback(
    (name: string, password: string): void => {
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
    },
    [account, onAction, type]
  );

  const _onNextStep = useCallback(() => setStep((step) => step + 1), []);

  const _onPreviousStep = useCallback(() => setStep((step) => step - 1), []);

  return (
    <>
      <HeaderWithSteps
        step={step}
        text={t<string>('Import from secret phrase')}
        // TODO: placeholder for now
        total={3}
      />
      {step === 1 && (
        <SeedAndPath
          onAccountChange={setAccount}
          onNextStep={_onNextStep}
          path={path}
          seed={seed}
          setSeed={setSeed}
          type={type}
        />
      )}
      {step === 2 && (
        <>
          <NetworkSelection
            address={account?.address}
            onAccountChange={setAccount}
            onChange={setGenesis}
            onNextStep={_onNextStep}
            onPreviousStep={_onPreviousStep}
            options={genesisOptions}
            path={path}
            seed={seed}
            setPath={setPath}
            type={type}
            value={genesis}
          />
        </>
      )}
      {step === 3 && (
        <AccountNamePasswordCreation
          address={account?.address}
          buttonLabel={t<string>('Import')}
          genesisHash={genesis}
          isBusy={isBusy}
          onBackClick={_onPreviousStep}
          onCreate={_onCreate}
          onNameChange={setName}
        />
      )}
    </>
  );
}

export default ImportSeed;
