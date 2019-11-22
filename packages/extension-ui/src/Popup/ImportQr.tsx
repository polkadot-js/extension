// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useContext, useState } from 'react';
import { QrScanAddress } from '@polkadot/react-qr';

import { ActionContext, ActionText, Address, Button, ButtonArea, Header, VerticalSpace } from '../components';
import { createAccountExternal } from '../messaging';
import { Name, TitleWithAction } from '../partials';

type Props = {};

export default function ImportQr (): React.ReactElement<Props> {
  const onAction = useContext(ActionContext);
  const [account, setAccount] = useState<null | { address: string; genesisHash: string }>(null);
  const [name, setName] = useState<string | null>(null);

  // FIXME Duplicated between here and Create.tsx
  const _onCreate = (): void => {
    if (account && name) {
      createAccountExternal(name, account.address, account.genesisHash)
        .then((): void => onAction('/'))
        .catch((error: Error) => console.error(error));
    }
  };

  return (
    <>
      <Header/>
      <TitleWithAction title='Import account from QR code'>
        <ActionText text='Cancel' onClick={(): void => onAction('/')}/>
      </TitleWithAction>
      {!account && (
        <div>
          <QrScanAddress onScan={setAccount} />
        </div>
      )}
      {account && (
        <>
          <Name
            isFocussed
            onChange={setName}
          />
          <Address
            {...account}
            name={name}
          />
          <VerticalSpace/>
          {name && (
            <ButtonArea>
              <Button
                label='Add the account with identified address'
                onClick={_onCreate}
              />
            </ButtonArea>
          )}
        </>
      )}
    </>
  );
}
