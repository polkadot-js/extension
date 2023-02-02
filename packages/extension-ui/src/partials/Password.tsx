// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useEffect, useMemo, useState } from 'react';

import viewOff from '../assets/viewOff.svg';
import viewOn from '../assets/viewOn.svg';
import { InputWithLabel, ValidatedInput } from '../components';
import useTranslation from '../hooks/useTranslation';
import { allOf, isNotShorterThan, isSameAs, Validator } from '../util/validators';

interface Props {
  isFocussed?: boolean;
  onChange: (password: string | null) => void;
}

const MIN_LENGTH = 6;

export default function Password({ isFocussed, onChange }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [pass1, setPass1] = useState<string | null>(null);
  const [pass2, setPass2] = useState<string | null>(null);
  const [isFirstPasswordVisible, setIsFirstPasswordVisible] = useState(false);
  const [isSecondPasswordVisible, setIsSecondPasswordVisible] = useState(false);
  const isFirstPasswordValid = useMemo(() => isNotShorterThan(MIN_LENGTH, t<string>('Password is too short')), [t]);
  const isSecondPasswordValid = useCallback(
    (firstPassword: string): Validator<string> =>
      allOf(
        isNotShorterThan(MIN_LENGTH, t<string>('Password is too short')),
        isSameAs(firstPassword, t<string>('Passwords do not match'))
      ),
    [t]
  );

  useEffect((): void => {
    onChange(pass1 && pass2 ? pass1 : null);
  }, [onChange, pass1, pass2]);

  const _handleFistInputTypeChange = useCallback(() => {
    setIsFirstPasswordVisible(!isFirstPasswordVisible);
  }, [isFirstPasswordVisible]);

  const _handleSecondInputTypeChange = useCallback(() => {
    setIsSecondPasswordVisible(!isSecondPasswordVisible);
  }, [isSecondPasswordVisible]);

  return (
    <>
      <ValidatedInput
        component={InputWithLabel}
        data-input-password
        isFocused={isFocussed}
        label={t<string>('Password')}
        onValidatedChange={setPass1}
        showPasswordElement={
          <div className='password-icon'>
          <img
            onClick={_handleFistInputTypeChange}
            src={isFirstPasswordVisible ? viewOn : viewOff}
          />
        </div>
        }
        type={isFirstPasswordVisible ? 'text' : 'password'}
        validator={isFirstPasswordValid}
      />
      {pass1 && (
        <>
          <ValidatedInput
            component={InputWithLabel}
            data-input-repeat-password
            label={t<string>('Confirm password')}
            onValidatedChange={setPass2}
            showPasswordElement={
              <div className='password-icon'>
              <img
                onClick={_handleSecondInputTypeChange}
                src={isSecondPasswordVisible ? viewOff : viewOn}
              />
            </div>
            }
            type={isSecondPasswordVisible ? 'text' : 'password'}
            validator={isSecondPasswordValid(pass1)}
          />

        </>
      )}
    </>
  );
}
