// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import React, { useState } from 'react';
import { Link } from 'react-router-dom';

import { ActionBar, Address } from '../../components';
import { ActionContext } from '../../components/contexts';
import { editAccount } from '../../messaging';
import { Name } from '../../partials';

type Props = {
  className?: string,
  address: string
};

export default function Account ({ address, className }: Props) {
  const [isEditing, setEditing] = useState(false);
  const [editedname, setName] = useState(null as string | null);

  const toggleEdit = (): void => {
    setEditing(!isEditing);
  };
  const saveChanges = (onAction: () => void) =>
    (): void => {
      if (editedname && editedname !== name) {
        editAccount(address, editedname)
          .then(() => onAction())
          .catch(console.error);
      }

      toggleEdit();
    };

  return (
    <ActionContext.Consumer>
      {(onAction) => (
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
                  onBlur={saveChanges(onAction)}
                  onChange={setName}
                />
              )
              : undefined
          }
        >
          <ActionBar>
            <a onClick={toggleEdit}>Edit</a>
            <Link to={`/account/forget/${address}`}>Forget</Link>
          </ActionBar>
        </Address>
      )}
    </ActionContext.Consumer>
  );
}
