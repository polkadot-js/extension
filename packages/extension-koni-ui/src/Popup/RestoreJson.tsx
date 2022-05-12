// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ResponseJsonGetAccountInfo } from '@subwallet/extension-base/background/types';
import type { KeyringPair$Json } from '@polkadot/keyring/types';
import type { KeyringPairs$Json } from '@polkadot/ui-keyring/types';

import Header from '@subwallet/extension-koni-ui/partials/Header';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled, { ThemeContext } from 'styled-components';

import { u8aToString } from '@polkadot/util';

import { AccountContext, AccountInfoEl, ActionContext, Button, ButtonArea, Checkbox, InputFileWithLabel, InputWithLabel, Theme, Warning } from '../components';
import useTranslation from '../hooks/useTranslation';
import { batchRestoreV2, jsonGetAccountInfo, jsonRestoreV2 } from '../messaging';
import { DEFAULT_TYPE } from '../util/defaultType';
import { isKeyringPairs$Json } from '../util/typeGuards';

const acceptedFormats = ['application/json', 'text/plain'].join(', ');

interface Props {
  className?: string;
}

function Upload ({ className }: Props): React.ReactElement {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const [accountsInfo, setAccountsInfo] = useState<ResponseJsonGetAccountInfo[]>([]);
  const [isConnectWhenRestore, setConnectWhenRestore] = useState(true);
  const [password, setPassword] = useState<string>('');
  const [isFileError, setFileError] = useState(false);
  const [requirePassword, setRequirePassword] = useState(false);
  const [isPasswordError, setIsPasswordError] = useState(false);
  const themeContext = useContext(ThemeContext as React.Context<Theme>);
  // don't use the info from the file directly
  // rather use what comes from the background from jsonGetAccountInfo
  const [file, setFile] = useState<KeyringPair$Json | KeyringPairs$Json | undefined>(undefined);
  const isFirefox = window.localStorage.getItem('browserInfo') === 'Firefox';
  const isLinux = window.localStorage.getItem('osInfo') === 'Linux';

  useEffect((): void => {
    (isFirefox || isLinux) && window.localStorage.setItem('popupNavigation', '');
    !accounts.length && onAction();
  }, [accounts, isFirefox, isLinux, onAction]);

  const _onChangePass = useCallback(
    (pass: string): void => {
      setPassword(pass);
      setIsPasswordError(false);
    }, []
  );

  const _onChangeFile = useCallback(
    (file: Uint8Array): void => {
      setFileError(false);
      setIsPasswordError(false);
      setPassword('');
      setAccountsInfo(() => []);

      let json: KeyringPair$Json | KeyringPairs$Json | undefined;

      try {
        json = JSON.parse(u8aToString(file)) as KeyringPair$Json | KeyringPairs$Json;
        setFile(json);
      } catch (e) {
        console.error(e);
        setFileError(true);
      }

      if (json === undefined) {
        setFileError(true);

        return;
      }

      try {
        if (isKeyringPairs$Json(json)) {
          setRequirePassword(true);
          json.accounts.forEach((account) => {
            setAccountsInfo((old) => [...old, {
              address: account.address,
              genesisHash: account.meta.genesisHash,
              name: account.meta.name
            } as ResponseJsonGetAccountInfo]);
          });
        } else {
          setRequirePassword(true);
          jsonGetAccountInfo(json)
            .then((accountInfo) => setAccountsInfo((old) => [...old, accountInfo]))
            .catch((e) => {
              setFileError(true);
              console.error(e);
            });
        }
      } catch (e) {
        console.error(e);
        setFileError(true);
      }
    }, []
  );

  const _onRestore = useCallback(
    (): void => {
      if (!file) {
        return;
      }

      if (requirePassword && !password) {
        return;
      }

      setIsBusy(true);

      (isKeyringPairs$Json(file) ? batchRestoreV2(file, password, accountsInfo, isConnectWhenRestore) : jsonRestoreV2(file, password, accountsInfo[0].address, isConnectWhenRestore))
        .then(() => {
          window.localStorage.setItem('popupNavigation', '/');
          onAction('/');
        }).catch(
          (e) => {
            console.error(e);
            setIsBusy(false);
            setIsPasswordError(true);
          });
    },
    [accountsInfo, file, isConnectWhenRestore, onAction, password, requirePassword]
  );

  return (
    <>
      <Header
        isBusy={isBusy}
        showBackArrow
        showSubHeader
        smallMargin
        subHeaderName={t<string>('Restore from JSON')}
      />
      <div className={className}>
        <InputFileWithLabel
          accept={acceptedFormats}
          isError={isFileError}
          label={t<string>('IMPORT FROM POLKADOT.JS')}
          onChange={_onChangeFile}
          withLabel
        />
        {isFileError && (
          <Warning
            isDanger
          >
            {t<string>('Invalid Json file')}
          </Warning>
        )}
        {requirePassword && (
          <div>
            <InputWithLabel
              isError={isPasswordError}
              label={t<string>('Password for this file')}
              onChange={_onChangePass}
              type='password'
              value={password}
            />
            {isPasswordError && (
              <Warning
                className='restore-json-warning'
                isBelowInput
                isDanger
              >
                {t<string>('Unable to decode using the supplied passphrase')}
              </Warning>
            )}
          </div>
        )}

        <div className='restore-from-json-wrapper'>
          {accountsInfo.map(({ address, genesisHash, name, type = DEFAULT_TYPE }, index) => (
            <div
              className={`account-info-container ${themeContext.id === 'dark' ? '-dark' : '-light'} restore-json__account-info`}
              key={`${index}:${address}`}
            >
              <AccountInfoEl
                address={address}
                genesisHash={genesisHash}
                name={name}
                type={type}
              />
            </div>
          ))}
        </div>

        <Checkbox
          checked={isConnectWhenRestore}
          label={t<string>('Auto connect to all DApp after restore')}
          onChange={setConnectWhenRestore}
        />
        <ButtonArea className='restore-json-button-area'>
          <Button
            className='restoreButton'
            isBusy={isBusy}
            isDisabled={isFileError || isPasswordError}
            onClick={_onRestore}
          >
            {t<string>('Restore')}
          </Button>
        </ButtonArea>
      </div>
    </>
  );
}

export default styled(Upload)(({ theme }: ThemeProps) => `
  padding: 25px 15px 0;
  height: 100%;
  overflow-y: auto;
  .restore-from-json-wrapper {
    overflow: hidden;
    margin-top: 16px;
  }

  .restore-json__account-info {
    margin-bottom: 10px;
  }

  .restore-json-warning {
    margin-top: 10px;
  }

  .restore-json-button-area {
    bottom: 0;
    z-index: 1;
  }

  .input-file__sub-label {
    font-size: 15px;
    line-height: 26px;
    color: ${theme.textColor2};
    padding: 13px 0;
  }
`);
