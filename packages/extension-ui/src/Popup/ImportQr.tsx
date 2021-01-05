// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useState } from 'react';

import { QrScanAddress } from '@polkadot/react-qr';

import { ActionContext, Address, ButtonArea, NextStepButton, VerticalSpace } from '../components';
import useTranslation from '../hooks/useTranslation';
import { createAccountExternal } from '../messaging';
import { Header, Name } from '../partials';

interface QrAccount {
  content: string;
  genesisHash: string;
  name?: string;
}

export default function ImportQr (): React.ReactElement {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const [account, setAccount] = useState<QrAccount | null>(null);
  const [name, setName] = useState<string | null>(null);

  const _setAccount = useCallback((qrAccount: QrAccount) => {
    console.log('Qraccount', qrAccount);
    setAccount(qrAccount);
    setName(qrAccount?.name || null);
  }, []);

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
          <QrScanAddress onScan={_setAccount} />
        </div>
      )}
      {account && (
        <>
          <div>
            <Address
              {...account}
              address={account.content}
              isExternal={true}
              name={name}
            />
          </div>
          <Name
            isFocused
            onChange={setName}
            value={name || ''}
          />
          <VerticalSpace />
          <ButtonArea>
            <NextStepButton
              isDisabled={!name}
              onClick={_onCreate}
            >
              {t<string>('Add the account with identified address')}
            </NextStepButton>
          </ButtonArea>
        </>
      )}
    </>
  );
}
