// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, { useState } from 'react';
import Select from 'react-select';
import styled from 'styled-components';

import Label from './Label';
import {Option} from "@polkadot/extension-koni-ui/components/InputAddress/types";
import networkSelectOption from "@polkadot/extension-koni-ui/hooks/useGenesisHashOptions";
// interface DropdownOption {
//   text: string;
//   value: string;
// }

interface Props extends ThemeProps {
  className?: string;
  label: string;
  onChange?: (value: string) => void;
  options: networkSelectOption[];
  value?: string;
}

function Dropdown ({ className, label, onChange, options, value }: Props): React.ReactElement<Props> {
  console.log('options', options);
  const transformOptions = options.map((t) => ({ label: t.text, value: t.value }));
  const [selectedValue, setSelectedValue] = useState(value || transformOptions[0].value);

  const handleChange = (e: { value: any }) => {
    onChange && onChange(e.value.trim());
    setSelectedValue(e.value);
  };

  const customStyles = {
    option: (base: any) => {
      return {
        ...base,
        textAlign: 'left',
        fontFamily: 'Lexend',
        fontSize: '15px'
      };
    },
    noOptionsMessage: (base: any) => ({ ...base, textAlign: 'left', fontFamily: 'Lexend', fontSize: '15px' })
  };

  return (
    <>
      <Label
        className={className}
        label={label}
      >
        <Select
          className='kn-dropdown-wrapper'
          classNamePrefix='kn-dropdown'
          isSearchable
          menuPortalTarget={document.body}
          onChange={handleChange}
          options={transformOptions}
          placeholder=''
          styles={customStyles}
          value={transformOptions.filter((obj: { value: number; }) => obj.value === selectedValue)}
        />
      </Label>
    </>
  );
}

export default React.memo(styled(Dropdown)(({ label, theme }: Props) => `
  font-weight: 500;
  color: ${theme.textColor2};

  .kn-dropdown__control {
    height: 48px;
    border-radius: 8px;
    width: 100%;
    cursor: pointer;
    margin-top: 4px;
    border: 1px solid transparent;
    box-sizing: border-box;
    display: flex;
    font-family: ${theme.fontFamily};
    background: ${theme.backgroundAccountAddress};
    box-shadow: none;
  }

  .kn-dropdown__control:hover {
    border: 1px solid transparent;
    box-shadow: none;
  }

  .kn-dropdown__single-value {
    color: ${theme.textColor2};
  }

  .kn-dropdown__indicator-separator {
    display: none;
  }

  .kn-dropdown__input-container {
    color: ${theme.textColor2};
  }

  .kn-dropdown__menu-portal {
    text-align: left;
    font-size: 15px;
  }

  .kn-dropdown__menu-notice--no-options {
    text-align: left;
    font-family: ${theme.fontFamily};
  }

`));
