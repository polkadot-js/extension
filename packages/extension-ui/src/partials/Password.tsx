// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Validator } from '../util/validators.js';

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { InputWithLabel, ValidatedInput } from '../components/index.js';
import { useTranslation } from '../hooks/index.js';
import { allOf, isNotShorterThan, isSameAs } from '../util/validators.js';

interface Props {
  isFocussed?: boolean;
  onChange: (password: string | null) => void;
}

const MIN_LENGTH = 6;

export default function Password ({ isFocussed, onChange }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [pass1, setPass1] = useState<string | null>(null);
  const [pass2, setPass2] = useState<string | null>(null);
  const isFirstPasswordValid = useMemo(() => isNotShorterThan(MIN_LENGTH, t('Password is too short')), [t]);
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
        onValidatedChange={setPass1}
        type='password'
        validator={isFirstPasswordValid}
      />
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
