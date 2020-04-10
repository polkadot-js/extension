// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useCallback, useContext, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';

import { ActionContext, Address, BackButton, ButtonArea, NextStepButton, VerticalSpace } from '../../components';
import { deriveAccount } from '../../messaging';
import { HeaderWithSteps, Name, Password } from '../../partials';
import { SelectParent } from './SelectParent';

type Props = RouteComponentProps<{ address: string }>;

function Derive ({ match: { params: { address: parentAddress } } }: Props): React.ReactElement<Props> {
  const onAction = useContext(ActionContext);
  const [account, setAccount] = useState<null | { address: string; suri: string }>(null);
  const [name, setName] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);
  const [parentPassword, setParentPassword] = useState<string | null>(null);

  const _onCreate = useCallback(async () => {
    if (!account || !name || !password || !parentPassword) {
      return;
    }

    await deriveAccount(parentAddress, account.suri, parentPassword, name, password);

    onAction('/');
  }, [account, name, password, onAction, parentAddress, parentPassword]);

  const _onDerivationConfirmed = useCallback(({ account, parentPassword }: {
    account: { address: string; suri: string };
    parentPassword: string;
  }) => {
    setAccount(account);
    setParentPassword(parentPassword);
  }, []);

  const _onBackClick = useCallback(() => {
    setAccount(null);
  }, []);

  return (
    <>
      <HeaderWithSteps
        step={account ? 2 : 1}
        text='Add new account:&nbsp;'
      />
      {!account && (
        <SelectParent
          onDerivationConfirmed={_onDerivationConfirmed}
          parentAddress={parentAddress}
        />
      )}
      {account && (
        <Name
          isFocused
          onChange={setName}
        />
      )}
      {account && name && <Password onChange={setPassword}/>}
      {account && name && password && (
        <Address
          address={account.address}
          name={name}
        />
      )}
      {account && (
        <>
          <VerticalSpace/>
          <ButtonArea>
            <BackButton onClick={_onBackClick}/>
            <NextStepButton
              isDisabled={!password}
              onClick={_onCreate}
            >
              Create derived account
            </NextStepButton>
          </ButtonArea>
        </>
      )}
    </>
  );
}

export default withRouter(Derive);
