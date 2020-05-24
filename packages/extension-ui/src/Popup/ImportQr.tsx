// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useContext, useState } from 'react';
import { QrScanAddress } from '@polkadot/react-qr';

import { ActionContext, Address, NextStepButton, ButtonArea, VerticalSpace } from '../components';
import { createAccountExternal } from '../messaging';
import { Header, Name } from '../partials';

export default function ImportQr (): React.ReactElement {
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
      <Header
        showBackArrow
        text='Scan Address Qr'
      />
      {!account && (
        <div>
          <QrScanAddress onScan={setAccount} />
        </div>
      )}
      {account && (
        <>
          <Name
            isFocused
            onChange={setName}
          />
          <Address
            {...account}
            name={name}
          />
          <VerticalSpace />
          {name && (
            <ButtonArea>
              <NextStepButton
                onClick={_onCreate}
              >
                Add the account with identified address
              </NextStepButton>
            </ButtonArea>
          )}
        </>
      )}
    </>
  );
}
