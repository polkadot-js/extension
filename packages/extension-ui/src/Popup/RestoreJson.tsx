// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { KeyringPair$Json } from '@polkadot/keyring/types';
import React, { useCallback, useState } from 'react';
import { InputWithLabel, InputFileWithLabel, Button, Address } from '../components';
import { u8aToString } from '@polkadot/util';
import styled from 'styled-components';
import { jsonRestore, jsonVerifyPassword, jsonVerifyFile } from '../messaging';

import { Header } from '../partials';

type Props = {};

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
    const json = JSON.parse(u8aToString(file));
    const isFileValid = await jsonVerifyFile(json);
    const address = json.address;

    return { address, isFileValid, json };
  } catch (error) {
    console.error(error);
  }

  return { address: null, isFileValid: false, json: null };
}

export default function Upload (): React.ReactElement<Props> {
  const [{ address, isFileValid, json }, setJson] = useState<FileState>({ address: null, isFileValid: false, json: null });
  const [{ isPassValid, password }, setPass] = useState<PassState>({ isPassValid: false, password: '' });
  const [message, setMessage] = useState<string>('');

  const _onChangePass = useCallback(
    async (password: string): Promise<void> => {
      const isPassValid = await jsonVerifyPassword(password);

      setPass({ isPassValid, password });
    }, []
  );

  const _onChangeFile = useCallback(
    async (file: Uint8Array): Promise<void> => {
      setJson(await parseFile(file));
    }, []
  );

  const _onRestore = useCallback(
    async (): Promise<void> => {
      if (!json || !password) { return; }

      setMessage((await jsonRestore(json, password)).message);
    },
    [json, password]
  );

  return (
    <>
      <HeaderWithSmallerMargin
        text='Restore Account from JSON'
      />
      <div>
        <Address
          address={isFileValid && address ? address : null}
          name={isFileValid && json ? json.meta.name : null}
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
        {message}
      </div>
    </>
  );
}

const HeaderWithSmallerMargin = styled(Header)`
  margin-bottom: 15px;
`;
