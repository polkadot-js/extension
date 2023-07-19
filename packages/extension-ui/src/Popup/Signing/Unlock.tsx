// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback } from 'react';
import styled from 'styled-components';

import { Result } from '@polkadot/extension-ui/util/validators';

import { AnimatedMessage, InputWithLabel, ValidatedInput } from '../../components';
import useTranslation from '../../hooks/useTranslation';

interface Props {
  className?: string;
  error?: string | null;
  isBusy: boolean;
  password: string;
  setError: (error: string | null) => void;
  setPassword: (password: string) => void;
}

function Unlock({ className, error, isBusy, password, setError, setPassword }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const _onChangePassword = useCallback(
    (password: string): void => {
      setPassword(password);
      setError(null);
    },
    [setError, setPassword]
  );

  return (
    <Container className={className}>
      <ValidatedInput
        component={InputWithLabel}
        data-signing-password
        disabled={isBusy}
        isError={!password || !!error}
        isFocused
        label={t<string>('Password for this account')}
        onValidatedChange={_onChangePassword}
        shouldCheckCapsLock
        type='password'
        validator={Result.ok}
        value={password}
      />
      <StyledAnimatedMessage
        in={!!error}
        messageType='critical'
        text={error || ''}
      />
    </Container>
  );
}

const Container = styled.div`
  & > * + * {
    margin-top: 8px;
  }
`;

const StyledAnimatedMessage = styled(AnimatedMessage)`
  margin-inline: 16px;
`;

export default React.memo(Unlock);
