// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AccountJson } from '@polkadot/extension/background/types';

import React, { useContext, useState } from 'react';
import styled from 'styled-components';

import { ActionBar, ActionContext, Address, Link } from '../../components';
import { editAccount } from '../../messaging';
import { Name } from '../../partials';

interface Props extends AccountJson {
  address: string;
  className?: string;
}

function Account ({ address, className }: Props): React.ReactElement<Props> {
  const onAction = useContext(ActionContext);
  const [isEditing, setEditing] = useState(false);
  const [editedName, setName] = useState<string | null>(null);

  const _toggleEdit = (): void => setEditing(!isEditing);
  const _saveChanges = (): void => {
    if (editedName && editedName !== name) {
      editAccount(address, editedName)
        .then((): void => onAction())
        .catch((error: Error) => console.error(error));
    }

    _toggleEdit();
  };

  return (
    <Address
      address={address}
      className={className}
      name={editedName}
    >
      {isEditing && (
        <Name
          address={address}
          className='edit-name'
          isFocussed
          label={null}
          onBlur={_saveChanges}
          onChange={setName}
        />
      )}
      <ActionBar>
        <Link onClick={_toggleEdit}>Edit</Link>
        <Link to={`/account/export/${address}`}>Export</Link>
        <Link to={`/account/forget/${address}`}>Forget</Link>
      </ActionBar>
    </Address>
  );
}

export default styled(Account)`
  .edit-name {
    left: 3rem;
    position: absolute;
    right: 0.75rem;
    top: -0.5rem;
  }
`;
