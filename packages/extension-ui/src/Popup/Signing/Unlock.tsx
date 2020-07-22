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

function Unlock ({ buttonText = 'Sign the transaction', className, error, onSign }: Props): React.ReactElement<Props> {
  const [isBusy, setIsBusy] = useState(false);
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
    (): void => {
      setIsBusy(true);
      onSign(password)
        .then(() => setIsBusy(false))
        .catch((error: Error): void => {
          setIsBusy(false);
          setError(error.message);
        });
    },
    [onSign, password]
  );

  return (
    <div className={className}>
      <InputWithLabel
        disabled={isBusy}
        isError={!password || !!ownError}
        isFocused
        label='Password for this account'
        onChange={_onChangePassword}
        onEnter={_onClick}
        type='password'
      />
      <Button
        isBusy={isBusy}
        onClick={_onClick}
      >
        {buttonText}
      </Button>
    </div>
  );
}

export default React.memo(Unlock);
