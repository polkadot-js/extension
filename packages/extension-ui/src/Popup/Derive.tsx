// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useCallback, useContext, useState } from 'react';
import { RouteComponentProps } from 'react-router';

import { ActionContext, Address, Button, ButtonArea, Header, VerticalSpace } from '../components';
import { deriveAccount } from '../messaging';
import { DerivationPath, Name, Password } from '../partials';

type Props = RouteComponentProps<{ address: string }>;

export default function Derive({match: {params: {address: parentAddress}}}: Props): React.ReactElement<Props> {
  const onAction = useContext(ActionContext);
  const [account, setAccount] = useState<null | { address: string; suri: string }>(null);
  const [name, setName] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);

  const _onCreate = useCallback(async () => {
    if (!account || !name || !password) {
      return;
    }
    await deriveAccount(parentAddress, account.suri, name, password);
    onAction('/');
  }, [account, name, password]);

  return (
    <>
      <Header text='Derive account' showBackArrow/>
      <Name onChange={setName}/>
      {name && <DerivationPath onChange={setAccount} parentAddress={parentAddress}/>}
      {account && name && <Password onChange={setPassword}/>}
      {account && name && password && (
        <>
          <Address
            address={account.address}
            name={name}
          />
          <VerticalSpace/>
          <ButtonArea>
            <Button onClick={_onCreate}>Create derived account</Button>
          </ButtonArea>
        </>
      )}
    </>
  );
}
