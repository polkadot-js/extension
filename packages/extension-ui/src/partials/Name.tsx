// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useEffect, useState } from 'react';

import { Input } from '../components';
import { AccountContext } from '../components/contexts';

type Props = {
  address?: string,
  defaultValue?: string | null,
  isFocussed?: boolean,
  label?: string | null,
  onBlur?: () => void,
  onChange: (name: string | null) => void
};

const MIN_LENGTH = 3;

export default function Name ({ address, defaultValue, isFocussed, label = 'a descriptive name for this account', onBlur, onChange }: Props) {
  const [name, setName] = useState('');

  useEffect(() => {
    onChange(
      (name.length >= MIN_LENGTH)
        ? name
        : null
    );
  }, [name]);

  return (
    <AccountContext.Consumer>
      {(accounts) => {
        const account = accounts.find((account) => account.address === address);
        const startValue = (account && account.meta.name) || defaultValue;
        const isError = !name && startValue
          ? false
          : (name.length < MIN_LENGTH);

        return (
          <Input
            defaultValue={startValue}
            isError={isError}
            isFocussed={isFocussed}
            label={label}
            onBlur={onBlur}
            onChange={setName}
            type='text'
          />
        );
      }}
    </AccountContext.Consumer>
  );
}
