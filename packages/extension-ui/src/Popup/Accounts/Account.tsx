// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { OnActionFromCtx } from '../../components/types';

import React, { useState } from 'react';

import { ActionBar, Address, Link, withOnAction } from '../../components';
import { editAccount } from '../../messaging';
import { Name } from '../../partials';

type Props = {
  address: string,
  className?: string,
  onAction: OnActionFromCtx
};

function Account ({ address, className, onAction }: Props) {
  const [isEditing, setEditing] = useState(false);
  const [editedname, setName] = useState(null as string | null);

  const toggleEdit = (): void => {
    setEditing(!isEditing);
  };
  const saveChanges = (): void => {
    if (editedname && editedname !== name) {
      editAccount(address, editedname)
        .then(() => onAction())
        .catch(console.error);
    }

    toggleEdit();
  };

  return (
    <Address
      address={address}
      className={className}
      name={
        isEditing
          ? (
            <Name
              address={address}
              isFocussed
              label={null}
              onBlur={saveChanges}
              onChange={setName}
            />
          )
          : undefined
      }
    >
      <ActionBar>
        <Link onClick={toggleEdit}>Edit</Link>
        <Link to={`/account/forget/${address}`}>Forget</Link>
      </ActionBar>
    </Address>
  );
}

export default withOnAction(Account);
