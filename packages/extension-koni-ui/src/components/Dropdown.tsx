// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { ThemeProps } from '../types';

import React, { useCallback, useState } from 'react';
import Select, { ActionMeta, SingleValue } from 'react-select';
import styled from 'styled-components';

import { networkSelectOption } from '@subwallet/extension-koni-ui/hooks/useGenesisHashOptions';

import Label from './Label';

interface Props extends ThemeProps {
  className?: string;
  label: string;
  onChange?: any;
  options: networkSelectOption[];
  value?: string;
}

function Dropdown ({ className, label, onChange, options, value }: Props): React.ReactElement<Props> {
  const transformOptions = options.map((t) => ({ label: t.text, value: t.value }));
  const [selectedValue, setSelectedValue] = useState(value || transformOptions[0].value);

  const handleChange = useCallback(
    (newValue: SingleValue<{ label: string; value: string; }>, actionMeta: ActionMeta<{ label: string; value: string; }>): void => {
      const value = newValue?.value.trim() || '';

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      onChange && onChange(value);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      setSelectedValue(value);
    }, [onChange]
  );

  const customStyles = {
    option: (base: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return {
        ...base,
        textAlign: 'left',
        fontFamily: 'Lexend',
        fontSize: '15px'
      };
    },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    noOptionsMessage: (base: any) => ({ ...base, textAlign: 'left', fontFamily: 'Lexend', fontSize: '15px' }),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    menuList: (base: any) => ({ ...base, maxHeight: '150px' })
  };

  return (
    <>
      <Label
        className={className}
        label={label}
      >
        <Select
          className='dropdown-wrapper'
          classNamePrefix='dropdown'
          isSearchable
          menuPlacement={'auto'}
          menuPortalTarget={document.body}
          menuPosition='fixed'
          onChange={handleChange}
          options={transformOptions}
          placeholder=''
          styles={customStyles}
          value={transformOptions.filter((obj: { value: string }) => obj.value === selectedValue)}
        />
      </Label>
    </>
  );
}

export default React.memo(styled(Dropdown)(({ label, theme }: Props) => `
  font-weight: 500;
  color: ${theme.textColor2};

  .dropdown__control {
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

  .dropdown__control:hover {
    border: 1px solid transparent;
    box-shadow: none;
  }

  .dropdown__single-value {
    color: ${theme.textColor};
    font-size: 14px;
    line-height: 24px;
    font-weight: 400;
  }

  .dropdown__indicator-separator {
    display: none;
  }

  .dropdown__input-container {
    color: ${theme.textColor2};
  }

  .dropdown__menu-portal {
    text-align: left;
    font-size: 15px;
  }

  .dropdown__menu-notice--no-options {
    text-align: left;
    font-family: ${theme.fontFamily};
  }

`));
