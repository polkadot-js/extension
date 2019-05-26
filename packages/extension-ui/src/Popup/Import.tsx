// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { OnActionFromCtx } from '../components/types';

import React, { useState } from 'react';

import { Address, Button, Header, TextArea, withOnAction } from '../components';
import { createAccount, validateSeed } from '../messaging';
import { Back, Name, Password } from '../partials';

type Props = {
  onAction: OnActionFromCtx
};

function Import ({ onAction }: Props) {
  const [account, setAccount] = useState<null | { address: string, seed: string }>(null);
  const [name, setName] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);

  const onChangeSeed = (seed: string) =>
    validateSeed(seed)
      .then(setAccount)
      .catch(() => setAccount(null));

  // FIXME Duplicated between here and Create.tsx
  const onCreate = () => {
    // this should always be the case
    if (name && password && account) {
      createAccount(name, password, account.seed)
        .then(() => onAction('/'))
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
        onChange={onChangeSeed}
      />
      {account && <Name onChange={setName} />}
      {account && name && <Password onChange={setPassword} />}
      {account && name && password && (
        <Address
          address={account.address}
          name={name}
        >
          <Button
            label='Add the account with the supplied seed'
            onClick={onCreate}
          />
        </Address>
      )}
    </div>
  );
}

export default withOnAction(Import);
