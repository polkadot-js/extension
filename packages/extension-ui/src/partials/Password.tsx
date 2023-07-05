// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useEffect, useState } from 'react';

import InputWithLabel from '../components/InputWithLabel';
import PasswordField from '../components/PasswordField';
import ValidatedInput from '../components/ValidatedInput';
import useTranslation from '../hooks/useTranslation';
import { isSameAs } from '../util/validators';

type Props = {
  isFocussed?: boolean;
  onChange: (password: string | null) => void;
  validationUserInput?: string[];
  label?: string;
  repeatLabel?: string;
}

const Password = ({ label, onChange, repeatLabel, validationUserInput }: Props) => {
  const { t } = useTranslation();
  const [nonValidatedPass1, setNonValidatedPass1] = useState<string>('');
  const [pass1, setPass1] = useState<string>('');
  const [pass2, setPass2] = useState<string>('');
  const isSecondPasswordValid = isSameAs(nonValidatedPass1, t<string>('Passwords do not match.'));

  useEffect((): void => {
    onChange(pass1 && pass1 === pass2 ? pass1 : null);
  }, [onChange, pass1, pass2]);

  return (
    <>
      <PasswordField
        label={label || t<string>('Set password')}
        onNonValidatedChange={setNonValidatedPass1}
        onValidatedChange={setPass1}
        validationUserInput={validationUserInput}
      />
      <ValidatedInput
        component={InputWithLabel}
        data-input-repeat-password
        label={repeatLabel || t<string>('Confirm password')}
        onValidatedChange={setPass2}
        shouldCheckCapsLock
        type='password'
        validator={isSecondPasswordValid}
      />
    </>
  );
};

export default Password;