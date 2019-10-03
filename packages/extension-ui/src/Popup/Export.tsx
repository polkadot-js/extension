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
  const [wrongPasswordHighlight, setWrongPasswordHighlight] = useState(false);

  const _onExportButtonClick = (): Promise<void> =>
    exportAccount(address, pass)
      .then(({ exportedJson }) => {
        setExportedJson(exportedJson);
        setPasswordEntered(true);
      })
      .catch((error: Error) => {
        console.error(error);
        setWrongPasswordHighlight(true);
        setTimeout(() => setWrongPasswordHighlight(false), 100);
      });

  const _onTextareaClick = (): void => {
    const element = document.createElement('a');
    element.href = `data:text/plain;charset=utf-8,${exportedJson}`;
    element.download = `${JSON.parse(exportedJson).meta.name}_exported_account_${Date.now()}.json`;
    element.click();
  };

  return (
    <div>
      <Header label='export account' />
      <Back />
      <Address address={address}>
        <Tip header='danger' type='error'>You are exporting your account. Keep it safe and don&apos;t share it with anyone.</Tip>
        {!passwordEntered && <Input
          isError={pass.length < MIN_LENGTH || wrongPasswordHighlight}
          label='password for this account'
          onChange={setPass}
          type='password'
          data-export-password
        />}
        {!passwordEntered && <Button
          isDisabled={pass.length === 0}
          isDanger
          label='I want to export this account'
          onClick={_onExportButtonClick}
          className='export-button'
          data-export-button
        />}
        {passwordEntered && <Tip type='info' onClick={_onTextareaClick} data-download-bar>Click here to download exported JSON</Tip>}
        {passwordEntered && <TextArea
          isReadOnly
          label=''
          value={exportedJson}
          data-exported-account
          rowsCount={11}
        />}
      </Address>
    </div>
  );
}

export default withRouter(Export);
