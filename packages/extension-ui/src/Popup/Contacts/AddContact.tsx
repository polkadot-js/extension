// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import queryString from 'query-string';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router';
import styled from 'styled-components';

import { Contact } from '@polkadot/extension-base/background/types';
import { ContactsStore } from '@polkadot/extension-base/stores';
import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { hexToU8a, isHex } from '@polkadot/util';

import { ActionBar, ActionContext, ActionText, Button, InputWithLabel } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { Header } from '../../partials';
import chains from '../../util/chains';

const bs58 = require('bs58');

/**
 * Get address prefix
 * Polkadot: 0
 * Kusama: 2
 * Substrate: 42
 * others: ...
 * @param address
 */
function getAddressPrefix (address: string): number {
  const bytes = bs58.decode(address);
  const hex = bytes.toString('hex');
  const prefix = `${hex[0]}${hex[1]}`;

  return parseInt(prefix, 16);
}

/**
 * Check address is valid address
 * @param address
 */
function isValidAddressPolkadotAddress (address: string): boolean {
  try {
    encodeAddress(
      isHex(address)
        ? hexToU8a(address)
        : decodeAddress(address)
    );

    return true;
  } catch (error) {
    return false;
  }
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

  const [contactId, setContactId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [address, setAddress] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [network, setNetwork] = useState<string>('Unknow');
  const [isEdit, setIsEdit] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [allChains, setAllChains] = useState<Chain[]>([]);

  useEffect(() => {
    setAllChains([{
      chain: 'Allow user on any chain',
      genesisHash: '',
      icon: 'substrate',
      ss58Format: 42
    }, ...chains]);
  }, []);

  useEffect(() => {
    const path = window.location.hash.split('?');
    const params = queryString.parse(path[1]);

    setContactId(params.id);
    setName(params.name);
    setNote(params.note);
    setAddress(params.address);
    setNetwork(params.network);
    setIsEdit(params.isEdit);
  }, []);

  const onNameChanged = (inputName: string) => {
    setName(inputName);
  };

  const onAddressChanged = (inputAddress: string) => {
    setAddress(inputAddress);
  };

  const onAddressBlur = () => {
    const isValidAddress = isValidAddressPolkadotAddress(address);

    if (isValidAddress) {
      const prefix = getAddressPrefix(address);
      const chain = allChains.find((chain) => chain.ss58Format === prefix);

      setNetwork(chain?.chain);
      setError('');
    } else {
      setError('Invalid address');
    }
  };

  const onNoteChanged = (inputNote: string) => {
    setNote(inputNote);
  };

  const _saveContact = useCallback(
    (): void => {
      const contact: Contact = {
        address,
        id: contactId || Date.now().toString(),
        note,
        name,
        network
      };

      ContactsStore.insert(contact);

      _goToContacts();
    },
    [address, note, name, network]
  );

  const _toggleDelete = () => {
    const contact: Contact = {
      address,
      id: contactId || Date.now().toString(),
      note,
      name,
      network
    };

    ContactsStore.delete(contact);

    _goToContacts();
  };

  const _goToContacts = useCallback(
    () => onAction('/contacts'),
    [onAction]
  );

  return (
    <>
      <Header
        backTo='/contacts'
        showBackArrow
        showContactDelete={isEdit}
        smallMargin
        text={t<string>('New Contact')}
        toggleDelete={_toggleDelete}
      />

      <div className={className}>
        <div>
          <text>Name</text>
          <InputWithLabel
            onChange={onNameChanged}
            value={name}></InputWithLabel>
        </div>

        <div>
          <text>Address{error && <text className='error-address'>{` (${error})`}</text>}</text>
          <InputWithLabel
            onBlur={onAddressBlur}
            onChange={onAddressChanged}
            value={address}></InputWithLabel>
        </div>

        <div>
          <text>Note(Optional)</text>
          <InputWithLabel
            onChange={onNoteChanged}
            value={note}></InputWithLabel>
        </div>

        <div>
          <text>Network</text>
          <InputWithLabel
            disabled
            textInputClassName='network'
            value={network}></InputWithLabel>
        </div>

        <Button
          className={`${address && name && !error ? 'save-button' : 'disable-save-button'}`}
          isDisabled={!(address && name && !error)}
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

  .error-address {
    color: red;
  }

  .save-button {
    margin-top: 20px;
  }

  .disable-save-button {
    margin-top: 20px;
    background: gray !important;
  }

  .cancel-action {
    margin-top: 6px;
    margin: auto;
  }

  .network {
    border: 0;
  }
`);
