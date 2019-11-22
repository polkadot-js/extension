// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useState, useEffect } from 'react';

import { Button, InputWithLabel } from '../../components';

interface Props {
  className?: string;
  onSign: (password: string) => Promise<void>;
}

export default function Unlock ({ className, onSign }: Props): React.ReactElement<Props> {
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');

  useEffect((): void => {
    if (error) {
      setError('');
    }
  }, [password]);

  const _onClick = (): Promise<void> =>
    onSign(password)
      .catch((error): void => setError(error.message));

  return (
    <div className={className}>
      <InputWithLabel
        isError={!password || !!error}
        isFocused
        label='Password for this account'
        onChange={setPassword}
        type='password'
      />
      <Button
        label='Sign the transaction'
        onClick={_onClick}
      />
    </div>
  );
}
