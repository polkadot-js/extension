// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useContext, useRef, useState } from 'react';
import styled, { ThemeContext } from 'styled-components';

import AccountInfo from '@subwallet/extension-koni-ui/components/AccountInfo';

import arrow from '../../assets/arrow-down.svg';
import useOutsideClick from '../../hooks/useOutsideClick';
import { Theme } from '../../types';

interface Props {
  allAddresses: [string, string | null][];
  className?: string;
  onSelect: (address: string) => void;
  selectedAddress: string;
  selectedGenesis: string | null;
}

function AddressDropdown ({ allAddresses, className, onSelect, selectedAddress, selectedGenesis }: Props): React.ReactElement<Props> {
  const [isDropdownVisible, setDropdownVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const themeContext = useContext(ThemeContext as React.Context<Theme>);
  const _hideDropdown = useCallback(() => setDropdownVisible(false), []);
  const _toggleDropdown = useCallback(() => setDropdownVisible(!isDropdownVisible), [isDropdownVisible]);
  const _selectParent = useCallback((newParent: string) => () => {
    onSelect(newParent);
    _hideDropdown();
  }, [_hideDropdown, onSelect]);

  useOutsideClick(ref, _hideDropdown);

  return (
    <div
      className={className}
      ref={ref}
    >
      <div
        className={`account-info-container ${themeContext.id === 'dark' ? '-dark' : '-light'}`}
        onClick={_toggleDropdown}
      >
        <AccountInfo
          address={selectedAddress}
          className='address'
          genesisHash={selectedGenesis}
        />
      </div>
      <div className={`dropdown ${isDropdownVisible ? 'visible' : ''}`}>
        {allAddresses.map(([address, genesisHash]) => (
          <div
            className={`account-info-container ${themeContext.id === 'dark' ? '-dark' : '-light'} address-dropdown-option`}
            data-parent-option
            key={address}
            onClick={_selectParent(address)}
          >
            <AccountInfo
              address={address}
              className='address-dropdown-option__inner'
              genesisHash={genesisHash}
              showCopyBtn={false}
            />
          </div>
        ))}
      </div>
    </div>
  );
}

export default styled(AddressDropdown)(({ theme }: ThemeProps) => `
  margin-bottom: 16px;
  cursor: pointer;

  & > div:first-child > .address::after {
    content: '';
    position: absolute;
    top: 70%;
    transform: translateY(-50%);
    right: 15px;
    width: 28px;
    height: 28px;
    background: url(${arrow}) center no-repeat;
    background-color: ${theme.inputBackground};
    pointer-events: none;
    border-radius: 4px;
    border: 1px solid ${theme.boxBorderColor};
  }

  .address-dropdown-option:not(:last-child) {
    margin-bottom: 10px;
  }

  .address .account-info-copy-icon {
    visibility: hidden;
  }

  .address-dropdown-option__inner {
    margin: 0;
    width: 375px;
  }

  .dropdown {
    position: absolute;
    visibility: hidden;
    z-index: 100;
    background: ${theme.bodyColor};
    max-height: 0;
    overflow: auto;
    padding: 5px;
    border: 1px solid ${theme.boxBorderColor};
    box-sizing: border-box;
    border-radius: 8px;
    margin-top: 5px;

    &.visible{
      visibility: visible;
      max-height: 200px;
    }

    & > div {
      cursor: pointer;
    }
  }
`);
