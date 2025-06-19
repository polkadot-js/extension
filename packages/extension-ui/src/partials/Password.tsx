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
  const [pass1, setPass1] = useState<string | null>(null);
  const [pass2, setPass2] = useState<string | null>(null);
  const [passwordStrength, setPasswordStrength] = useState(validatePasswordStrength(''));
  const [isPass1Focused, setIsPass1Focused] = useState(false);
  const [isPass1ResultInit, setisPass1ResultInit] = useState(false);

  const handlePass1Focus = useCallback((): void => setIsPass1Focused(true), []);
  const handlePass1Blur = useCallback((): void => setIsPass1Focused(false), []);

  // Primary password validation using zxcvbn
  const isFirstPasswordValid = useCallback<Validator<string>>((password) => {
    setisPass1ResultInit(true);

    const strength = validatePasswordStrength(password);

    setPasswordStrength(strength);

    if (!strength.isStrong) {
      return Promise.resolve(Result.error(t(strength.feedback.warning)));
    }

    return Promise.resolve(Result.ok<string>(password));
  }, [t]);

  const isSecondPasswordValid = useCallback((firstPassword: string): Validator<string> => allOf(
    isNotShorterThan(MIN_LENGTH, t('Password is too short')),
    isSameAs(firstPassword, t('Passwords do not match'))
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
        label={t('A new password for this account')}
        onBlur={(handlePass1Blur)}
        onFocus={handlePass1Focus}
        onValidatedChange={setPass1}
        type='password'
        validator={isFirstPasswordValid}
      />
      {isPass1Focused && isPass1ResultInit && <PasswordStrengthIndicator passwordStrength={passwordStrength} />}
      {pass1 && (
        <ValidatedInput
          component={InputWithLabel}
          data-input-repeat-password
          label={t('Repeat password for verification')}
          onValidatedChange={setPass2}
          type='password'
          validator={isSecondPasswordValid(pass1)}
        />
      )}
    </>
  );
}
