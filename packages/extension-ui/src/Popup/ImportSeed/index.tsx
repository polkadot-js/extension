// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useEffect, useState } from 'react';

import { AccountContext, ActionContext, Address } from '../../components';
import AccountNamePasswordCreation from '../../components/AccountNamePasswordCreation';
import useTranslation from '../../hooks/useTranslation';
import { createAccountSuri } from '../../messaging';
import { HeaderWithSteps } from '../../partials';
import SeedAndPath from './SeedAndPath';

function ImportSeed (): React.ReactElement {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const [account, setAccount] = useState<null | { address: string; suri: string }>(null);
  const [name, setName] = useState<string | null>(null);
  const [step1, setStep1] = useState(true);

  useEffect((): void => {
    !accounts.length && onAction();
  }, [accounts, onAction]);

  const _onCreate = useCallback((name: string, password: string): void => {
    // this should always be the case
    if (name && password && account) {
      setIsBusy(true);

      createAccountSuri(name, password, account.suri)
        .then(() => onAction('/'))
        .catch((error): void => {
          setIsBusy(false);
          console.error(error);
        });
    }
  }, [account, onAction]);

  const _onNextStep = useCallback(() => { setStep1(false); }, []);
  const _onBackClick = useCallback(() => { setStep1(true); }, []);

  return (
    <>
      <HeaderWithSteps
        step={step1 ? 1 : 2}
        text={t<string>('Import account')}
      />
      <div>
        <Address
          address={account?.address}
          name={name}
        />
      </div>
      {step1
        ? <SeedAndPath
          onAccountChange={setAccount}
          onNextStep={_onNextStep}
        />
        : <AccountNamePasswordCreation
          buttonLabel={t<string>('Add the account with the supplied seed')}
          isBusy={isBusy}
          onBackClick={_onBackClick}
          onCreate={_onCreate}
          onNameChange={setName}
        />

      }
    </>
  );
}

export default ImportSeed;
