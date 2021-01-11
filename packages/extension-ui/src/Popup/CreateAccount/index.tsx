// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useEffect, useState } from 'react';

import { ActionContext, Address, Loading } from '../../components';
import AccountNamePasswordCreate from '../../components/AccountNamePasswordCreate';
import useTranslation from '../../hooks/useTranslation';
import { createAccountSuri, createSeed } from '../../messaging';
import { HeaderWithSteps } from '../../partials';
import { DEFAULT_TYPE } from '../../util/defaultType';
import Mnemonic from './Mnemonic';

export default function CreateAccount (): React.ReactElement {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const [step, setStep] = useState(1);
  const [account, setAccount] = useState<null | { address: string; seed: string }>(null);
  const type = DEFAULT_TYPE;
  const [name, setName] = useState('');

  useEffect((): void => {
    createSeed(undefined, type)
      .then(setAccount)
      .catch((error: Error) => console.error(error));
  }, [type]);

  // FIXME Duplicated between here and Import.tsx
  const _onCreate = useCallback(
    (name: string, password: string): void => {
      // this should always be the case
      if (name && password && account) {
        setIsBusy(true);

        createAccountSuri(name, password, account.seed)
          .then(() => onAction('/'))
          .catch((error: Error): void => {
            setIsBusy(false);
            console.error(error);
          });
      }
    },
    [account, onAction]
  );

  const _onNextStep = useCallback(() => setStep((step) => step + 1), []);
  const _onPreviousStep = useCallback(() => setStep((step) => step - 1), []);

  return (
    <>
      <HeaderWithSteps
        step={step}
        text={t<string>('Create an account')}
      />
      <Loading>
        <div>
          <Address
            address={account?.address}
            name={name}
          />
        </div>
        {account && (
          step === 1
            ? (
              <Mnemonic
                onNextStep={_onNextStep}
                seed={account.seed}
              />
            )
            : (
              <AccountNamePasswordCreate
                address={account.address}
                isBusy={isBusy}
                onBackClick={_onPreviousStep}
                onCreate={_onCreate}
                onNameChange={setName}
              />
            )
        )}
      </Loading>
    </>
  );
}
