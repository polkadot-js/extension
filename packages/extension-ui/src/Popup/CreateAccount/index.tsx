// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useContext, useEffect, useState } from 'react';
import { ActionContext, Loading } from '../../components';
import { createAccountSuri, createSeed } from '../../messaging';
import Mnemonic from '@polkadot/extension-ui/Popup/CreateAccount/Mnemonic';
import AccountName from '@polkadot/extension-ui/Popup/CreateAccount/AccountName';
import { HeaderWithSteps } from '@polkadot/extension-ui/partials';

export default function CreateAccount (): React.ReactElement {
  const onAction = useContext(ActionContext);
  const [step, setStep] = useState(1);
  const [account, setAccount] = useState<null | { address: string; seed: string }>(null);

  useEffect((): void => {
    createSeed()
      .then(setAccount)
      .catch((error: Error) => console.error(error));
  }, []);

  // FIXME Duplicated between here and Import.tsx
  const _onCreate = (name: string, password: string): void => {
    // this should always be the case
    if (name && password && account) {
      createAccountSuri(name, password, account.seed)
        .then((): void => onAction('/'))
        .catch((error: Error) => console.error(error));
    }
  };

  const _onNextStep = (): void => setStep(step + 1);
  const _onPreviousStep = (): void => setStep(step - 1);

  return (
    <>
      <HeaderWithSteps
        step={step}
        text='Create an account:&nbsp;'
      />
      <Loading>{account && (step === 1
        ? (
          <Mnemonic
            onNextStep={_onNextStep}
            seed={account.seed}
          />
        )
        : (
          <AccountName
            address={account.address}
            onBackClick={_onPreviousStep}
            onCreate={_onCreate}
          />
        )
      )}</Loading>
    </>
  );
}
