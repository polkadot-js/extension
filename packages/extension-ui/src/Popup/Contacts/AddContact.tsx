// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useContext, useState } from 'react';
import { RouteComponentProps } from 'react-router';
import styled from 'styled-components';

import { ActionBar, ActionContext, ActionText, Button, Dropdown, InputWithLabel } from '../../components';
import useGenesisHashOptions from '../../hooks/useGenesisHashOptions';
import useTranslation from '../../hooks/useTranslation';
import { Header } from '../../partials';

interface Props extends RouteComponentProps<{address: string}>, ThemeProps {
  className?: string;
}

function AddContact ({ className = '' }: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const onAction = useContext(ActionContext);
  const genesisOptions = useGenesisHashOptions();

  const [name, setName] = useState<string | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [memo, setMemo] = useState<string | null>(null);

  const onNameChanged = (inputName: string) => {
    setName(inputName);
  };

  const onAddressChanged = (inputAddress: string) => {
    setAddress(inputAddress);
  };

  const onMemoChanged = (inputMemo: string) => {
    setMemo(inputMemo);
  };

  const _onChangeGenesis = (selectedGenesis: string) => {
    console.log('selectedGenesis: ', selectedGenesis);
  };

  const _saveContact = () => {
    console.log('name: ', name);
    console.log('address: ', address);
    console.log('memo: ', memo);
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
            onChange={onAddressChanged}></InputWithLabel>
        </div>

        <div>
          <text>Memo</text>
          <InputWithLabel
            onChange={onMemoChanged}></InputWithLabel>
        </div>

        <div>
          <text>Network</text>
          <div className='menuItem'>
            <Dropdown
              className='genesisSelection'
              label=''
              onChange={_onChangeGenesis}
              options={genesisOptions}
              value={''}
            />
          </div>
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
