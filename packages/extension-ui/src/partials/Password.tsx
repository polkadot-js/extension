// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useEffect, useState } from 'react';

import { InputWithLabel } from '../components';

interface Props {
  isFocussed?: boolean;
  onChange: (password: string | null) => void;
}

const MIN_LENGTH = 6;

export default function Password ({ isFocussed, onChange }: Props): React.ReactElement<Props> {
  const [pass1, setPass1] = useState('');
  const [pass2, setPass2] = useState('');

  useEffect((): void => {
    onChange(
      (pass1 && pass2 && (pass1.length >= MIN_LENGTH) && (pass1 === pass2))
        ? pass1
        : null
    );
  }, [pass1, pass2]);

  return (
    <>
      <InputWithLabel
        data-input-password
        isError={pass1.length < MIN_LENGTH}
        isFocused={isFocussed}
        label='A new password for this account'
        onChange={setPass1}
        type='password'
      />
      {(pass1.length >= MIN_LENGTH) && (
        <InputWithLabel
          data-input-repeat-password
          isError={pass1 !== pass2}
          label='Repeat password for verification'
          onChange={setPass2}
          type='password'
        />
      )}
    </>
  );
}
