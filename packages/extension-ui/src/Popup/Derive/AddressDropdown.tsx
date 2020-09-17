// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { ThemeProps } from '../../types';

import React, { useCallback, useRef, useState } from 'react';
import styled from 'styled-components';

import arrow from '../../assets/arrow-down.svg';
import { Address, Svg } from '../../components';
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
          genesisHash={selectedGenesis}
        />
      </div>
      <HiddenOptions visible={isDropdownVisible}>
        {allAddresses.map(([address, genesisHash]) => (
          <div
            data-parent-option
            key={address}
            onClick={_selectParent(address)}
          >
            <Address
              address={address}
              genesisHash={genesisHash}
            />
          </div>
        ))}
      </HiddenOptions>
    </div>
  );
}

const HiddenOptions = styled.div<{ visible: boolean }>`
  position: absolute;
  visibility: ${({ visible }): string => (visible ? 'visible' : 'hidden')};
  width: 510px;
  z-index: 100;
  background: ${({ theme }: ThemeProps): string => theme.bodyColor};
  max-height: ${({ visible }): string => (visible ? '200px' : '0')};
  overflow: scroll;
  padding: 5px;
  border: 1px solid ${({ theme }: ThemeProps): string => theme.boxBorderColor};
  box-sizing: border-box;
  border-radius: 4px;
  margin-top: -8px;

  & > div {
    cursor: pointer;
  }
`;

export default styled(AddressDropdown)(({ theme }: ThemeProps) => `
  margin-bottom: 16px;
  cursor: pointer;

  & > div:first-child > ${Address}::after {
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

  ${Address} ${Svg} {
    visibility: hidden;
  }
`);
