// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useEffect, useState } from 'react';

import { Button, InputWithLabel } from '../../components';
import useTranslation from '../../hooks/useTranslation';

interface Props {
  buttonText: string;
  children?: React.ReactNode;
  className?: string;
  error?: string | null;
  isBusy: boolean;
  onSign: (password: string) => Promise<void>;
}

function Unlock ({ buttonText, children, className, error, isBusy, onSign }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
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
    () => onSign(password),
    [onSign, password]
  );

  return (
    <div className={className}>
      <InputWithLabel
        disabled={isBusy}
        isError={!password || !!ownError}
        isFocused
        label={t<string>('Password for this account')}
        onChange={_onChangePassword}
        onEnter={_onClick}
        type='password'
        withoutMargin={!!children}
      />
      {children}
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
