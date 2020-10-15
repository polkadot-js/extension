// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '@polkadot/extension-ui/types';

import React, { useCallback } from 'react';
import styled from 'styled-components';

import { InputWithLabel } from '../../components';
import useTranslation from '../../hooks/useTranslation';

interface Props extends ThemeProps {
  className?: string;
  error?: string | null;
  isBusy: boolean;
  onSign: () => Promise<void>;
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
        label={t<string>('Password for this account')}
        onChange={_onChangePassword}
        onEnter={onSign}
        type='password'
        value={password}
      />
      {error && <div className='error'>{error}</div>}
    </div>
  );
}

export default React.memo(styled(Unlock)(({ theme }: ThemeProps) => `
  .error {
    font-size: ${theme.labelFontSize};
    line-height: ${theme.labelLineHeight};
    color: ${theme.errorColor};
  }
`));
