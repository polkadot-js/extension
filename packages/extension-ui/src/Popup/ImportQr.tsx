// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useContext, useState } from 'react';
import { QrScanAddress } from '@polkadot/react-qr';

import { ActionContext, Address, Button, Header } from '../components';
import { createAccountExt } from '../messaging';
import { Back, Name } from '../partials';

type Props = {};

export default function ImportQr (): React.ReactElement<Props> {
  const onAction = useContext(ActionContext);
  const [account, setAccount] = useState<null | { address: string; genesisHash: string }>(null);
  const [name, setName] = useState<string | null>(null);

  // FIXME Duplicated between here and Create.tsx
  const _onCreate = (): void => {
    if (account && name) {
      createAccountExt(name, account.address, account.genesisHash)
        .then((): void => onAction('/'))
        .catch((error: Error) => console.error(error));
    }
  };

  return (
    <div>
      <Header label='import external' />
      <Back />
      {!account && <QrScanAddress onScan={setAccount} />}
      {account && (
        <>
          <Name
            isFocussed
            onChange={setName}
          />
          <Address
            {...account}
            name={name}
          >
            {name && (
              <Button
                label='Add the account with identified address'
                onClick={_onCreate}
              />
            )}
          </Address>
        </>
      )}
    </div>
  );
}
