// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useState } from 'react';

import { Address, Button, Header, TextArea } from '../components';
import { createAccount, validateSeed } from '../messaging';
import { Back, Name, Password } from '../partials';

type Props = {
  onAction: () => void
};

export default function Import ({ onAction }: Props) {
  const [account, setAccount] = useState(null as null | { address: string, seed: string });
  const [name, setName] = useState(null as string | null);
  const [password, setPassword] = useState(null as string | null);

  const _onChangeSeed = (seed: string): void => {
    validateSeed(seed)
      .then(setAccount)
      .catch((error) => {
        console.error(error);

        setAccount(null);
      });
  };

  // FIXME Duplicated between here and Create.tsx
  const _onCreate = (): void => {
    // this should always be the case
    if (name && password && account) {
      createAccount(name, password, account.seed)
        .then(() => {
          onAction();
          window.location.hash = '/';
        })
        .catch(console.error);
    }
  };

  return (
    <div>
      <Header label='import account' />
      <Back />
      <TextArea
        isError={!account}
        isFocussed
        label={`existing 12 or 24-word mnemonic seed`}
        onChange={_onChangeSeed}
      />
      {account && <Name onChange={setName} />}
      {account && name && <Password onChange={setPassword} />}
      {account && name && password && (
        <>
          <Address
            address={account.address}
            name={name}
          />
          <Button
            isFull
            label='Add the account with the supplied seed'
            onClick={_onCreate}
          />
        </>
      )}

    </div>
  );
}
