// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { AccountExternalError, AccountExternalErrorCode } from '@subwallet/extension-base/background/KoniTypes';
import ScanAddress from '@subwallet/extension-koni-ui/components/Qr/ScanAddress';
import CN from 'classnames';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import styled, { ThemeContext } from 'styled-components';

import { AccountContext, AccountInfoEl, ActionContext, ButtonArea, Checkbox, LoadingContainer, NextStepButton, Theme, Warning } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { checkPublicAndPrivateKey, createAccountExternalV2, createAccountWithSecret } from '../../messaging';
import { Header, Name } from '../../partials';
import Password from '../../partials/Password';

interface QrAccount {
  content: string;
  genesisHash: string;
  isAddress: boolean;
  name?: string;
  isEthereum: boolean;
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
  const defaultName = useMemo((): string => `Account ${accountsWithoutAll.length + 1}`, [accountsWithoutAll.length]);

  const [isScanning, setIsScanning] = useState<boolean>(true);

  const [address, setAddress] = useState<string | null>(null);
  const [isEthereum, setIsEthereum] = useState(false);
  const [name, setName] = useState<string | null>(defaultName);
  const [password, setPassword] = useState<string | null>(null);
  const [errors, setErrors] = useState<AccountExternalError[]>([]);
  const [isConnectWhenCreate, setIsConnectWhenCreate] = useState<boolean>(true);
  const [isReadOnly, setIsReadOnly] = useState<boolean>(false);

  const [isBusy, setIsBusy] = useState<boolean>(false);
  const themeContext = useContext(ThemeContext as React.Context<Theme>);

  const _setAccount = useCallback(
    (qrAccount: QrAccount) => {
      setAccount(qrAccount);
      setIsScanning(false);
      setName(qrAccount?.name || defaultName);
      setIsReadOnly(false);

      if (qrAccount.isAddress) {
        setAddress(qrAccount.content);
        setIsEthereum(qrAccount.isEthereum);
      } else {
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
      }
    },
    [defaultName]
  );

  const _onCreate = useCallback(
    (): void => {
      setIsBusy(true);

      if (account && name) {
        if (account.isAddress) {
          createAccountExternalV2({
            name: name,
            address: account.content,
            genesisHash: account.genesisHash,
            isEthereum: isEthereum,
            isAllowed: isConnectWhenCreate,
            isReadOnly: isReadOnly
          })
            .then((errors) => {
              if (errors.length) {
                setErrors(errors);
              } else {
                window.localStorage.setItem('popupNavigation', '/');
                onAction('/');
              }
            })
            .catch((error: Error) => {
              setErrors([{ code: AccountExternalErrorCode.UNKNOWN_ERROR, message: error.message }]);
              console.error(error);
            })
            .finally(() => {
              setIsBusy(false);
            });
        } else if (password) {
          createAccountWithSecret({ name, password, isAllow: isConnectWhenCreate, secretKey: account.content, publicKey: account.genesisHash, isEthereum: isEthereum })
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
      } else {
        setIsBusy(false);
      }
    },
    [account, isConnectWhenCreate, isEthereum, isReadOnly, name, onAction, password]
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
        subHeaderName={t<string>('Scan Address Qr')}
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
                        genesisHash={account.isAddress ? account.genesisHash : undefined}
                        isEthereum={isEthereum}
                        isExternal={account.isAddress}
                        isReadOnly={isReadOnly}
                        name={name}
                      />
                      <Name
                        className='name-margin-bottom'
                        isFocused
                        onChange={setName}
                        value={name || ''}
                      />
                      { !account.isAddress && <Password onChange={setPassword} />}
                      { account.isAddress && (
                        <Checkbox
                          checked={isReadOnly}
                          label={t<string>('Readonly account')}
                          onChange={setIsReadOnly}
                        />
                      )}
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
                        isDisabled={!name || (!account.isAddress && !password)}
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

export default styled(ImportQr)`
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
