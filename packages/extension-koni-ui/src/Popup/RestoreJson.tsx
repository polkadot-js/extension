// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type {ResponseJsonGetAccountInfo} from '@polkadot/extension-base/background/types';
import type {KeyringPair$Json} from '@polkadot/keyring/types';
import type {KeyringPairs$Json} from '@polkadot/ui-keyring/types';

import React, {useCallback, useContext, useEffect, useState} from 'react';
import styled from 'styled-components';
import {u8aToString} from '@polkadot/util';
import {AccountContext, ActionContext} from '../components';
import useTranslation from '../hooks/useTranslation';
import {batchRestore, jsonGetAccountInfo, jsonRestore} from '../messaging';
import {DEFAULT_TYPE} from '../util/defaultType';
import {isKeyringPairs$Json} from '../util/typeGuards';
import Header from "@polkadot/extension-koni-ui/partials/Header";
import Warning from "@polkadot/extension-koni-ui/components/Warning";
import InputWithLabel from "@polkadot/extension-koni-ui/components/InputWithLabel";
import Button from "@polkadot/extension-koni-ui/components/Button";
import InputFileWithLabel from "@polkadot/extension-koni-ui/components/InputFileWithLabel";
import AccountInfo from "@polkadot/extension-koni-ui/components/AccountInfo";
import ButtonArea from "@polkadot/extension-koni-ui/components/ButtonArea";

const acceptedFormats = ['application/json', 'text/plain'].join(', ');

interface Props {
  className?: string;
}

function Upload({className}: Props): React.ReactElement {
  const {t} = useTranslation();
  const {accounts} = useContext(AccountContext);
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const [accountsInfo, setAccountsInfo] = useState<ResponseJsonGetAccountInfo[]>([]);
  const [password, setPassword] = useState<string>('');
  const [isFileError, setFileError] = useState(false);
  const [requirePassword, setRequirePassword] = useState(false);
  const [isPasswordError, setIsPasswordError] = useState(false);
  // don't use the info from the file directly
  // rather use what comes from the background from jsonGetAccountInfo
  const [file, setFile] = useState<KeyringPair$Json | KeyringPairs$Json | undefined>(undefined);

  useEffect((): void => {
    !accounts.length && onAction();
  }, [accounts, onAction]);

  const _onChangePass = useCallback(
    (pass: string): void => {
      setPassword(pass);
      setIsPasswordError(false);
    }, []
  );

  const _onChangeFile = useCallback(
    (file: Uint8Array): void => {
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
        return;
      }

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

      (isKeyringPairs$Json(file) ? batchRestore(file, password, accountsInfo[0].address) : jsonRestore(file, password, accountsInfo[0].address))
        .then(() => {
          onAction('/');
        }).catch(
        (e) => {
          console.error(e);
          setIsBusy(false);
          setIsPasswordError(true);
        });
    },
    [file, onAction, password, requirePassword]
  );

  return (
    <>
      <Header
        showBackArrow
        smallMargin
        showSubHeader
        subHeaderName={t<string>('Restore from JSON')}
      />
      <div className={className}>
        <div className='restore-from-json-wrapper'>
          {accountsInfo.map(({address, genesisHash, name, type = DEFAULT_TYPE}, index) => (
            <AccountInfo
              address={address}
              genesisHash={genesisHash}
              key={`${index}:${address}`}
              name={name}
              type={type}
              className='account-info'
            />
          ))}
        </div>
        <InputFileWithLabel
          accept={acceptedFormats}
          isError={isFileError}
          label={t<string>('backup file')}
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
            />
            {isPasswordError && (
              <Warning
                isBelowInput
                isDanger
                className='restore-json-warning'
              >
                {t<string>('Unable to decode using the supplied passphrase')}
              </Warning>
            )}
          </div>
        )}
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

export default styled(Upload)`
  padding: 0 15px;
  height: 100%;
  overflow-y: auto;
  .restore-from-json-wrapper {
    max-height: 188px;
    overflow-y: auto;
  }

  .account-info {
    margin-bottom: 10px;
  }

  .restore-json-warning {
    margin-top: 10px;
  }

  .restore-json-button-area {
    bottom: 0;
  }
`;
