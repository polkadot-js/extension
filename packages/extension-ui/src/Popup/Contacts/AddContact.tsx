// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import _ from 'lodash';
import queryString from 'query-string';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { RouteComponentProps } from 'react-router';
import styled from 'styled-components';

import { ApiPromise, WsProvider } from '@polkadot/api';
import { Contact, Identity } from '@polkadot/extension-base/background/types';
import { ContactsStore } from '@polkadot/extension-base/stores';
import { decodeAddress, encodeAddress } from '@polkadot/keyring';
import { hexToString, hexToU8a, isHex } from '@polkadot/util';

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

/**
 * format the identity response to identity object: { isBad, isGood, info... }
 * @param identity
 */
function formatIdentity (identity: Record<string, string>): Identity {
  if (_.isEmpty(identity)) {
    return {
      isBad: true,
      isGood: false,
      info: {}
    } as Identity;
  }

  const { info, judgements } = identity;
  const isKnownGood = judgements.some(([, judgement]) => Object.prototype.hasOwnProperty.call(judgement, 'Known Good'));
  const isReasonable = judgements.some(([, judgement]) => Object.prototype.hasOwnProperty.call(judgement, 'Reasonable'));
  const isLowQuality = judgements.some(([, judgement]) => Object.prototype.hasOwnProperty.call(judgement, 'Low Qualit'));
  const isErroneous = judgements.some(([, judgement]) => Object.prototype.hasOwnProperty.call(judgement, 'Erroneous'));

  return {
    isBad: isLowQuality || isErroneous,
    isGood: isKnownGood || isReasonable,
    info: {
      Display: info.display.Raw ? hexToString(info.display.Raw) : '',
      Legal: info.legal.Raw ? hexToString(info.legal.Raw) : '',
      Email: info.email.Raw ? hexToString(info.email.Raw) : '',
      Web: info.web.Raw ? hexToString(info.web.Raw) : '',
      Twitter: info.twitter.Raw ? hexToString(info.twitter.Raw) : '',
      Riot: info.riot.Raw ? hexToString(info.riot.Raw) : ''
    }
  } as Identity;
}

interface Chain {
  chain: string;
  genesisHash?: string;
  icon: string;
  ss58Format: number;
}

interface Props extends ThemeProps {
  className?: string;
}

function AddContact ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);

  const emptyIdentity: Identity = { isBad: true, isGood: false, info: {} };

  const [contactId, setContactId] = useState<string>('');
  const [name, setName] = useState<string>('');
  const [previousAddress, setPreviousAddress] = useState<string>('');
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

    if (!_.isEmpty(params)) {
      setContactId(params.id);
      setName(params.name);
      setNote(params.note);
      setPreviousAddress(params.address);
      setAddress(params.address);
      setNetwork(params.network);
      setIsEdit(params.isEdit);
    }
  }, []);

  const onNameChanged = (inputName: string) => {
    setName(inputName);
  };

  const onAddressChanged = (inputAddress: string) => {
    setAddress(inputAddress);
  };

  /**
   * Check the address network when address text input blur
   */
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

  const _goToDelete = useCallback(
    () => {
      const contact: Contact = {
        address,
        id: contactId || Date.now().toString(),
        note,
        name,
        network
      };

      const stringified = queryString.stringifyUrl({ url: 'delete-contact?', query: { contact: JSON.stringify(contact) } });

      onAction(stringified);
    },
    [address, note, name, network]
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
        showContactDelete={isEdit}
        smallMargin
        text={t<string>('New Contact')}
        toggleDelete={_goToDelete}
      />

      <div className={className}>
        <div>
          <text>Name</text>
          <InputWithLabel
            onChange={onNameChanged}
            value={name}></InputWithLabel>
        </div>

        <div>
          <text>Address{error && <text className='error-address'>{` (${error})`}</text>}{tips && <text className='tips'>{` (${tips})`}</text>}</text>
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
            textInputClassName='input-disabled'
            value={network}></InputWithLabel>
        </div>

        <div>
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
      </div>
    </>
  );
}

export default styled(AddContact)(() => `
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow-y: auto;

  div {
    display: flex;
    flex-direction: column;
  }

  .error-address {
    color: red;
  }

  .tips {
    color: rgb(159, 158, 153);
  }

  .save-button {
    margin-top: 20px;
    margin-bottom: 10px;
  }

  .disable-save-button {
    margin-top: 20px;
    margin-bottom: 10px;
    background: gray !important;
  }

  .cancel-action {
    margin-top: 6px;
    margin-bottom: 6px;
    margin: auto;
  }

  .input-disabled {
    border: 0;
  }
`);
