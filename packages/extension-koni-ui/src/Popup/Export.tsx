// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { Theme, ThemeProps } from '../types';

import cloneLogo from '@subwallet/extension-koni-ui/assets/clone.svg';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import Header from '@subwallet/extension-koni-ui/partials/Header';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { isAccountAll, toShort } from '@subwallet/extension-koni-ui/util';
import { saveAs } from 'file-saver';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import CopyToClipboard from 'react-copy-to-clipboard';
import QRCode from 'react-qr-code';
import { useSelector } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router';
import styled, { ThemeContext } from 'styled-components';

import { AccountContext, AccountInfoEl, ActionBar, ActionContext, ActionText, Button, InputWithLabel, Label, Warning } from '../components';
import useTranslation from '../hooks/useTranslation';
import { exportAccount, exportAccountPrivateKey } from '../messaging';

const MIN_LENGTH = 6;

interface Props extends RouteComponentProps<{ address: string }>, ThemeProps {
  className?: string;
}

function ExportAccount ({ className, match: { params: { address } } }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const accounts = useContext(AccountContext);
  const [isBusy, setIsBusy] = useState(false);
  const [pass, setPass] = useState('');
  const [privateKey, setPrivateKey] = useState<string | undefined>(undefined);
  const [publicKey, setPublicKey] = useState<string>('');
  const [isQr, setIsQr] = useState(false);
  const [buttonId, setButtonId] = useState('');
  const { show } = useToast();
  const [error, setError] = useState('');
  const themeContext = useContext(ThemeContext as React.Context<Theme>);
  const _isAllAccount = isAccountAll(address);
  const currentAccount = useSelector((state: RootState) => state.currentAccount);

  const accountName = useMemo((): string | undefined => {
    return accounts.accounts.find((acc) => acc.address === address)?.name;
  }, [accounts, address]);

  const qrData = useMemo(() => {
    const prefix = 'secret';
    const result: string[] = [prefix, privateKey || '', publicKey];

    if (accountName) {
      result.push(accountName);
    }

    return result.join(':');
  }, [accountName, publicKey, privateKey]);

  const _goHome = useCallback(
    () => {
      setButtonId('cancel');
      window.localStorage.setItem('popupNavigation', '/');
      onAction('/');
    },
    [onAction]
  );

  const onPassChange = useCallback(
    (password: string) => {
      setPass(password);
      setError('');
    }
    , []);

  const _onExportButtonClick = useCallback(
    (): void => {
      setIsBusy(true);
      setButtonId('export');
      exportAccount(address, pass)
        .then(({ exportedJson }) => {
          const blob = new Blob([JSON.stringify(exportedJson)], { type: 'application/json; charset=utf-8' });

          saveAs(blob, `${address}.json`);

          window.localStorage.setItem('popupNavigation', '/');
          onAction('/');
        })
        .catch((error: Error) => {
          console.error(error);
          setError(error.message);
          setIsBusy(false);
        });
    },
    [address, onAction, pass]
  );

  const handleExportPublicAndPrivateKey = useCallback((address: string, pass: string) => {
    exportAccountPrivateKey(address, pass)
      .then(({ privateKey: _privateKey, publicKey }) => {
        setPrivateKey(_privateKey);
        setPublicKey(publicKey);
        setIsBusy(false);
      })
      .catch((error: Error) => {
        console.error(error);
        setError(error.message);
        setIsBusy(false);
      });
  }, []);

  const _onExportPrivateButtonClick = useCallback(
    (): void => {
      setIsBusy(true);
      setButtonId('exportPrivate');
      setIsQr(false);

      if (!privateKey) {
        handleExportPublicAndPrivateKey(address, pass);
      } else {
        setIsBusy(false);
      }
    },
    [address, pass, privateKey, handleExportPublicAndPrivateKey]
  );

  const _onCopyPrivateKey = useCallback(
    () => show(t('Copied')),
    [show, t]
  );

  const _onExportQrButtonClick = useCallback(
    (): void => {
      setIsBusy(true);
      setButtonId('exportQr');
      setIsQr(true);
      setIsBusy(false);

      if (!privateKey) {
        handleExportPublicAndPrivateKey(address, pass);
      } else {
        setIsBusy(false);
      }
    },
    [address, pass, privateKey, handleExportPublicAndPrivateKey]
  );

  return (
    <>
      <Header
        isBusy={isBusy}
        showBackArrow
        showSubHeader
        subHeaderName={t<string>('Export account')}
      />
      <div className={className}>
        {_isAllAccount
          ? <div>
            <Warning>
              {t<string>('Account "All" doesn\'t support this action. Please switch to another account')}
            </Warning>

            <ActionBar className='export__action-bar'>
              <ActionText
                className='cancel-button'
                onClick={_goHome}
                text={t<string>('Cancel')}
              />
            </ActionBar>
          </div>
          : <div
            className={`account-info-container ${themeContext.id === 'dark' ? '-dark' : '-light'} export-account-wrapper`}
          >
            <AccountInfoEl
              address={address}
              type={currentAccount.account?.type}
            />
            <Warning className='export-warning'>
              {t<string>('You are exporting your account. Keep it safe and don\'t share it with anyone.')}
            </Warning>

            {!privateKey && <div className='export__password-area'>
              <InputWithLabel
                className='export__input-label'
                data-export-password
                disabled={isBusy}
                isError={pass.length < MIN_LENGTH || !!error}
                label={t<string>('password for this account')}
                onChange={onPassChange}
                type='password'
              />
              {error && (
                <Warning
                  isBelowInput
                  isDanger
                >
                  {error}
                </Warning>
              )}
            </div>}

            {privateKey && !isQr && <div className='export__private-key-area'>
              <Label label={t<string>('Private Key')}>
                <div className='private-key'>
                  <span className='key'>
                    {toShort(privateKey, 18, 18)}
                  </span>
                  <CopyToClipboard text={(privateKey && privateKey) || ''}>
                    <img
                      alt='copy'
                      className='private-key-copy-icon'
                      onClick={_onCopyPrivateKey}
                      src={cloneLogo}
                    />
                  </CopyToClipboard>
                </div>
              </Label>
            </div>}
            {privateKey && isQr && (
              <div className='qr-container'>
                <div className='qr-content'>
                  <QRCode
                    size={250}
                    value={qrData}
                  />
                </div>
              </div>
            )}

            <div className='export__action-area'>
              <Button
                className='export-button'
                isBusy={isBusy && buttonId === 'cancel'}
                isDisabled={isBusy}
                onClick={_goHome}
              >
                <span>{t<string>('Cancel')}</span>
              </Button>
              {(!privateKey || (privateKey && isQr)) &&
                <Button
                  className='export-button'
                  data-export-button
                  isBusy={isBusy && buttonId === 'exportPrivate'}
                  isDisabled={pass.length === 0 || !!error || isBusy}
                  onClick={_onExportPrivateButtonClick}
                >
                  { privateKey ? t<string>('Via Text') : t<string>('Private Key')}
                </Button>}
              {
                (privateKey && !isQr) &&
                <Button
                  className='export-button'
                  data-export-button
                  isBusy={isBusy && buttonId === 'exportQr'}
                  isDisabled={pass.length === 0 || !!error || isBusy}
                  onClick={_onExportQrButtonClick}
                >
                  {t<string>('Via QR')}
                </Button>
              }
              <Button
                className='export-button'
                data-export-button
                isBusy={isBusy && buttonId === 'export'}
                isDisabled={pass.length === 0 || !!error || isBusy}
                onClick={_onExportButtonClick}
              >
                {t<string>('JSON')}
              </Button>
            </div>
          </div>
        }

      </div>
    </>
  );
}

