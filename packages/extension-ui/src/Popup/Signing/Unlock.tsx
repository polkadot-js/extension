// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useState } from 'react';

import { Button, Input } from '../../components';
import { approveRequest } from '../../messaging';

type Props = {
  signId: number,
  isVisible: boolean,
  onAction: () => void
};

export default function Unlock ({ isVisible, onAction, signId }: Props) {
  const [password, setPassword] = useState('');

  if (!isVisible) {
    return null;
  }

  const _onSign = (): void => {
    approveRequest(signId, password)
      .then(onAction)
      .catch(console.error);
  };

  return (
    <>
      <Input
        isError={!password}
        isFocussed
        label='password for this account'
        onChange={setPassword}
        type='password'
      />
      <Button
        isFull
        label='Sign the extrinsic'
        onClick={_onSign}
      />
    </>
  );
}
