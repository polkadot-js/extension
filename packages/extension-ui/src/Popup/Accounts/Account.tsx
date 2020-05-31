// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AccountJson } from '@polkadot/extension-base/background/types';
import { ThemeProps } from '../../types';

import React, { useCallback, useContext, useMemo, useState } from 'react';
import styled from 'styled-components';

import { ActionContext, Address, Link } from '../../components';
import { editAccount } from '../../messaging';
import { Name } from '../../partials';

interface Props extends AccountJson {
  className?: string;
  parentName?: string;
}

function Account ({ address, className, isExternal, parentName, suri }: Props): React.ReactElement<Props> {
  const onAction = useContext(ActionContext);
  const [isEditing, setEditing] = useState(false);
  const [editedName, setName] = useState<string | null>(null);

  const _toggleEdit = useCallback((): void => setEditing(!isEditing), [isEditing]);
  const _saveChanges = useCallback((): void => {
    if (editedName && editedName !== name) {
      editAccount(address, editedName)
        .then(() => onAction())
        .catch(console.error);
    }

    _toggleEdit();
  }, [editedName, address, _toggleEdit, onAction]);

  const _actions = useMemo(() => (
    <>
      <Link
        className='menuItem'
        onClick={_toggleEdit}
      >
        Rename
      </Link>
      {!isExternal && (
        <Link
          className='menuItem'
          to={`/account/derive/${address}/locked`}
        >
          Derive New Account
        </Link>
      )}
      <div className='divider' />
      {!isExternal && (
        <Link
          className='menuItem'
          isDanger
          to={`/account/export/${address}`}
        >
          Export Account
        </Link>
      )}
      <Link
        className='menuItem'
        isDanger
        to={`/account/forget/${address}`}
      >
        Forget Account
      </Link>
    </>
  ), [_toggleEdit, address, isExternal]);

  return (
    <div className={className}>
      <Address
        actions={_actions}
        address={address}
        className='address'
        name={editedName}
        parentName={parentName}
        suri={suri}
      >
        {isEditing && (
          <Name
            address={address}
            className='editName'
            isFocused
            label={' '}
            onBlur={_saveChanges}
            onChange={setName}
          />
        )}
      </Address>
    </div>
  );
}

export default styled(Account)(({ theme }: ThemeProps) => `
  .address {
    margin-bottom: 8px;
  }

  .divider {
    padding-top: 16px;
    margin-bottom: 16px;
    border-bottom: 1px solid ${theme.inputBorderColor};
  }

  .editName {
    position: absolute;
    flex: 1;
    left: 80px;
    top: 6px;
    width: 315px;
  }

  .menuItem {
    border-radius: 8px;
    display: block;
    font-weight: 600;
    font-size: 15px;
    line-height: 20px;
    padding: 4px 16px;
  }
`);
