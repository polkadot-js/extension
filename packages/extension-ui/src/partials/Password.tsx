// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useState, useEffect } from 'react';

import { InputWithLabel, ValidatedInput } from '../components';
import { allOf, isNotShorterThan, isSameAs, Validator } from '../validators';

interface Props {
  isFocussed?: boolean;
  onChange: (password: string | null) => void;
}

const MIN_LENGTH = 6;
const isFirstPasswordValid = isNotShorterThan(MIN_LENGTH, 'Password is too short');
const isSecondPasswordValid = (firstPassword: string): Validator<string> => allOf(
  isNotShorterThan(MIN_LENGTH, 'Password is too short'),
  isSameAs(firstPassword, 'Passwords do not match')
);

export default function Password ({ isFocussed, onChange }: Props): React.ReactElement<Props> {
  const [pass1, setPass1] = useState<string | null>(null);
  const [pass2, setPass2] = useState<string | null>(null);

  useEffect((): void => {
    onChange(pass1 && pass2 ? pass1 : null);
  }, [onChange, pass1, pass2]);

  return (
    <>
      <ValidatedInput
        component={InputWithLabel}
        validator={isFirstPasswordValid}
        onValidatedChange={setPass1}
        data-input-password
        isFocused={isFocussed}
        label='A new password for this account'
        type='password'
      />
      {pass1 && (
        <ValidatedInput
          component={InputWithLabel}
          validator={isSecondPasswordValid(pass1)}
          onValidatedChange={setPass2}
          data-input-repeat-password
          label='Repeat password for verification'
          type='password'
        />
      )}
    </>
  );
}
