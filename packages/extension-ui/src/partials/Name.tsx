// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useEffect, useState } from 'react';

import { Input } from '../components';

type Props = {
  isFocussed?: boolean,
  onChange: (name: string | null) => void
};

const MIN_LENGTH = 3;

export default function Name ({ isFocussed, onChange }: Props) {
  const [name, setName] = useState('');

  useEffect(() => {
    onChange(
      (name.length >= MIN_LENGTH)
        ? name
        : null
    );
  }, [name]);

  return (
    <>
      <Input
        isError={name.length < MIN_LENGTH}
        isFocussed={isFocussed}
        label='a descriptive name for this account'
        onChange={setName}
        type='text'
      />
    </>
  );
}
