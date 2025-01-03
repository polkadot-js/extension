// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback } from 'react';

import { InputWithLabel, Warning } from '../../components/index.js';
import { useTranslation } from '../../hooks/index.js';

interface Props {
  className?: string;
  error?: string | null;
  isBusy: boolean;
  onSign: () => void;
  password: string;
  setError: (error: string | null) => void;
  setPassword: (password: string) => void;
}

function Unlock ({ className, error, isBusy, onSign, password, setError, setPassword }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const _onChangePassword = useCallback(
    (password: string): void => {
      setPassword(password);
      setError(null);
    },
    [setError, setPassword]
  );

  return (
    <div className={className}>
      <InputWithLabel
        disabled={isBusy}
        isError={!password || !!error}
        isFocused
        label={t('Password for this account')}
        onChange={_onChangePassword}
        onEnter={onSign}
        type='password'
        value={password}
        withoutMargin={true}
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
