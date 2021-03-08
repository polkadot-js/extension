// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import queryString from 'query-string';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router';
import store from 'store';
import styled from 'styled-components';

import { ActionBar, ActionContext, ActionText, Button, InputWithLabel } from '../../components';
import useTranslation from '../../hooks/useTranslation';
import { Header } from '../../partials';

interface Props extends RouteComponentProps<{address: string}>, ThemeProps {
  className?: string;
}

function EditContact ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);

  const [contactId, setContactId] = useState<string | null>(null);
  const [name, setName] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [memo, setMemo] = useState<string | null>(null);

  useEffect(() => {
    console.log('window.location.hash: ', window.location.hash);
    const params = window.location.hash.split('?');
    const contact = queryString.parse(params[1]);

    console.log('contact: ', contact);
    setContactId(contact.id);
    setName(contact.name);
    setMemo(contact.memo);
    setAddress(contact.address);
  }, []);

  const onAddressChanged = (inputAddress: string) => {
    setAddress(inputAddress);
  };

  const onNameChanged = (inputName: string) => {
    console.log('inputName: ', inputName);
    setName(inputName);
  };

  const onMemoChanged = (inputMemo: string) => {
    setMemo(inputMemo);
  };

  const _saveContact = useCallback(
    (): void => {
      const contacts = store.get('contacts') || [];
      const newContacts = contacts.map((item) => {
        if (String(item.id) === String(contactId)) {
          return {
            id: contactId,
            address,
            memo,
            name,
            network: item.network
          };
        }

        return item;
      });

      console.log('newContacts: ', newContacts);
      store.set('contacts', newContacts);
      _goToContacts();
    },
    [address, memo, name]
  );

  const _goToContacts = useCallback(
    () => onAction('/contacts'),
    [onAction]
  );

  const _toggleDelete = () => {
    console.log('_toggleDelete');
    const contacts = store.get('contacts') || [];
    const newContacts = contacts.filter((item) => String(item.id) !== String(contactId));

    store.set('contacts', newContacts);
    _goToContacts();
  };

  return (
    <>
      <Header
        backTo='/contacts'
        showBackArrow
        showContactDelete
        smallMargin
        text={t<string>('Edit Contact')}
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
          <text>Address</text>
          <InputWithLabel
            onChange={onAddressChanged}
            value={address}></InputWithLabel>
        </div>

        <div>
          <text>Memo</text>
          <InputWithLabel
            onChange={onMemoChanged}
            value={memo}></InputWithLabel>
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

export default styled(EditContact)(() => `
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
