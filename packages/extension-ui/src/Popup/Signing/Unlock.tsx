// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useCallback, useEffect, useState } from 'react';

import { Button, InputWithLabel } from '../../components';

interface Props {
  className?: string;
  error?: string | null;
  onSign: (password: string) => Promise<void>;
  buttonText?: string;
}

export default function Unlock ({ buttonText = 'Sign the transaction', className, error, onSign }: Props): React.ReactElement<Props> {
  const [ownError, setError] = useState<string | null>();
  const [password, setPassword] = useState('');

  useEffect((): void => {
    setError(error || null);
  }, [error]);

  const _onChangePassword = useCallback(
    (password: string): void => {
      setPassword(password);
      setError(null);
    },
    []
  );
  const _onClick = useCallback(
    (): Promise<void> =>
      onSign(password).catch((error: Error) => setError(error.message)),
    [onSign, password]
  );

  return (
    <div className={className}>
      <InputWithLabel
        isError={!password || !!ownError}
        isFocused
        label='Password for this account'
        onChange={_onChangePassword}
        type='password'
      />
      <Button onClick={_onClick}>{buttonText}</Button>
    </div>
  );
}
