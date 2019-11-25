// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useContext, useState } from 'react';

import {
  ActionContext,
  ActionText,
  Address,
  Button,
  ButtonArea,
  Header,
  TextAreaWithLabel,
  VerticalSpace
} from '../components';
import { createAccountSuri, validateSeed } from '../messaging';
import { TitleWithAction, Name, Password } from '../partials';
import styled from 'styled-components';

type Props = {};

export default function Import (): React.ReactElement<Props> {
  const onAction = useContext(ActionContext);
  const [account, setAccount] = useState<null | { address: string; suri: string }>(null);
  const [name, setName] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);

  const _onChangeSeed = (suri: string): Promise<void> =>
    validateSeed(suri)
      .then(setAccount)
      .catch((): void => setAccount(null));

  // FIXME Duplicated between here and Create.tsx
  const _onCreate = (): void => {
    // this should always be the case
    if (name && password && account) {
      createAccountSuri(name, password, account.suri)
        .then((): void => onAction('/'))
        .catch((error: Error) => console.error(error));
    }
  };

  return (
    <>
      <Header />
      <TitleWithAction title='Import account'>
        <ActionText text='Cancel' onClick={(): void => onAction('/')} />
      </TitleWithAction>
      <SeedInput
        rowsCount={2}
        isError={!account}
        isFocused
        label='existing 12 or 24-word mnemonic seed'
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
          <VerticalSpace />
          <ButtonArea>
            <Button onClick={_onCreate}>Add the account with the supplied seed</Button>
          </ButtonArea>
        </>
      )}
    </>
  );
}

const SeedInput = styled(TextAreaWithLabel)`
  margin-bottom: 16px;

  textarea {
    height: unset;
  }
`;
