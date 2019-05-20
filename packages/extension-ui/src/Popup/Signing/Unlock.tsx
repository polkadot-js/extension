// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useState, useEffect } from 'react';

import { Button, Input } from '../../components';
import { approveRequest } from '../../messaging';

type Props = {
  signId: number,
  isVisible: boolean,
  onAction: () => void
};

export default function Unlock ({ isVisible, onAction, signId }: Props) {
  const [error, setError] = useState('');
  const [password, setPassword] = useState('');

  if (!isVisible) {
    return null;
  }

  useEffect(() => {
    if (error) {
      setError('');
    }
  }, [password]);

  const _onSign = (): void => {
    approveRequest(signId, password)
      .then(onAction)
      .catch((error) => {
        console.error(error);
        setError(error.message);
      });
  };

  return (
    <>
      <Input
        isError={!password || !!error}
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
