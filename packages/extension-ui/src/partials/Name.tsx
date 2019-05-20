// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useEffect, useState } from 'react';

import { Input } from '../components';

type Props = {
  defaultValue?: string | null,
  isFocussed?: boolean,
  label?: string | null,
  onBlur?: () => void,
  onChange: (name: string | null) => void,
  value?: string
};

const MIN_LENGTH = 3;

export default function Name ({ defaultValue, isFocussed, label = 'a descriptive name for this account', onBlur, onChange, value }: Props) {
  const [name, setName] = useState(defaultValue || '');

  useEffect(() => {
    onChange(
      (name.length >= MIN_LENGTH)
        ? name
        : null
    );
  }, [name]);

  return (
    <Input
      defaultValue={defaultValue}
      isError={name.length < MIN_LENGTH}
      isFocussed={isFocussed}
      label={label}
      onBlur={onBlur}
      onChange={setName}
      type='text'
      value={value}
    />
  );
}