export default withRouter(styled(ExportAccount)(({ theme }: Props) => `
  margin: 0 15px;
  padding-top: 25px;

  .qr-container {
    display: flex;
    justify-content: center;
  }

  .qr-content {
    margin: 20px 0;
    border: 2px solid #fff;
    width: 254px;
    height: 254px;
  }

  .export__password-area {
    padding-top: 13px;
  }

  .export__private-key-area {
    padding-top: 22px;
    padding-bottom: 5px;
  }

  .export__private-key-area .private-key {
    display: flex;
    position: relative;
  }

  .export__private-key-area .private-key .key {
    flex: 1;
  }

  .disabled-btn {
    cursor: not-allowed;
    opacity: 0.5;
    pointer-events: none !important;
  }

  .export__action-area {
    display: flex;
    justify-content: center;
    align-items: center;
    padding-top: 10px;
    padding-bottom: 7px;
  }

  .export-account-wrapper {
    padding-bottom: 8px;
  }

  .export-button {
    flex: 1;
  }

  .export-button:first-child {
    margin-right: 8px;
    background-color: ${theme.buttonBackground1};

    span {
      color: ${theme.buttonTextColor2};
    }
  }

  .export-button:last-child {
    margin-left: 8px;
  }

  .export-warning {
    margin-top: 8px;
  }

  .export__action-bar {
    margin-top: 12px;
  }

  .export__input-label {
    margin-bottom: 10px;
  }

  .cancel-button {
    margin-top: 10px;
    margin: auto;
    > span {
      color: ${theme.buttonTextColor2};
      font-weight: 500;
      font-size: 16px;
      line-height: 26px;
  }
`));
