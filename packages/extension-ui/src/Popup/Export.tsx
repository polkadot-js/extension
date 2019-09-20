// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useContext, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';

import { ActionContext, Address, Button, Header, Input, Tip } from '../components';
import { exportAccount } from '../messaging';
import { Back } from '../partials';

const MIN_LENGTH = 6;

type Props = RouteComponentProps<{ address: string }>;

function Export ({ match: { params: { address } } }: Props): React.ReactElement<Props> {
  const onAction = useContext(ActionContext);
  const [pass, setPass] = useState('');

  const _onClick = (): Promise<void> =>
    exportAccount(address, pass)
      .then((): void => onAction('/'))
      .catch((error: Error) => console.error(error));

  return (
    <div>
      <Header label='export account' />
      <Back />
      <Address address={address}>
        <Tip header='danger' type='error'>You are about to export the account. Keep it safe and don&apost share it with anyone.</Tip>
        <Input
          isError={pass.length < MIN_LENGTH}
          label='password for this account'
          onChange={setPass}
          type='password'
        />
        <Button
          isDanger
          label='I want to export this account'
          onClick={_onClick}
          className='export-button'
        />
      </Address>
    </div>
  );
}

export default withRouter(Export);
