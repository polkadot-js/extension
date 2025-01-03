// Copyright 2019-2025 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { HexString } from '@polkadot/util/types';

import React, { useCallback, useContext, useState } from 'react';

import { QrScanAddress } from '@polkadot/react-qr';

import AccountNamePasswordCreation from '../components/AccountNamePasswordCreation.js';
import { ActionContext, Address, ButtonArea, NextStepButton, VerticalSpace } from '../components/index.js';
import { useTranslation } from '../hooks/index.js';
import { createAccountExternal, createAccountSuri, createSeed } from '../messaging.js';
import { Header, Name } from '../partials/index.js';

interface QrAccount {
  content: string;
  genesisHash: HexString | null;
  isAddress: boolean;
  name?: string;
}

export default function ImportQr (): React.ReactElement {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const [account, setAccount] = useState<QrAccount | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [password, setPassword] = useState<string | null>(null);

  const _setAccount = useCallback(
    (qrAccount: QrAccount) => {
      setAccount(qrAccount);
      setName(qrAccount?.name || null);

      if (qrAccount.isAddress) {
        setAddress(qrAccount.content);
      } else {
        createSeed(undefined, qrAccount.content)
          .then(({ address }) => setAddress(address))
          .catch(console.error);
      }
    },
    []
  );

  const _onCreate = useCallback(
    (): void => {
      if (account && name) {
        if (account.isAddress) {
          createAccountExternal(name, account.content, account.genesisHash)
            .then(() => onAction('/'))
            .catch((error: Error) => console.error(error));
        } else if (password) {
          createAccountSuri(name, password, account.content, 'sr25519', account.genesisHash)
            .then(() => onAction('/'))
            .catch((error: Error) => console.error(error));
        }
      }
    },
    [account, name, onAction, password]
  );

  return (
    <>
      <Header
        showBackArrow
        text={t('Scan Address Qr')}
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
              address={address}
              isExternal={true}
              name={name}
            />
          </div>
          {account.isAddress
            ? (
              <Name
                isFocused
                onChange={setName}
                value={name || ''}
              />
            )
            : (
              <AccountNamePasswordCreation
                isBusy={false}
                onCreate={_onCreate}
                onNameChange={setName}
                onPasswordChange={setPassword}
              />
            )
          }
          <VerticalSpace />
          <ButtonArea>
            <NextStepButton
              isDisabled={!name || (!account.isAddress && !password)}
              onClick={_onCreate}
            >
              {t('Add the account with identified address')}
            </NextStepButton>
          </ButtonArea>
        </>
      )}
    </>
  );
}
