// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountJson } from '@polkadot/extension-base/background/types';

import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';

import { canDerive } from '@polkadot/extension-base/utils';
import { ThemeProps } from '@polkadot/extension-ui/types';

import { AccountContext, Address, Checkbox, Dropdown, Link, MenuDivider } from '../../components';
import { ALEPH_ZERO_GENESIS_HASH } from '../../constants';
import useGenesisHashOptions from '../../hooks/useGenesisHashOptions';
import useTranslation from '../../hooks/useTranslation';
import { editAccount, tieAccount } from '../../messaging';
import { Name } from '../../partials';

interface Props extends AccountJson, ThemeProps {
  className?: string;
  parentName?: string;
  withCheckbox?: boolean;
  withMenu?: boolean;
  checkBoxOnChange?: (value: boolean) => void;
}

interface EditState {
  isEditing: boolean;
  toggleActions: number;
}

function Account({
  address,
  checkBoxOnChange,
  className,
  genesisHash,
  isExternal,
  isHardware,
  isHidden,
  name,
  parentName,
  suri,
  type,
  withCheckbox = false,
  withMenu = true
}: Props): React.ReactElement<Props> {
  const { t } = useTranslation();
  const [{ isEditing, toggleActions }, setEditing] = useState<EditState>({ isEditing: false, toggleActions: 0 });
  const [editedName, setName] = useState<string | undefined | null>(name);
  const [checked, setChecked] = useState(false);
  const genesisOptions = useGenesisHashOptions();
  const { selectedAccounts = [], setSelectedAccounts } = useContext(AccountContext);
  const isSelected = useMemo(() => selectedAccounts?.includes(address) || false, [address, selectedAccounts]);

  useEffect(() => {
    setChecked(isSelected);
  }, [isSelected]);

  const _onCheckboxChange = useCallback(() => {
    if (checkBoxOnChange) {
      checkBoxOnChange(true);
    }

    const newList = selectedAccounts?.includes(address)
      ? selectedAccounts.filter((account) => account !== address)
      : [...selectedAccounts, address];

    setSelectedAccounts && setSelectedAccounts(newList);
  }, [address, checkBoxOnChange, selectedAccounts, setSelectedAccounts]);

  const _onChangeGenesis = useCallback(
    (genesisHash?: string | null): void => {
      tieAccount(address, genesisHash || null).catch(console.error);
    },
    [address]
  );

  const _toggleEdit = useCallback(
    (): void => setEditing(({ toggleActions }) => ({ isEditing: !isEditing, toggleActions: ++toggleActions })),
    [isEditing]
  );

  const _saveChanges = useCallback((): void => {
    if (editedName) {
      editAccount(address, editedName).catch(console.error);
    }

    _toggleEdit();
  }, [editedName, address, _toggleEdit]);

  const _actions = useMemo(
    () => (
      <>
        <Link
          className='menuItem'
          onClick={_toggleEdit}
        >
          {t<string>('Rename')}
        </Link>
        {!isExternal && canDerive(type) && (
          <Link
            className='menuItem'
            to={`/account/derive/${address}/locked`}
          >
            {t<string>('Derive New Account')}
          </Link>
        )}
        <MenuDivider />
        {!isExternal && (
          <Link
            className='menuItem'
            isDanger
            to={`/account/export/${address}`}
          >
            {t<string>('Export Account')}
          </Link>
        )}
        <Link
          className='menuItem'
          isDanger
          to={`/account/forget/${address}`}
        >
          {t<string>('Forget Account')}
        </Link>
        {!isHardware && (
          <>
            <MenuDivider />
            <div className='menuItem'>
              <Dropdown
                className='genesisSelection'
                label=''
                onChange={_onChangeGenesis}
                options={genesisOptions}
                value={genesisHash || ALEPH_ZERO_GENESIS_HASH}
              />
            </div>
          </>
        )}
      </>
    ),
    [_onChangeGenesis, _toggleEdit, address, genesisHash, genesisOptions, isExternal, isHardware, t, type]
  );

  return (
    <div
      className={className}
      onClick={_onCheckboxChange}
    >
      <Address
        actions={withMenu ? _actions : null}
        address={address}
        className='address'
        genesisHash={genesisHash}
        isExternal={isExternal}
        isHidden={isHidden}
        name={editedName}
        parentName={parentName}
        suri={suri}
        toggleActions={toggleActions}
      >
        {isEditing && (
          <Name
            address={address}
            className={`editName ${parentName ? 'withParent' : ''}`}
            isFocused
            label={' '}
            onBlur={_saveChanges}
            onChange={setName}
          />
        )}
        {withCheckbox && (
          <Checkbox
            checked={checked}
            className='accountTree-checkbox'
            label=''
            onChange={_onCheckboxChange}
          />
        )}
      </Address>
    </div>
  );
}

export default styled(Account)(
  ({ theme, withCheckbox }: Props) => `
  ${Address}:hover {
    background: ${withCheckbox ? theme.menuBackground : theme.menuBackground};
    ${withCheckbox ? ' cursor: pointer;' : ''}   
    ${Checkbox} label span {
      outline-color:  ${theme.primaryColor};
    }
  }

  ${Address}:active {
    ${Checkbox} span {
      background: ${theme.primaryColor};
    }
  }

  .address {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
  }

  .editName {
    position: absolute;
    flex: 1;
    left: 70px;
    top: 10px;
    width: 350px;

    .danger {
      background-color: ${theme.bodyColor};
      margin-top: -13px;
      width: 330px;
    }

    input {
      height : 30px;
      width: 350px;
    }

    &.withParent {
      top: 16px
    }
  }

  .menuItem {
    border-radius: 8px;
    display: block;
    font-size: 15px;
    line-height: 20px;
    margin: 0;
    min-width: 13rem;
    padding: 4px 16px;

    .genesisSelection {
      margin: 0;
    }
  }
`
);
