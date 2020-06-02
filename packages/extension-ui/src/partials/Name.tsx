// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useContext } from 'react';

import { AccountContext, InputWithLabel, ValidatedInput } from '../components';
import { isNotShorterThan } from '../util/validators';

interface Props {
  address?: string;
  className?: string;
  isFocused?: boolean;
  label?: string;
  onBlur?: () => void;
  onChange: (name: string | null) => void;
}

const isNameValid = isNotShorterThan(3, 'Account name is too short');

export default function Name ({ address, className, isFocused, label = 'A descriptive name for your account', onBlur, onChange }: Props): React.ReactElement<Props> {
  const { accounts } = useContext(AccountContext);
  const account = accounts.find((account): boolean => account.address === address);
  const startValue = account && account.name;

  return (
    <ValidatedInput
      className={className}
      component={InputWithLabel}
      data-input-name
      defaultValue={startValue}
      isFocused={isFocused}
      label={label}
      onBlur={onBlur}
      onValidatedChange={onChange}
      type='text'
      validator={isNameValid}
    />
  );
}
