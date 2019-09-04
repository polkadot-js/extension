// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useContext, useEffect, useState } from 'react';

import { ActionContext, Address, Button, Header, Loading, TextArea } from '../components';
import { createAccountInt, createSeed } from '../messaging';
import { Back, Name, Password } from '../partials';

type Props = {}

export default function Create (): React.ReactElement<Props> {
  const onAction = useContext(ActionContext);
  const [account, setAccount] = useState<null | { address: string; seed: string }>(null);
  const [name, setName] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);

  useEffect((): void => {
    createSeed()
      .then(setAccount)
      .catch((error: Error) => console.error(error));
  }, []);

  // FIXME Duplicated between here and Import.tsx
  const _onCreate = (): void => {
    // this should always be the case
    if (name && password && account) {
      createAccountInt(name, password, account.seed)
        .then((): void => onAction('/'))
        .catch((error: Error) => console.error(error));
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
            label='generated 12-word mnemonic seed'
            value={account.seed}
          />
          <Name
            isFocussed
            onChange={setName}
          />
          {name && <Password onChange={setPassword} />}
          {name && password && (
            <Address
              address={account.address}
              name={name}
            >
              <Button
                label='Add the account with the generated seed'
                onClick={_onCreate}
              />
            </Address>
          )}
        </>
      )}</Loading>
    </div>
  );
}
