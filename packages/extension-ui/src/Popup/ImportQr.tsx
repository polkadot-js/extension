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
  const [account, setAccount] = useState<null | { address: string; genesisHash: string }>(null);
  const [name, setName] = useState<string | null>(null);
  const onScan = (address: string, genesisHash: string): void => {
    setAccount({ address, genesisHash });
  };

  // FIXME Duplicated between here and Create.tsx
  const onCreate = (): void => {
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
      {!account && <QrScanAddress onScan={onScan} />}
      {account && (
        <>
          <Name
            isFocussed
            onChange={setName}
          />
          <Address
            address={account.address}
            genesisHash={account.genesisHash}
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
