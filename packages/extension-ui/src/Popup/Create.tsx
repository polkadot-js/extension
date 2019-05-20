// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useState, useEffect } from 'react';

import { Address, Button, Header, Loading, TextArea } from '../components';
import { ActionContext } from '../components/contexts';
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
  const onCreate = (onAction: (to: string) => void) =>
    (): void => {
      // this should always be the case
      if (name && password && account) {
        createAccount(name, password, account.seed)
          .then(() => onAction('/'))
          .catch(console.error);
      }
    };

  return (
    <ActionContext.Consumer>
      {(onAction) => (
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
                    label='Add the account with the generated seed'
                    onClick={onCreate(onAction)}
                  />
                </>
              )}
            </>
          )}</Loading>
        </div>
      )}
    </ActionContext.Consumer>
  );
}
