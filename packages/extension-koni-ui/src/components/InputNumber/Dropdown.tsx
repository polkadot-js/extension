// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DropdownOptionType, DropdownTransformOptionType } from '@subwallet/extension-base/background/KoniTypes';
import { Theme } from '@subwallet/extension-koni-ui/components';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useState } from 'react';
import Select, { ActionMeta, SingleValue } from 'react-select';
import styled, { ThemeContext } from 'styled-components';

interface Props {
  className?: string;
  onChange: (value: string) => void;
  value: string;
  options: DropdownOptionType[];
  isDisabled?: boolean;
}

function Dropdown ({ className, isDisabled, onChange, options, value }: Props): React.ReactElement<Props> {
  const transformOptions: DropdownTransformOptionType[] = options.map((t) => ({ label: t.text, value: t.value }));
  const [selectedValue, setSelectedValue] = useState(value);
  const themeContext = useContext(ThemeContext as React.Context<Theme>);

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
    option: (base: any, { isSelected }: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return {
        ...base,
        textAlign: 'left',
        fontFamily: 'Lexend',
        padding: '8px 16px',
        fontSize: '15px',
        cursor: 'pointer',
        color: themeContext.textColor2,
        fontWeight: isSelected ? 500 : 400,
        backgroundColor: isSelected ? themeContext.backgroundAccountAddress : 'transparent',
        ':hover': {
          color: themeContext.textColor
        },
        ':active': {
          backgroundColor: isSelected ? themeContext.backgroundAccountAddress : 'transparent'
        }
      };
    },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    noOptionsMessage: (base: any) => ({ ...base, textAlign: 'left', fontFamily: 'Lexend', fontSize: '15px' }),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    menuList: (base: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return {
        ...base,
        maxHeight: '150px',
        zIndex: 15,
        paddingTop: 0,
        paddingBottom: 0
      };
    },
    menu: (base: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return {
        ...base,
        right: 0,
        marginTop: '0',
        boxShadow: themeContext.boxShadow2,
        background: themeContext.background,
        borderRadius: '8px'
      };
    },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    group: (base: any) => ({
      ...base,
      paddingTop: 0,
      paddingBottom: 0
    }),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    groupHeading: (base: any) => ({
      ...base,
      textAlign: 'left',
      padding: '8px 16px',
      fontSize: '15px',
      fontFamily: 'Lexend',
      marginBottom: '0',
      color: themeContext.textColor,
      backgroundColor: themeContext.background
    })
  };

  return (
    <div className={className}>
      <Select
        autoFocus
        className='input-number-dropdown-dropdown-wrapper'
        classNamePrefix='input-number-dropdown-dropdown'
        isDisabled={isDisabled}
        isSearchable={false}
        menuPlacement={'auto'}
        menuPortalTarget={document.querySelector('main')}
        menuPosition='fixed'
        onChange={handleChange}
        options={transformOptions}
        placeholder='Search...'
        styles={customStyles}
        value={transformOptions.filter((obj: { value: string }) => obj.value === selectedValue)}
      />
    </div>
  );
}

export default React.memo(styled(Dropdown)(({ theme }: ThemeProps) => `
  width: 110px;

  .input-number-dropdown-dropdown-wrapper {
    cursor: pointer;
  }

  .input-number-dropdown-dropdown__control {
    background: ${theme.background};
    cursor: pointer;
    box-shadow: 0px 0px 3px rgba(0, 0, 0, 0.15);
    align-items: center;
    border: 0;
    border-radius: 8px;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    min-height: 54px;
    position: relative;
    padding-left: 6px;
    font-weight: 500;
    cursor: inherit;
  }

  .input-number-dropdown-dropdown__indicator-separator {
    display: none;
  }

  .input-number-dropdown-dropdown__single-value,
  .input-number-dropdown-dropdown__indicator,
  .input-number-dropdown-dropdown__indicator:hover {
    color: ${theme.textColor};
  }

  .input-number-dropdown-dropdown--is-disabled {
    cursor: default;

    .input-number-dropdown-dropdown__indicators {
      display: none;
    }
  }
`));
