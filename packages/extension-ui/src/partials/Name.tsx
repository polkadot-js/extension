// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AccountsFromCtx } from '../components/types';

import React, { useEffect, useState } from 'react';

import { Input, withAccounts } from '../components';

type Props = {
  accounts: AccountsFromCtx,
  address?: string,
  className?: string,
  defaultValue?: string | null,
  isFocussed?: boolean,
  label?: string | null,
  onBlur?: () => void,
  onChange: (name: string | null) => void
};

const MIN_LENGTH = 3;

function Name ({ accounts, address, className, defaultValue, isFocussed, label = 'a descriptive name for this account', onBlur, onChange }: Props) {
  const [name, setName] = useState('');
  const account = accounts.find((account) => account.address === address);
  const startValue = (account && account.meta.name) || defaultValue;
  const isError = !name && startValue
    ? false
    : (name.length < MIN_LENGTH);

  useEffect(() => {
    onChange(
      name && (name.length >= MIN_LENGTH)
        ? name
        : null
    );
  }, [name]);

  return (
    <Input
      className={className}
      defaultValue={startValue}
      isError={isError}
      isFocussed={isFocussed}
      label={label}
      onBlur={onBlur}
      onChange={setName}
      type='text'
    />
  );
}

export default withAccounts(Name);
