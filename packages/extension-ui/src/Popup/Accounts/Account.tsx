// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AccountJson } from '@polkadot/extension-base/background/types';
import { ThemeProps } from '../../types';

import React, { useCallback, useContext, useMemo, useState } from 'react';
import styled from 'styled-components';
import genesisOptions from '@polkadot/extension-chains/genesisHashes';

import { ActionContext, Address, Checkbox, Dropdown, Link } from '../../components';
import { editAccount, showAccount, tieAccount } from '../../messaging';
import { Name } from '../../partials';

interface Props extends AccountJson {
  className?: string;
  parentName?: string;
}

function Account ({ address, className, genesisHash, isExternal, isHidden, parentName, suri }: Props): React.ReactElement<Props> {
  const onAction = useContext(ActionContext);
  const [isEditing, setEditing] = useState(false);
  const [editedName, setName] = useState<string | null>(null);

  const _onChangeGenesis = useCallback(
    (genesisHash?: string | null): void => {
      tieAccount(address, genesisHash || null)
        .catch(console.error);
    },
    [address]
  );

  const _toggleEdit = useCallback(
    (): void => setEditing(!isEditing),
    [isEditing]
  );

  const _saveChanges = useCallback(
    (): void => {
      if (editedName && editedName !== name) {
        editAccount(address, editedName)
          .then(() => onAction())
          .catch(console.error);
      }

      _toggleEdit();
    },
    [editedName, address, _toggleEdit, onAction]
  );

  const _toggleVisibility = useCallback(
    (): void => {
      showAccount(address, isHidden || false)
        .catch(console.error);
    },
    [address, isHidden]
  );

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
      <div className='divider' />
      <Checkbox
        checked={!isHidden}
        className='menuItem'
        label='Visible (always inject)'
        onClick={_toggleVisibility}
      />
      <Dropdown
        className='menuItem'
        label=''
        onChange={_onChangeGenesis}
        options={genesisOptions}
        value={genesisHash || null}
      />
    </>
  ), [_onChangeGenesis, _toggleEdit, _toggleVisibility, address, genesisHash, isExternal, isHidden]);

  return (
    <div className={className}>
      <Address
        actions={_actions}
        address={address}
        className='address'
        genesisHash={genesisHash}
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
    margin: 0;
    min-width: 13rem;
    padding: 4px 16px;
  }
`);
