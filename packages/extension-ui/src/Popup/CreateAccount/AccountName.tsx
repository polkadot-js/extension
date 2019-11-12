// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useState } from 'react';
import { Address, Button } from '@polkadot/extension-ui/components';
import { Name, Password } from '@polkadot/extension-ui/partials';

interface Props {
  onCreate: (name: string, password: string) => void | Promise<void | boolean>;
  address: string;
}

function AccountName ({ onCreate, address }: Props): React.ReactElement<Props> {
  const [name, setName] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);

  return <>
    <Name
      isFocussed
      onChange={setName}
    />
    {name && <Password onChange={setPassword} />}
    {name && password && (
      <Address
        address={address}
        name={name}
      >
        <Button
          label='Add the account with the generated seed'
          onClick={(): void | Promise<void | boolean> => onCreate(name, password)}
        />
      </Address>
    )}
  </>;
}

export default AccountName;
