// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useState, useEffect } from 'react';

import { Address, Button, Header, Loading, TextArea } from '../components';
import { createAccount, createSeed } from '../messaging';
import { Back, Name, Password } from '../partials';

type Props = {};

export default function Create (props: Props) {
  const [account, setAccount] = useState(null as null | { address: string, seed: string });
  const [name, setName] = useState(null as string | null);
  const [password, setPassword] = useState(null as string | null);

  useEffect(() => {
    createSeed()
      .then(setAccount)
      .catch(console.error);
  }, []);

  // FIXME Duplicated between here and Import.tsx
  const _onCreate = (): void => {
    // this should always be the case
    if (name && password && account) {
      createAccount(name, password, account.seed)
        .then(() => {
          window.location.hash = '/';
        })
        .catch(console.error);
    }
  };

  return (
    <div>
      <Header label='create account' />
      <Back />
      <Loading>{account && (
        <>
          <TextArea
            isReadOnly
            label={`generated 12-word mnemonic seed`}
            value={account.seed}
          />
          <Name
            isFocussed
            onChange={setName}
          />
          {name && <Password onChange={setPassword} />}
          {name && password && (
            <>
              <Address
                address={account.address}
                name={name}
              />
              <Button
                isFull
                label='Add the account with the generated seed'
                onClick={_onCreate}
              />
            </>
          )}
        </>
      )}</Loading>
    </div>
  );
}
