// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useContext, useEffect, useState } from 'react';

import { AccountContext, InputWithLabel } from '../components';

interface Props {
  address?: string;
  className?: string;
  defaultValue?: string | null;
  isFocussed?: boolean;
  label?: string;
  onBlur?: () => void;
  onChange: (name: string | null) => void;
}

const MIN_LENGTH = 3;

export default function Name ({ address, className, defaultValue, isFocussed, label = 'A descriptive name for your account', onBlur, onChange }: Props): React.ReactElement<Props> {
  const accounts = useContext(AccountContext);
  const [name, setName] = useState('');
  const account = accounts.find((account): boolean => account.address === address);
  const startValue = (account && account.name) || defaultValue;
  const isError = !name && startValue
    ? false
    : (name.length < MIN_LENGTH);

  useEffect((): void => {
    onChange(
      name && (name.length >= MIN_LENGTH)
        ? name
        : null
    );
  }, [name]);

  return (
    <InputWithLabel
      data-input-name
      className={className}
      defaultValue={startValue}
      isError={isError}
      isFocused={isFocussed}
      label={label}
      onBlur={onBlur}
      onChange={setName}
      type='text'
    />
  );
}
