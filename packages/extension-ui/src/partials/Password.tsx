// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useEffect, useState } from 'react';

import { Input } from '../components';

type Props = {
  isFocussed?: boolean,
  onChange: (password: string | null) => void
};

const MIN_LENGTH = 6;

export default function Password ({ isFocussed, onChange }: Props) {
  const [pass1, setPass1] = useState('');
  const [pass2, setPass2] = useState('');

  useEffect(() => {
    onChange(
      (pass1 && pass2 && (pass1.length >= MIN_LENGTH) && (pass1 === pass2))
        ? pass1
        : null
    );
  }, [pass1, pass2]);

  return (
    <>
      <Input
        isError={pass1.length < MIN_LENGTH}
        isFocussed={isFocussed}
        label='a new password for this account'
        onChange={setPass1}
        type='password'
      />
      {(pass1.length >= MIN_LENGTH) && (
        <Input
          isError={pass1 !== pass2}
          label='repeat password for verification'
          onChange={setPass2}
          type='password'
        />
      )}
    </>
  );
}
