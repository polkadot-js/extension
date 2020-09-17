// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useState, useEffect } from 'react';

import { InputWithLabel, ValidatedInput } from '../components';
import useTranslation from '../hooks/useTranslation';
import { allOf, isNotShorterThan, isSameAs, Validator } from '../util/validators';

interface Props {
  isFocussed?: boolean;
  onChange: (password: string | null) => void;
}

const MIN_LENGTH = 6;

// FIXME i18n
const isFirstPasswordValid = isNotShorterThan(MIN_LENGTH, 'Password is too short');
const isSecondPasswordValid = (firstPassword: string): Validator<string> => allOf(
  isNotShorterThan(MIN_LENGTH, 'Password is too short'),
  isSameAs(firstPassword, 'Passwords do not match')
);

export default function Password ({ isFocussed, onChange }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [pass1, setPass1] = useState<string | null>(null);
  const [pass2, setPass2] = useState<string | null>(null);

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
        onValidatedChange={setPass1}
        type='password'
        validator={isFirstPasswordValid}
      />
      {pass1 && (
        <ValidatedInput
          component={InputWithLabel}
          data-input-repeat-password
          label={t<string>('Repeat password for verification')}
          onValidatedChange={setPass2}
          type='password'
          validator={isSecondPasswordValid(pass1)}
        />
      )}
    </>
  );
}
