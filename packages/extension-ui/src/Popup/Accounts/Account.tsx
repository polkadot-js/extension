// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React from 'react';

import { ActionBar, Address } from '../../components';
import { forgetAccount } from '../../messaging';

type Props = {
  address: string,
  name?: string,
  onAction: () => void
};

export default function Account ({ address, name, onAction }: Props) {
  const _onForget = (): void => {
    forgetAccount(address)
      .then(onAction)
      .catch(console.error);
  };

  return (
    <Address
      address={address}
      name={name}
    >
      <ActionBar>
        <a onClick={_onForget}>Forget</a>
      </ActionBar>
    </Address>
  );
}
