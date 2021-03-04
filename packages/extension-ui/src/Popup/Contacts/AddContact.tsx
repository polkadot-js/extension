// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useContext, useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router';
import styled from 'styled-components';

import { ActionBar, ActionContext, ActionText, Button, InputWithLabel } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { addContact } from '../../messaging';
import { Header } from '../../partials';
import chains from '../../util/chains';

const bs58 = require('bs58');

function getAddressPrefix (address: string): number {
  const bytes = bs58.decode(address);
  const hex = bytes.toString('hex');
  const prefix = `${hex[0]}${hex[1]}`;

  return parseInt(prefix, 16);
}

interface Chain {
  chain: string;
  genesisHash?: string;
  icon: string;
  ss58Format: number;
}

interface Props extends RouteComponentProps<{address: string}>, ThemeProps {
  className?: string;
}

function AddContact ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);

  const [name, setName] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [memo, setMemo] = useState<string | null>(null);
  const [network, setNetwork] = useState<string>('Unknow');
  const [allChains, setAllChains] = useState<Chain[]>([]);

  useEffect(() => {
    setAllChains([{
      chain: 'Allow user on any chain',
      genesisHash: '',
      icon: 'substrate',
      ss58Format: 42
    }, ...chains]);
  }, []);

  const onNameChanged = (inputName: string) => {
    setName(inputName);
  };

  const onAddressChanged = (inputAddress: string) => {
    setAddress(inputAddress);
  };

  const onAddressBlur = () => {
    const prefix = getAddressPrefix(address);
    const chain = allChains.find((chain) => chain.ss58Format === prefix);

    setNetwork(chain?.chain);
  };

  const onMemoChanged = (inputMemo: string) => {
    setMemo(inputMemo);
  };

  const _saveContact = useCallback(
    (): void => {
      addContact &&
      addContact(address, memo, name, '')
        .catch(console.error);
    },
    [addContact, address, memo, name]
  );

  const _goToContacts = useCallback(
    () => onAction('/contacts'),
    [onAction]
  );

  return (
    <>
      <Header
        backTo='/contacts'
        showBackArrow
        smallMargin
        text={t<string>('New Contact')}
      />

      <div className={className}>
        <div>
          <text>Name</text>
          <InputWithLabel
            onChange={onNameChanged}></InputWithLabel>
        </div>

        <div>
          <text>Address</text>
          <InputWithLabel
            onBlur={onAddressBlur}
            onChange={onAddressChanged}></InputWithLabel>
        </div>

        <div>
          <text>Memo</text>
          <InputWithLabel
            onChange={onMemoChanged}></InputWithLabel>
        </div>

        <div>
          <text>Network</text>
          <InputWithLabel
            disabled
            value={network}></InputWithLabel>
        </div>

        <Button
          className='save-button'
          onClick={_saveContact}
        >
          {t<string>('Save')}
        </Button>
        <ActionBar className='cancel-action'>
          <ActionText
            onClick={_goToContacts}
            text={t<string>('Cancel')}
          />
        </ActionBar>
      </div>
    </>
  );
}

export default styled(AddContact)(() => `
  display: flex;
  flex-direction: column;

  div {
    display: flex;
    flex-direction: column;
  }

  .save-button {
    margin-top: 20px;
  }

  .cancel-action {
    margin-top: 6px;
    margin: auto;
  }
`);
