// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useCallback, useState } from 'react';

import { Button, InputWithLabel } from '../../components';

interface Props {
  className?: string;
  onSign: (password: string) => Promise<void>;
  buttonText?: string;
}

export default function Unlock ({ buttonText = 'Sign the transaction', className, onSign }: Props): React.ReactElement<Props> {
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');

  const _onChangePassword = useCallback(
    (password: string): void => {
      setPassword(password);
      setError('');
    },
    []
  );
  const _onClick = useCallback(
    (): Promise<void> =>
      onSign(password).catch((error): void => setError(error.message)),
    [onSign, password]
  );

  return (
    <div className={className}>
      <InputWithLabel
        isError={!password || !!error}
        isFocused
        label='Password for this account'
        onChange={_onChangePassword}
        type='password'
      />
      <Button onClick={_onClick}>{buttonText}</Button>
    </div>
  );
}
