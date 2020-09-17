// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useContext } from 'react';

import { AccountContext, InputWithLabel, ValidatedInput } from '../components';
import useTranslation from '../hooks/useTranslation';
import { isNotShorterThan } from '../util/validators';

interface Props {
  address?: string;
  className?: string;
  isFocused?: boolean;
  label?: string;
  onBlur?: () => void;
  onChange: (name: string | null) => void;
}

// FIXME i18n
const isNameValid = isNotShorterThan(3, 'Account name is too short');

export default function Name ({ address, className, isFocused, label, onBlur, onChange }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);

  const account = accounts.find((account) => account.address === address);
  const startValue = account && account.name;

  return (
    <ValidatedInput
      className={className}
      component={InputWithLabel}
      data-input-name
      defaultValue={startValue}
      isFocused={isFocused}
      label={label || t<string>('A descriptive name for your account')}
      onBlur={onBlur}
      onValidatedChange={onChange}
      type='text'
      validator={isNameValid}
    />
  );
}
