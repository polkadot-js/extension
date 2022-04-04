// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useState } from 'react';
import styled, { ThemeContext } from 'styled-components';

import { SUBSTRATE_ACCOUNT_TYPE } from '@polkadot/extension-koni-ui/Popup/CreateAccount';
import { QrScanAddress } from '@polkadot/react-qr';

import { AccountContext, AccountInfoEl, ActionContext, ButtonArea, NextStepButton, Theme } from '../components';
import AccountNamePasswordCreation from '../components/AccountNamePasswordCreation';
import useTranslation from '../hooks/useTranslation';
import { createAccountExternal, createAccountSuri, createSeed } from '../messaging';
import { Header, Name } from '../partials';

interface QrAccount {
  content: string;
  genesisHash: string;
  isAddress: boolean;
  name?: string;
}

interface Props {
  className?: string;
}

function ImportQr ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const [account, setAccount] = useState<QrAccount | null>(null);
  const { accounts } = useContext(AccountContext);
  const accountsWithoutAll = accounts.filter((acc: { address: string; }) => acc.address !== 'ALL');
  const defaultName = `Account ${accountsWithoutAll.length + 1}`;
  const [address, setAddress] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(defaultName);
  const [password, setPassword] = useState<string | null>(null);
  const themeContext = useContext(ThemeContext as React.Context<Theme>);

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
            .then(() => {
              window.localStorage.setItem('popupNavigation', '/');
              onAction('/');
            })
            .catch((error: Error) => console.error(error));
        } else if (password) {
          createAccountSuri(name, password, account.content, 'sr25519', account.genesisHash)
            .then(() => {
              window.localStorage.setItem('popupNavigation', '/');
              onAction('/');
            })
            .catch((error: Error) => console.error(error));
        }
      }
    },
    [account, name, onAction, password]
  );

  return (
    <div className={className}>
      <Header
        showBackArrow
        showSubHeader
        subHeaderName={t<string>('Scan Address Qr')}
      />
      <div className={account && account.isAddress ? 'import-qr-content -with-padding' : 'import-qr-content'}>
        {!account && (
          <div>
            <QrScanAddress onScan={_setAccount} />
          </div>
        )}
        {account && (
          <>
            {account.isAddress && (<div className={`account-info-container ${themeContext.id === 'dark' ? '-dark' : '-light'}`}>
              <AccountInfoEl
                address={address}
                isExternal={true}
                name={name}
              />
            </div>)}
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
                  address={address}
                  buttonLabel={t<string>('Add the account with identified address')}
                  isBusy={false}
                  keyTypes={[SUBSTRATE_ACCOUNT_TYPE]}
                  name={defaultName}
                  onCreate={_onCreate}
                  onPasswordChange={setPassword}
                />
              )
            }
            {
              account.isAddress && <ButtonArea>
                <NextStepButton
                  className='next-step-btn'
                  isDisabled={!name || (!account.isAddress && !password)}
                  onClick={_onCreate}
                >
                  {t<string>('Add the account with identified address')}
                </NextStepButton>
              </ButtonArea>
            }
          </>
        )}
      </div>
    </div>
  );
}

export default styled(ImportQr)`

  .import-qr-content {
    flex: 1;
    overflow-y: auto;
  }

  .import-qr-content.-with-padding {
    padding: 25px 15px 15px;
  }



  .next-step-btn {
    > .children {
      display: flex;
      align-items: center;
      position: relative;
      justify-content: center;
    }
  }
`;
