// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useState, useEffect } from 'react';

import { Button, Input } from '../../components';
import { ActionContext } from '../../components/contexts';
import { approveRequest } from '../../messaging';

type Props = {
  signId: number,
  isVisible: boolean
};

export default function Unlock ({ isVisible, signId }: Props) {
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

  return (
    <ActionContext.Consumer>
      {(onAction) => {
        const onSign = (): void => {
          approveRequest(signId, password)
            .then(() => onAction())
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
              label='Sign the extrinsic'
              onClick={onSign}
            />
          </>
        );
      }}
    </ActionContext.Consumer>
  );
}
