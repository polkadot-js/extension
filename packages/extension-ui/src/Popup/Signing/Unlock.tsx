// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useMemo } from 'react';

import { isNotShorterThan } from '@polkadot/extension-ui/util/validators';

import { InputWithLabel, ValidatedInput, Warning } from '../../components';
import useTranslation from '../../hooks/useTranslation';

interface Props {
  className?: string;
  error?: string | null;
  isBusy: boolean;
  onSign: () => void | Promise<void>;
  password: string;
  setError: (error: string | null) => void;
  setPassword: (password: string) => void;
}
const MIN_PASSWORD_LENGTH = 0;

function Unlock({
  className,
  error,
  isBusy,
  onSign,
  password,
  setError,
  setPassword
}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const _onChangePassword = useCallback(
    (password: string): void => {
      setPassword(password);
      setError(null);
    },
    [setError, setPassword]
  );

  const isPasswordValid = useMemo(() => isNotShorterThan(MIN_PASSWORD_LENGTH, t<string>('Password is too short')), [t]);

  return (
    <div className={className}>
      <ValidatedInput
        component={InputWithLabel}
        data-signing-password
        disabled={isBusy}
        isError={!password || !!error}
        isFocused
        label={t<string>('Password for this account')}
        onEnter={onSign}
        onValidatedChange={_onChangePassword}
        type='password'
        validator={isPasswordValid}
        value={password}
      />
      {error && (
        <Warning
          isBelowInput
          isDanger
        >
          {error}
        </Warning>
      )}
    </div>
  );
}

export default React.memo(Unlock);
