// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useContext, useState } from 'react';
import { RouteComponentProps, withRouter } from 'react-router';

import { ActionContext, Address, Button, InputWithLabel, Title, Warning } from '../components';
import { exportAccount } from '../messaging';
import { Back } from '../partials';

const MIN_LENGTH = 6;

type Props = RouteComponentProps<{ address: string }>;

function Export ({ match: { params: { address } } }: Props): React.ReactElement<Props> {
  const onAction = useContext(ActionContext);

  const [pass, setPass] = useState('');
  const [wrongPasswordHighlight, setWrongPasswordHighlight] = useState(false);

  const _onExportButtonClick = (): Promise<void> =>
    exportAccount(address, pass)
      .then(({ exportedJson }) => {
        const element = document.createElement('a');
        element.href = `data:text/plain;charset=utf-8,${exportedJson}`;
        element.download = `${JSON.parse(exportedJson).meta.name}_exported_account_${Date.now()}.json`;
        element.click();
        onAction('/');
      })
      .catch((error: Error) => {
        console.error(error);
        setWrongPasswordHighlight(true);
        setTimeout(() => setWrongPasswordHighlight(false), 100);
      });

  return (
    <div>
      <Back />
      <Title>Export account</Title>
      <Address address={address}>
        <Warning danger>You are exporting your account. Keep it safe and don&apos;t share it with anyone.</Warning>
        <InputWithLabel
          isError={pass.length < MIN_LENGTH || wrongPasswordHighlight}
          label='password for this account'
          onChange={setPass}
          type='password'
          data-export-password
        />
        <Button
          isDisabled={pass.length === 0}
          isDanger
          label='I want to export this account'
          onClick={_onExportButtonClick}
          className='export-button'
          data-export-button
        />
      </Address>
    </div>
  );
}

export default withRouter(Export);
