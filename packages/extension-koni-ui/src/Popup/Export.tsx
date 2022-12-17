// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import { faAngleDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import cloneLogo from '@subwallet/extension-koni-ui/assets/clone.svg';
import download from '@subwallet/extension-koni-ui/assets/icon/download.svg';
import Checkbox from '@subwallet/extension-koni-ui/components/Checkbox';
import TextField from '@subwallet/extension-koni-ui/components/Field/TextField';
import useToast from '@subwallet/extension-koni-ui/hooks/useToast';
import Header from '@subwallet/extension-koni-ui/partials/Header';
import { RootState } from '@subwallet/extension-koni-ui/stores';
import { isAccountAll, toShort } from '@subwallet/extension-koni-ui/util';
import { KeyringPair$Json } from '@subwallet/keyring/types';
import { saveAs } from 'file-saver';
import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import QRCode from 'react-qr-code';
import { useSelector } from 'react-redux';
import { RouteComponentProps, withRouter } from 'react-router';
import styled from 'styled-components';

import { AccountContext, AccountInfoEl, ActionContext, Button, InputWithLabel, Warning } from '../components';
import useTranslation from '../hooks/useTranslation';
import { exportAccount, exportAccountPrivateKey, keyringExportMnemonic } from '../messaging';

const MIN_LENGTH = 6;

interface Props extends RouteComponentProps<{ address: string }>, ThemeProps {
  className?: string;
}

interface ExportItem {
  isSelected: boolean;
  isShow: boolean;
  label: string;
  key: string;
}

const defaultItemState: Omit<ExportItem, 'key' | 'label'> = {
  isSelected: false,
  isShow: false
};

const defaultState: Record<string, ExportItem> = {
  privateKey: {
    ...defaultItemState,
    key: 'privateKey',
    label: 'Private Key'
  },
  qrCode: {
    ...defaultItemState,
    key: 'qrCode',
    label: 'QR Code'
  },
  mnemonic: {
    ...defaultItemState,
    key: 'mnemonic',
    label: 'Seed Phrase'
  },
  jsonFile: {
    ...defaultItemState,
    key: 'jsonFile',
    label: 'File JSON'
  }
};

const copyToClipboard = (value: string) => {
  navigator.clipboard.writeText(value).then().catch(console.error);
};

