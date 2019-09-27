// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';

import { Address, Button, Header, Input, TextArea, Tip } from '../components';
import { exportAccount } from '../messaging';
import { Back } from '../partials';

const MIN_LENGTH = 6;

type Props = RouteComponentProps<{ address: string }>;

function Export ({ match: { params: { address } } }: Props): React.ReactElement<Props> {
  const [pass, setPass] = useState('');
  const [exportedJson, setExportedJson] = useState('');
  const [passwordEntered, setPasswordEntered] = useState(false);

  const _onClick = (): Promise<void> =>
    exportAccount(address, pass)
      .then(({ exportedJson }) => setExportedJson(exportedJson))
      .then(() => setPasswordEntered(true))
      .catch((error: Error) => console.error(error));

  return (
    <div>
      <Header label='export account' />
      <Back />
      <Address address={address}>
        <Tip header='danger' type='error'>You are about to export the account. Keep it safe and don&apos;t share it with anyone.</Tip>
        {!passwordEntered && <Input
          isError={pass.length < MIN_LENGTH}
          label='password for this account'
          onChange={setPass}
          type='password'
          data-export-password
        />}
        {!passwordEntered && <Button
          isDisabled={pass.length == 0}
          isDanger
          label='I want to export this account'
          onClick={_onClick}
          className='export-button'
          data-export-button
        />}
        {passwordEntered && <TextArea
          isReadOnly
          label=''
          value={exportedJson}
          data-exported-account
          rowsCount={13}
        />}
      </Address>
    </div>
  );
}

export default withRouter(Export);
