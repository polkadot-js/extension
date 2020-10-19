// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useContext, useState } from 'react';
import { QrScanAddress } from '@polkadot/react-qr';

import { ActionContext, Address, NextStepButton, ButtonArea, VerticalSpace } from '../components';
import useTranslation from '../hooks/useTranslation';
import { createAccountExternal } from '../messaging';
import { Header, Name } from '../partials';

export default function ImportQr (): React.ReactElement {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const [account, setAccount] = useState<null | { content: string; genesisHash: string }>(null);
  const [name, setName] = useState<string | null>(null);

  // FIXME Duplicated between here and Create.tsx
  const _onCreate = (): void => {
    if (account && name) {
      createAccountExternal(name, account.content, account.genesisHash)
        .then(() => onAction('/'))
        .catch((error: Error) => console.error(error));
    }
  };

  return (
    <>
      <Header
        showBackArrow
        text={t<string>('Scan Address Qr')}
      />
      {!account && (
        <div>
          <QrScanAddress onScan={setAccount} />
        </div>
      )}
      {account && (
        <>
          <div>
            <Address
              {...account}
              isExternal={true}
              name={name}
            />
          </div>
          <Name
            isFocused
            onChange={setName}
          />
          <VerticalSpace />
          {name && (
            <ButtonArea>
              <NextStepButton
                onClick={_onCreate}
              >
                {t<string>('Add the account with identified address')}
              </NextStepButton>
            </ButtonArea>
          )}
        </>
      )}
    </>
  );
}
