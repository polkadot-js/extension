// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { KeyringPair$Json } from '@polkadot/keyring/types';

import React, { useCallback, useContext, useEffect, useState } from 'react';
import styled from 'styled-components';
import { u8aToString } from '@polkadot/util';

import { AccountContext, ActionContext, InputWithLabel, InputFileWithLabel, Button, Address, Warning } from '../components';
import useTranslation from '../hooks/useTranslation';
import { jsonRestore, jsonGetAccountInfo } from '../messaging';
import { Header } from '../partials';
import { ResponseJsonGetAccountInfo } from '@polkadot/extension-base/background/types';

const acceptedFormats = ['application/json', 'text/plain'].join(', ');

interface Props {
  className?: string;
}

function Upload ({ className } : Props): React.ReactElement {
  const { t } = useTranslation();
  const { accounts } = useContext(AccountContext);
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const [{ address, genesisHash, name, type }, setAccountInfo] = useState<ResponseJsonGetAccountInfo>({ address: '', genesisHash: '', name: '' });
  const [password, setPassword] = useState<string>('');
  const [isFileError, setFileError] = useState(false);
  const [isPasswordError, setIsPasswordError] = useState(false);
  // don't use the info from the file directly
  // rather use what comes from the background from jsonGetAccountInfo
  const [file, setFile] = useState<KeyringPair$Json|undefined>(undefined);

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
      let json: KeyringPair$Json | undefined;

      try {
        json = JSON.parse(u8aToString(file)) as KeyringPair$Json;
        setFile(json);
      } catch (e) {
        console.error(e);
        setFileError(true);
      }

      json && jsonGetAccountInfo(json)
        .then((accountInfo : ResponseJsonGetAccountInfo) => setAccountInfo(accountInfo))
        .catch((e) => {
          setFileError(true);
          console.error(e);
        });
    }, []
  );

  const _onRestore = useCallback(
    (): void => {
      if (!file || !password) {
        return;
      }

      setIsBusy(true);

      jsonRestore(file, password)
        .then(() => { onAction('/'); })
        .catch((e) => {
          console.error(e);
          setIsBusy(false);
          setIsPasswordError(true);
        });
    },
    [file, onAction, password]
  );

  return (
    <>
      <Header
        showBackArrow
        smallMargin
        text={t<string>('Restore from JSON')}
      />
      <div className={className}>
        <div>
          <Address
            address={address}
            genesisHash={genesisHash}
            isEthereum={type === 'ethereum'}
            name={name}
          />
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
          >
            {t<string>('Unable to decode using the supplied passphrase')}
          </Warning>
        )}
        <Button
          className='restoreButton'
          isBusy={isBusy}
          isDisabled={isFileError || isPasswordError}
          onClick={_onRestore}
        >
          {t<string>('Restore')}
        </Button>
      </div>
    </>
  );
}

export default styled(Upload)`
  .restoreButton {
    margin-top: 6px;
  }
`;
