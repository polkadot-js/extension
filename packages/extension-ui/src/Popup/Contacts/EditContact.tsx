// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useContext, useState } from 'react';
import { RouteComponentProps } from 'react-router';
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

  const [name, setName] = useState<string | null>(null);
  const [memo, setMemo] = useState<string | null>(null);

  const onNameChanged = (inputName: string) => {
    setName(inputName);
  };

  const onMemoChanged = (inputMemo: string) => {
    setMemo(inputMemo);
  };

  const _saveContact = () => {
    console.log('name: ', name);
    console.log('memo: ', memo);
  };

  const _goToContacts = useCallback(
    () => onAction('/contacts'),
    [onAction]
  );

  const _toggleDelete = () => {
    console.log('_toggleDelete');
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
            onChange={onNameChanged}></InputWithLabel>
        </div>

        <div>
          <text>Address</text>
          <InputWithLabel
            disabled
            value='5G9m5GUdXbdK6Yi78hV9pEuX66Fm3bpDeU3YvGF4od6pix6A'></InputWithLabel>
        </div>

        <div>
          <text>Memo</text>
          <InputWithLabel
            onChange={onMemoChanged}></InputWithLabel>
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
            style={{ margin: 'auto' }}
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
  }
`);
