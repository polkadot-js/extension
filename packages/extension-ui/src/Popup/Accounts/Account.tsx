// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { ActionBar, Address } from '../../components';
import { editAccount } from '../../messaging';
import { Name } from '../../partials';

type Props = {
  className?: string,
  address: string,
  name?: string | null,
  onAction: () => void
};

export default function Account ({ address, className, name, onAction }: Props) {
  const [isEditing, setEditing] = useState(false);
  const [editedname, setName] = useState(name);

  const _toggleEdit = (): void => {
    setEditing(!isEditing);
  };
  const _saveChanges = (): void => {
    if (editedname && editedname !== name) {
      editAccount(address, editedname)
        .then(onAction)
        .catch(console.error);
    }

    _toggleEdit();
  };

  return (
    <Address
      address={address}
      className={className}
      name={
        isEditing
          ? (
            <Name
              defaultValue={name}
              isFocussed
              label={null}
              onBlur={_saveChanges}
              onChange={setName}
            />
          )
          : name
      }
    >
      <ActionBar>
        <a onClick={_toggleEdit}>Edit</a>
        <Link to={`/account/forget/${address}`}>Forget</Link>
      </ActionBar>
    </Address>
  );
}
