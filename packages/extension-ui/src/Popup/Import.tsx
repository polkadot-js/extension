// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { OnActionFromCtx } from '../components/types';

import React, { useState } from 'react';

import { Address, Button, Header, TextArea, withOnAction } from '../components';
import { createAccount, validateSeed } from '../messaging';
import { Back, Name, Password } from '../partials';

interface Props {
  onAction: OnActionFromCtx;
}

function Import ({ onAction }: Props): React.ReactElement<Props> {
  const [account, setAccount] = useState<null | { address: string; suri: string }>(null);
  const [name, setName] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);

  const onChangeSeed = (suri: string): Promise<void> =>
    validateSeed(suri)
      .then(setAccount)
      .catch((): void => setAccount(null));

  // FIXME Duplicated between here and Create.tsx
  const onCreate = (): void => {
    // this should always be the case
    if (name && password && account) {
      createAccount(name, password, account.suri)
        .then((): void => onAction('/'))
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
        label='existing 12 or 24-word mnemonic seed'
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
