// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Validator } from '../util/validators.js';

import React, { useCallback, useEffect, useState } from 'react';

import { InputWithLabel, PasswordStrengthIndicator, ValidatedInput } from '../components/index.js';
import { useTranslation } from '../hooks/index.js';
import { validatePasswordStrength } from '../util/passwordValidation.js';
import { allOf, isNotShorterThan, isSameAs, Result } from '../util/validators.js';

interface Props {
  isFocussed?: boolean;
  onChange: (password: string | null) => void;
}

const MIN_LENGTH = 6;

export default function Password ({ isFocussed, onChange }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [password, setPassword] = useState<string | null>(null);
  const [confirmPassword, setConfirmPassword] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(validatePasswordStrength(''));
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isPasswordResultInit, setIsPasswordResultInit] = useState(false);

  const handlePasswordFocus = useCallback((): void => setIsPasswordFocused(true), []);
  const handlePasswordBlur = useCallback((): void => setIsPasswordFocused(false), []);

  // Primary password validation using zxcvbn
  const isFirstPasswordValid = useCallback<Validator<string>>((password) => {
    setIsPasswordResultInit(true);

    const strength = validatePasswordStrength(password);

    setPasswordStrength(strength);

    if (password.length < MIN_LENGTH) {
      return Promise.resolve(Result.error(t('Password is too short')));
    }

    return Promise.resolve(Result.ok<string>(password));
  }, [t]);

  const isSecondPasswordValid = useCallback((firstPassword: string): Validator<string> => allOf(
    isNotShorterThan(MIN_LENGTH, t('Password is too short')),
    isSameAs(firstPassword, t('Passwords do not match'))
  ), [t]);

  useEffect((): void => {
    onChange(password && confirmPassword ? password : null);
  }, [onChange, password, confirmPassword]);

  return (
    <>
      <ValidatedInput
        component={InputWithLabel}
        data-input-password
        isFocused={isFocussed}
        label={t('A new password for this account')}
        onBlur={(handlePasswordBlur)}
        onFocus={handlePasswordFocus}
        onValidatedChange={setPassword}
        type='password'
        validator={isFirstPasswordValid}
      />
      {isPasswordFocused && isPasswordResultInit && <PasswordStrengthIndicator passwordStrength={passwordStrength} />}
      {password && (
        <ValidatedInput
          component={InputWithLabel}
          data-input-repeat-password
          label={t('Repeat password for verification')}
          onValidatedChange={setConfirmPassword}
          type='password'
          validator={isSecondPasswordValid(password)}
        />
      )}
    </>
  );
}
