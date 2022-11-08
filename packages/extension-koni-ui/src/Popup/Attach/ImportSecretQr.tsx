// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountExternalError, AccountExternalErrorCode } from '@subwallet/extension-base/background/KoniTypes';
import ScanAddress from '@subwallet/extension-koni-ui/components/Qr/ScanAddress';
import { SCAN_TYPE } from '@subwallet/extension-koni-ui/constants/qr';
import { QrAccount } from '@subwallet/extension-koni-ui/types/scanner';
import CN from 'classnames';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import styled, { ThemeContext } from 'styled-components';

import { AccountContext, AccountInfoEl, ActionContext, ButtonArea, Checkbox, LoadingContainer, NextStepButton, Theme, Warning } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { checkPublicAndPrivateKey, createAccountWithSecret } from '../../messaging';
import { Header, Name } from '../../partials';
import Password from '../../partials/Password';

interface Props {
  className?: string;
}

function ImportSecretQr ({ className }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);

  const [account, setAccount] = useState<QrAccount | null>(null);

  const { accounts } = useContext(AccountContext);
  const accountsWithoutAll = accounts.filter((acc: { address: string; }) => acc.address !== 'ALL');
  const defaultName = useMemo((): string => `Account ${accountsWithoutAll.length + 1}`, [accountsWithoutAll.length]);

  const [isScanning, setIsScanning] = useState<boolean>(true);

  const [address, setAddress] = useState<string | null>(null);
  const [isEthereum, setIsEthereum] = useState(false);
  const [name, setName] = useState<string | null>(defaultName);
  const [password, setPassword] = useState<string | null>(null);
  const [errors, setErrors] = useState<AccountExternalError[]>([]);
  const [isConnectWhenCreate, setIsConnectWhenCreate] = useState<boolean>(true);

  const [isBusy, setIsBusy] = useState<boolean>(false);
  const themeContext = useContext(ThemeContext as React.Context<Theme>);

  const _setAccount = useCallback(
    (qrAccount: QrAccount) => {
      setAccount(qrAccount);
      setIsScanning(false);
      setName(qrAccount?.name || defaultName);

      checkPublicAndPrivateKey(qrAccount.genesisHash, qrAccount.content)
        .then(({ address, isEthereum, isValid }) => {
          if (isValid) {
            setAddress(address);
            setIsEthereum(isEthereum);
          } else {
            setIsScanning(true);
            setAccount(null);
            setErrors([{ code: AccountExternalErrorCode.KEYRING_ERROR, message: 'Can\'t extract address from the QR code' }]);
          }
        })
        .catch((e) => {
          const error = (e as Error).message;

          console.error(error);
          setAccount(null);
          setIsScanning(true);
          setErrors([{ code: AccountExternalErrorCode.UNKNOWN_ERROR, message: error }]);
        });
    },
    [defaultName]
  );

  const _onCreate = useCallback(
    (): void => {
      setIsBusy(true);

      if (account && name && password) {
        createAccountWithSecret({ name: name,
          password: password,
          isAllow: isConnectWhenCreate,
          secretKey: account.content,
          publicKey: account.genesisHash,
          isEthereum: isEthereum })
          .then(({ errors, success }) => {
            if (success) {
              window.localStorage.setItem('popupNavigation', '/');
              onAction('/');
            } else {
              setErrors(errors);
            }
          })
          .catch((error: Error) => {
            setErrors([{ code: AccountExternalErrorCode.UNKNOWN_ERROR, message: error.message }]);
            console.error(error);
          })
          .finally(() => {
            setIsBusy(false);
          });
      } else {
        setIsBusy(false);
      }
    },
    [account, isConnectWhenCreate, isEthereum, name, onAction, password]
  );

  const renderErrors = useCallback((): JSX.Element => {
    if (errors && errors.length) {
      return (
        <>
          {
            errors.map((err, index) =>
              (
                <Warning
                  className='item-error'
                  isDanger
                  key={index}
                >
                  {t<string>(err.message)}
                </Warning>
              )
            )
          }
        </>
      );
    } else {
      return <></>;
    }
  }, [errors, t]);

  const handlerScanError = useCallback((e?: Error) => {
    if (e) {
      setErrors([{ code: AccountExternalErrorCode.UNKNOWN_ERROR, message: e.message }]);
    } else {
      setErrors([]);
    }
  }, []);

  return (
    <div className={className}>
      <Header
        showBackArrow
        showSubHeader
        subHeaderName={isScanning ? t<string>('Scan Address QR') : t<string>('Import By QR Code')}
      />
      <div
        className={CN(
          'import-qr-content',
          {
            '-with-padding': !isScanning
          }
        )}
      >
        {(!account || isScanning) && (
          <>
            <div>
              <ScanAddress
                onError={handlerScanError}
                onScan={_setAccount}
                type={SCAN_TYPE.SECRET}
              />
            </div>
            {renderErrors()}
          </>
        )}
        {(account && !isScanning) && (
          <>
            {
              address
                ? (
                  <>
                    <div className={`account-info-container ${themeContext.id === 'dark' ? '-dark' : '-light'}`}>
                      <AccountInfoEl
                        address={address}
                        isEthereum={isEthereum}
                        name={name}
                      />
                      <Name
                        className='name-margin-bottom'
                        isFocused
                        onChange={setName}
                        value={name || ''}
                      />
                      <Password onChange={setPassword} />
                      <Checkbox
                        checked={isConnectWhenCreate}
                        label={t<string>('Auto connect to all DApps after importing')}
                        onChange={setIsConnectWhenCreate}
                      />
                      <div className='error-wrapper'>
                        {renderErrors()}
                      </div>
                    </div>
                    <ButtonArea>
                      <NextStepButton
                        className='next-step-btn'
                        isBusy={isBusy}
                        isDisabled={!name || !password}
                        onClick={_onCreate}
                      >
                        {t<string>('Add the account with identified address')}
                      </NextStepButton>
                    </ButtonArea>
                  </>
                )
                : (
                  <LoadingContainer />
                )
            }
          </>
        )}
      </div>
    </div>
  );
}

export default styled(ImportSecretQr)`
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;

  .name-margin-bottom {
    margin-bottom: 10px;
  }

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

  .error-wrapper {
    margin: 0 -15px;
  }

  .item-error {
    margin: 10px 15px;
  }
`;
