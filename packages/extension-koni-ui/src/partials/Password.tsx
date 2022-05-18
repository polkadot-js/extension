// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import InputWithLabel from '../components/InputWithLabel';
import ValidatedInput from '../components/ValidatedInput';
import useTranslation from '../hooks/useTranslation';
import { allOf, isNotShorterThan, isSameAs, Validator } from '../util/validators';

interface Props {
  isFocussed?: boolean;
  onChange: (password: string | null) => void;
  onFocusPasswordInput?: (value: string) => void;
  onFocusRepeatPasswordInput?: (value: string) => void;
  onScrollToError?: () => void;
}

const MIN_LENGTH = 6;

export default function Password ({ isFocussed, onChange, onFocusPasswordInput, onFocusRepeatPasswordInput, onScrollToError }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [pass1, setPass1] = useState<string | null>(null);
  const [pass2, setPass2] = useState<string | null>(null);
  const isFirstPasswordValid = useMemo(() => isNotShorterThan(MIN_LENGTH, t<string>('Password is too short')), [t]);
  const isSecondPasswordValid = useCallback((firstPassword: string): Validator<string> => allOf(
    isNotShorterThan(1, t<string>('Please fill repeat password')),
    isNotShorterThan(MIN_LENGTH, t<string>('Password is too short')),
    isSameAs(firstPassword, t<string>('Passwords do not match'))
  ), [t]);

  useEffect((): void => {
    onChange(pass1 && pass2 ? pass1 : null);
  }, [onChange, pass1, pass2]);

  return (
    <>
      <ValidatedInput
        component={InputWithLabel}
        data-input-password
        isFocused={isFocussed}
        label={t<string>('A new password for this account')}
        onFocus={onFocusPasswordInput}
        onScrollToError={onScrollToError}
        onValidatedChange={setPass1}
        type='password'
        validator={isFirstPasswordValid}
      />
      {pass1 && (
        <ValidatedInput
          component={InputWithLabel}
          data-input-repeat-password
          label={t<string>('Repeat password for verification')}
          onFocus={onFocusRepeatPasswordInput}
          onScrollToError={onScrollToError}
          onValidatedChange={setPass2}
          type='password'
          validator={isSecondPasswordValid(pass1)}
        />
      )}
    </>
  );
}
