// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useCallback, useContext, useState } from 'react';
import { RouteComponentProps } from 'react-router';
import styled from 'styled-components';

import { ActionContext, Address, Button, ButtonArea, Header, InputWithLabel, VerticalSpace } from '../components';
import { deriveAccount, validateAccount } from '../messaging';
import { DerivationPath, Name, Password } from '../partials';

type Props = RouteComponentProps<{ address: string }>;

export default function Derive ({ match: { params: { address: parentAddress } } }: Props): React.ReactElement<Props> {
  const onAction = useContext(ActionContext);
  const [account, setAccount] = useState<null | { address: string; suri: string }>(null);
  const [name, setName] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [parentPassword, setParentPassword] = useState<string | null>(null);
  const [isProperParentPassword, setIsProperParentPassword] = useState(false);
  const [derivationConfirmed, setDerivationConfirmed] = useState(false);

  const _onCreate = useCallback(async () => {
    if (!account || !name || !password || !parentPassword) {
      return;
    }
    await deriveAccount(parentAddress, account.suri, parentPassword, name, password);
    onAction('/');
  }, [account, name, password]);

  const _onParentPasswordEnter = useCallback(async (enteredPassword: string) => {
    setParentPassword(enteredPassword);
    setIsProperParentPassword(await validateAccount(parentAddress, enteredPassword));
  }, [parentPassword]);

  return (
    <>
      <Header text='Derive account' showBackArrow/>
      {!derivationConfirmed && <InputWithLabel
        isError={!isProperParentPassword}
        label='enter the password for the account you want to derive from'
        onChange={_onParentPasswordEnter}
        type='password'
        data-export-password
      />}
      {!derivationConfirmed && <DeriveButton
        isDisabled={!isProperParentPassword}
        onClick={(): void => setDerivationConfirmed(true)}
      >
        I want to derive from this account
      </DeriveButton>}
      {isProperParentPassword && derivationConfirmed && <Name onChange={setName}/>}
      {isProperParentPassword && derivationConfirmed && parentPassword && name && <DerivationPath
        onChange={setAccount}
        parentAddress={parentAddress}
        parentPassword={parentPassword}
      />}
      {isProperParentPassword && derivationConfirmed && account && name && <Password onChange={setPassword}/>}
      {isProperParentPassword && derivationConfirmed && account && name && password && (
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

const DeriveButton = styled(Button)`
  margin-left: 24px;
  margin-right: 24px;
  width: auto;
`;
