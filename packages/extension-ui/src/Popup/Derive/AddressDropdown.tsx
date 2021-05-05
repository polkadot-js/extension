// Copyright 2019-2021 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../../types';

import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';

import arrow from '../../assets/arrow-down.svg';
import { Address } from '../../components';
import useOutsideClick from '../../hooks/useOutsideClick';

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

  const _hideDropdown = useCallback(() => setDropdownVisible(false), []);
  const _toggleDropdown = useCallback(() => setDropdownVisible(!isDropdownVisible), [isDropdownVisible]);
  const _selectParent = useCallback((newParent: string) => () => onSelect(newParent), [onSelect]);

  useOutsideClick(ref, _hideDropdown);

  return (
    <div className={className}>
      <div
        onClick={_toggleDropdown}
        ref={ref}
      >
        <Address
          address={selectedAddress}
          className='address'
          genesisHash={selectedGenesis}
        />
      </div>
      <div className={`dropdown ${isDropdownVisible ? 'visible' : ''}`}>
        {allAddresses.map(([address, genesisHash]) => (
          <div
            data-parent-option
            key={address}
            onClick={_selectParent(address)}
          >
            <Address
              address={address}
              className='address'
              genesisHash={genesisHash}
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
    top: 66%;
    transform: translateY(-50%);
    right: 11px;
    width: 30px;
    height: 30px;
    background: url(${arrow}) center no-repeat;
    background-color: ${theme.inputBackground};
    pointer-events: none;
    border-radius: 4px;
    border: 1px solid ${theme.boxBorderColor};
  }

  .address .copyIcon {
    visibility: hidden;
  }

  .dropdown {
    position: absolute;
    visibility: hidden;
    width: 510px;
    z-index: 100;
    background: ${theme.bodyColor};
    max-height: 0;
    overflow: auto;
    padding: 5px;
    border: 1px solid ${theme.boxBorderColor};
    box-sizing: border-box;
    border-radius: 4px;
    margin-top: -8px;

    &.visible{
      visibility: visible;
      max-height: 200px;
    }

    & > div {
      cursor: pointer;
    }
  }
`);
