// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { KeyringPair$Json } from '@polkadot/keyring/types';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { AccountContext, ActionContext, InputWithLabel, InputFileWithLabel, Button, Address } from '../components';
import { u8aToString } from '@polkadot/util';
import styled from 'styled-components';
import { jsonRestore, jsonVerifyPassword, jsonVerifyFile } from '../messaging';

import { Header } from '../partials';

interface FileState {
  address: string | null;
  isFileValid: boolean;
  json: KeyringPair$Json | null;
}

// FIXME We want to display the decodeError
interface PassState {
  decodeError?: string | null;
  isPassValid: boolean;
  password: string;
}

const acceptedFormats = ['application/json', 'text/plain'].join(', ');

async function parseFile (file: Uint8Array): Promise<FileState> {
  try {
    const json = JSON.parse(u8aToString(file)) as KeyringPair$Json;
    const isFileValid = await jsonVerifyFile(json);
    const address = json.address;

    return { address, isFileValid, json };
  } catch (error) {
    console.error(error);
  }

  return { address: null, isFileValid: false, json: null };
}

export default function Upload (): React.ReactElement {
  const { accounts } = useContext(AccountContext);
  const onAction = useContext(ActionContext);
  const [isBusy, setIsBusy] = useState(false);
  const [{ address, isFileValid, json }, setJson] = useState<FileState>({ address: null, isFileValid: false, json: null });
  const [{ isPassValid, password }, setPass] = useState<PassState>({ isPassValid: false, password: '' });

  useEffect((): void => {
    !accounts.length && onAction();
  }, [accounts, onAction]);

  const _onChangePass = useCallback(
    (password: string): void => {
      jsonVerifyPassword(password)
        .then((isPassValid) => setPass({ isPassValid, password }))
        .catch(console.error);
    }, []
  );

  const _onChangeFile = useCallback(
    (file: Uint8Array): void => {
      parseFile(file)
        .then(setJson)
        .catch(console.error);
    }, []
  );

  const _onRestore = useCallback(
    (): void => {
      if (!json || !password) {
        return;
      }

      setIsBusy(true);

      jsonRestore(json, password)
        .then(({ error }): void => {
          if (error) {
            setIsBusy(false);
            setPass(({ password }) => ({ decodeError: error, isPassValid: false, password }));
          } else {
            onAction('/');
          }
        })
        .catch(console.error);
    },
    [json, onAction, password]
  );

  return (
    <>
      <HeaderWithSmallerMargin
        showBackArrow
        text='Restore from JSON'
      />
      <div>
        <Address
          address={(isFileValid && address) || null}
          name={(isFileValid && json?.meta.name as string) || null}
        />
        <InputFileWithLabel
          accept={acceptedFormats}
          isError={!isFileValid}
          label={'backup file'}
          onChange={_onChangeFile}
          withLabel
        />
        <InputWithLabel
          isError={!isPassValid}
          label='Password for this file'
          onChange={_onChangePass}
          type='password'
        />
        <Button
          isDisabled={!isFileValid || !isPassValid || isBusy}
          onClick={_onRestore}
        >
          Restore
        </Button>
      </div>
    </>
  );
}

const HeaderWithSmallerMargin = styled(Header)`
  margin-bottom: 15px;
`;