function ExportAccount ({ className, match: { params: { address } } }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();

  const onAction = useContext(ActionContext);
  const accounts = useContext(AccountContext);

  const [isBusy, setIsBusy] = useState(false);
  const [pass, setPass] = useState('');

  const [isExported, setIsExported] = useState(false);
  const [exportState, setExportState] = useState<Record<string, ExportItem>>({ ...defaultState });

  const [privateKey, setPrivateKey] = useState<string>('');
  const [publicKey, setPublicKey] = useState<string>('');
  const [jsonData, setJsonData] = useState<null | KeyringPair$Json>(null);
  const [mnemonic, setMnemonic] = useState<string>('');

  const { show } = useToast();
  const [error, setError] = useState('');
  const _isAllAccount = isAccountAll(address);
  const currentAccount = useSelector((state: RootState) => state.currentAccount);

  const accountName = useMemo((): string | undefined => {
    return accounts.accounts.find((acc) => acc.address === address)?.name;
  }, [accounts, address]);

  const isValidAccount = useMemo((): boolean => {
    return !!accounts.accounts.find((acc) => acc.address === address);
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
      if (jsonData) {
        const blob = new Blob([JSON.stringify(jsonData)], { type: 'application/json; charset=utf-8' });

        saveAs(blob, `${address}.json`);
      }
    },
    [address, jsonData]
  );

  const renderCopyIcon = useCallback(() => {
    return (
      <img
        alt='copy'
        src={cloneLogo}
      />
    );
  }, []);

  const renderDownloadIcon = useCallback(() => {
    return (
      <img
        alt='download'
        src={download}
      />
    );
  }, []);

  const toggleIsShow = useCallback((key: string): () => void => {
    return () => {
      setExportState((prevState) => {
        const result = { ...prevState };

        result[key].isShow = !result[key].isShow;

        return result;
      });
    };
  }, []);

  const _onCopyPrivateKey = useCallback(
    () => {
      copyToClipboard(privateKey);
      show(t('Copied'));
    },
    [show, t, privateKey]
  );

  const _onCopyMnemonic = useCallback(
    () => {
      copyToClipboard(mnemonic);
      show(t('Copied'));
    },
    [show, t, mnemonic]
  );

  const onSubmit = useCallback(async () => {
    if (pass && Object.values(exportState).some((i) => i.isSelected)) {
      await new Promise<void>((resolve) => {
        setIsBusy(true);
        setTimeout(() => {
          resolve();
        }, 200);
      });

      try {
        if (exportState.privateKey.isSelected || exportState.qrCode.isSelected) {
          const res = await exportAccountPrivateKey(address, pass);

          setPrivateKey(res.privateKey);
          setPublicKey(res.publicKey);
        }

        if (exportState.mnemonic.isSelected) {
          const res = await keyringExportMnemonic({ address, password: pass });

          setMnemonic(res.result);
        }

        if (exportState.mnemonic.isSelected) {
          const res = await exportAccount(address, pass);

          setJsonData(res.exportedJson);
        }

        setIsBusy(false);
        setIsExported(true);
      } catch (error) {
        console.error(error);
        setError((error as Error).message);
        setIsBusy(false);
      }
    }
  }, [pass, exportState, address]);

  const onChangeSelected = useCallback((key: string): (value: boolean) => void => {
    return (value: boolean) => {
      setExportState((prevState) => {
        const result = { ...prevState };

        result[key].isSelected = value;

        return result;
      });
    };
  }, []);

  useEffect(() => {
    if (!isValidAccount) {
      window.localStorage.setItem('popupNavigation', '/');
      onAction('/');
    }
  }, [isValidAccount, onAction]);

  if (_isAllAccount) {
    return (
      <div className={className}>
        <Header
          isBusy={isBusy}
          onCancel={_goHome}
          showBackArrow
          showCancelButton={true}
          showSubHeader
          subHeaderName={t<string>('Export account')}
        />
        <div className='body-container'>
          <Warning className='export-warning'>
            {t<string>('Account "All" doesn\'t support this action. Please switch to another account')}
          </Warning>
          <Button
            className='cancel-button mt-16'
            onClick={_goHome}
          >
            Cancel
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Header
        isBusy={isBusy}
        onCancel={_goHome}
        showBackArrow
        showCancelButton={true}
        showSubHeader
        subHeaderName={t<string>('Export account')}
      />
      <div className='body-container'>
        <AccountInfoEl
          address={address}
          type={currentAccount.account?.type}
        />
        <Warning className='export-warning'>
          {t<string>('You are exporting your account. Keep it safe and don\'t share it with anyone.')}
        </Warning>
        {
          !isExported &&
          (
            <>
              {
                Object.entries(exportState).map(([key, { isSelected, label }]) => {
                  return (
                    <div
                      className=''
                      key={key}
                    >
                      <Checkbox
                        checked={isSelected}
                        label={`Export ${label}`}
                        onChange={onChangeSelected(key)}
                      />
                    </div>
                  );
                })
              }
              <div className='export__password-area'>
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
              </div>
            </>
          )
        }
        {
          isExported &&
          (
            <>
              {
                (exportState.privateKey.isSelected && privateKey) && (
                  <div className='result-container'>
                    <div
                      className='result-info'
                      onClick={toggleIsShow('privateKey')}
                    >
                      <div className='result-label'>{exportState.privateKey.label}</div>
                      <FontAwesomeIcon
                        className='result-icon'
                        icon={faAngleDown}
                        rotate={exportState.privateKey.isShow ? 180 : 0 }
                      />
                    </div>
                    {
                      exportState.privateKey.isShow && (
                        <div className='result-content'>
                          <TextField
                            onClick={_onCopyPrivateKey}
                            renderIcon={renderCopyIcon}
                            value={toShort(privateKey, 18, 18)}
                          />
                        </div>
                      )
                    }
                  </div>
                )
              }
              {
                (exportState.qrCode.isSelected && privateKey && publicKey) && (
                  <div className='result-container'>
                    <div
                      className='result-info'
                      onClick={toggleIsShow('qrCode')}
                    >
                      <div className='result-label'>{exportState.qrCode.label}</div>
                      <FontAwesomeIcon
                        className='result-icon'
                        icon={faAngleDown}
                        rotate={exportState.qrCode.isShow ? 180 : 0 }
                      />
                    </div>
                    {
                      exportState.qrCode.isShow && (
                        <div className='qr-container'>
                          <div className='qr-content'>
                            <QRCode
                              size={250}
                              value={qrData}
                            />
                          </div>
                        </div>
                      )
                    }
                  </div>
                )
              }
              {
                (exportState.mnemonic.isSelected && mnemonic) && (
                  <div className='result-container'>
                    <div
                      className='result-info'
                      onClick={toggleIsShow('mnemonic')}
                    >
                      <div className='result-label'>{exportState.mnemonic.label}</div>
                      <FontAwesomeIcon
                        className='result-icon'
                        icon={faAngleDown}
                        rotate={exportState.mnemonic.isShow ? 180 : 0 }
                      />
                    </div>
                    {
                      exportState.mnemonic.isShow && (
                        <div className='result-content'>
                          <TextField
                            onClick={_onCopyMnemonic}
                            renderIcon={renderCopyIcon}
                            value={mnemonic || 'Seed phrase'}
                          />
                        </div>
                      )
                    }
                  </div>
                )
              }
              {
                (exportState.jsonFile.isSelected && jsonData) && (
                  <div className='result-container'>
                    <div
                      className='result-info'
                      onClick={toggleIsShow('jsonFile')}
                    >
                      <div className='result-label'>{exportState.jsonFile.label}</div>
                      <FontAwesomeIcon
                        className='result-icon'
                        icon={faAngleDown}
                        rotate={exportState.jsonFile.isShow ? 180 : 0 }
                      />
                    </div>
                    {
                      exportState.jsonFile.isShow && (
                        <div className='result-content'>
                          <TextField
                            onClick={_onExportButtonClick}
                            renderIcon={renderDownloadIcon}
                            value={'Download JSON file'}
                          />
                        </div>
                      )
                    }
                  </div>
                )
              }
            </>
          )
        }
      </div>
      <div className='footer-container'>
        {
          !isExported && (
            <>
              <Button
                className='cancel-button'
                isDisabled={isBusy}
                onClick={_goHome}
              >
                {t('Cancel')}
              </Button>
              <Button
                isBusy={isBusy}
                isDisabled={pass.length < MIN_LENGTH || !!error || !Object.values(exportState).some((i) => i.isSelected)}
                onClick={onSubmit}
              >
                {t('Export')}
              </Button>
            </>
          )
        }
        {
          isExported && (
            <Button
              isDisabled={isBusy}
              onClick={_goHome}
            >
              {t('Done')}
            </Button>
          )
        }
      </div>
    </div>
  );
}

export default withRouter(styled(ExportAccount)(({ theme }: Props) => `
  display: flex;
  flex-direction: column;
  position: relative;
  height: 100%;

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

  .body-container {
    flex: 1;
    overflow: auto;
    padding: 20px 22px;

    .account-info-row {
      height: 54px;
    }

    .result-container {
      margin-top: 12px;

      .result-info {
        cursor: pointer;
        display: flex;
        flex-direction: row;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 8px;

        .result-label {
          font-style: normal;
          font-weight: 400;
          font-size: 15px;
          line-height: 26px;
          color: ${theme.textColor2};
        }

        .result-icon {
          color: ${theme.textColor2};
          margin-left: 12px;
        }
      }



    }
  }

  .footer-container {
    padding: 20px 22px;
    border-top: 1px solid ${theme.borderColor2};

    display: flex;
    flex-direction: row;
    gap: 16px;
  }

  .mt-16 {
    margin-top: 16px !important;
  }

  .cancel-button {
    background-color: ${theme.buttonBackground1};
    color: ${theme.buttonTextColor2};
  }

  .export__password-area {
    margin-top: 4px;
  }

  .export-warning {
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
