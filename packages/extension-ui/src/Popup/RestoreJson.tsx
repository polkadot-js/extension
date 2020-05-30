// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { KeyringPair$Json } from '@polkadot/keyring/types';
import React, { useCallback, useContext, useState } from 'react';
import { ActionContext, InputWithLabel, InputFileWithLabel, Button, Address } from '../components';
import { u8aToString } from '@polkadot/util';
import styled from 'styled-components';
import { jsonRestore, jsonVerifyPassword, jsonVerifyFile } from '../messaging';

import { Header } from '../partials';

interface FileState {
  address: string | null;
  isFileValid: boolean;
  json: KeyringPair$Json | null;
}

interface PassState {
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
  const onAction = useContext(ActionContext);
  const [{ address, isFileValid, json }, setJson] = useState<FileState>({ address: null, isFileValid: false, json: null });
  const [{ isPassValid, password }, setPass] = useState<PassState>({ isPassValid: false, password: '' });

  const _onChangePass = useCallback(
    (password: string): void => {
      jsonVerifyPassword(password)
        .then((isPassValid) => setPass({ isPassValid, password }))
        .catch(console.error);
    }, []
  );

  const _onChangeFile = useCallback(
    async (file: Uint8Array): Promise<void> => {
      setJson(await parseFile(file));
    }, []
  );

  const _onRestore = useCallback(
    (): void => {
      if (!json || !password) {
        return;
      }

      jsonRestore(json, password)
        .then(({ error }): void => {
          if (error) {
            setPass(({ password }) => ({ isPassValid: false, password }));
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
        text='Restore Account from JSON'
      />
      <div>
        <Address
          address={isFileValid && address ? address : null}
          name={isFileValid && json ? json.meta.name as string : null}
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
          isDisabled={!isFileValid || !isPassValid}
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
