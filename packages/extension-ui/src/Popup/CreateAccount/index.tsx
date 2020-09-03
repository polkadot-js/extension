// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useCallback, useContext, useEffect, useState } from 'react';
import { ActionContext, Loading } from '../../components';
import { createAccountSuri, createSeed } from '../../messaging';
import { HeaderWithSteps } from '../../partials';
import AccountName from './AccountName';
import Mnemonic from './Mnemonic';

export default function CreateAccount (): React.ReactElement {
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const [step, setStep] = useState(1);
  const [account, setAccount] = useState<null | { address: string; seed: string }>(null);

  useEffect((): void => {
    createSeed()
      .then(setAccount)
      .catch((error: Error) => console.error(error));
  }, []);

  // FIXME Duplicated between here and Import.tsx
  const _onCreate = useCallback(
    (name: string, password: string): void => {
      // this should always be the case
      if (name && password && account) {
        setIsBusy(true);
        createAccountSuri(name, password, account.seed)
          .then((): void => onAction('/'))
          .catch((error: Error): void => {
            setIsBusy(false);
            console.error(error);
          });
      }
    },
    [account]
  );

  const _onNextStep = useCallback(() => setStep((step) => step + 1), []);
  const _onPreviousStep = useCallback(() => setStep((step) => step - 1), []);

  return (
    <>
      <HeaderWithSteps
        step={step}
        text='Create an account:&nbsp;'
      />
      <Loading>{account && (
        step === 1
          ? (
            <Mnemonic
              onNextStep={_onNextStep}
              seed={account.seed}
            />
          )
          : (
            <AccountName
              address={account.address}
              isBusy={isBusy}
              onBackClick={_onPreviousStep}
              onCreate={_onCreate}
            />
          )
      )}</Loading>
    </>
  );
}
