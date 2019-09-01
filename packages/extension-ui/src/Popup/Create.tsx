// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { OnActionFromCtx } from '../components/types';

import React, { useState, useEffect } from 'react';

import { Address, Button, Header, Loading, TextArea, withOnAction } from '../components';
import { createAccountInt, createSeed } from '../messaging';
import { Back, Name, Password } from '../partials';

interface Props {
  onAction: OnActionFromCtx;
}

function Create ({ onAction }: Props): React.ReactElement<Props> {
  const [account, setAccount] = useState<null | { address: string; seed: string }>(null);
  const [name, setName] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);

  useEffect((): void => {
    createSeed()
      .then(setAccount)
      .catch((error: Error) => console.error(error));
  }, []);

  // FIXME Duplicated between here and Import.tsx
  const onCreate = (): void => {
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
                onClick={onCreate}
              />
            </Address>
          )}
        </>
      )}</Loading>
    </div>
  );
}

export default withOnAction(Create);
