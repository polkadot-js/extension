// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { OnActionFromCtx } from '../components/types';

import React, { useState } from 'react';
import { QrScanAddress } from '@polkadot/react-qr';

import { Address, Button, Header, withOnAction } from '../components';
import { createAccountExt } from '../messaging';
import { Back, Name } from '../partials';

interface Props {
  onAction: OnActionFromCtx;
}

function ImportQr ({ onAction }: Props): React.ReactElement<Props> {
  const [address, setAddress] = useState<null | string>(null);
  const [name, setName] = useState<string | null>(null);

  // FIXME Duplicated between here and Create.tsx
  const onCreate = (): void => {
    if (address && name) {
      createAccountExt(name, address)
        .then((): void => onAction('/'))
        .catch((error: Error) => console.error(error));
    }
  };

  return (
    <div>
      <Header label='import external' />
      <Back />
      {!address && <QrScanAddress onScan={setAddress} />}
      {address && (
        <>
          <Name
            isFocussed
            onChange={setName}
          />
          <Address
            address={address}
            name={name}
          >
            {name && (
              <Button
                label='Add the account with identified address'
                onClick={onCreate}
              />
            )}
          </Address>
        </>
      )}
    </div>
  );
}

export default withOnAction(ImportQr);
