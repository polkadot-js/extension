// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { DropdownTransformOptionType, NetworkJson } from '@subwallet/extension-base/background/KoniTypes';
import { Label, Theme } from '@subwallet/extension-koni-ui/components';
import XcmItem from '@subwallet/extension-koni-ui/Popup/XcmTransfer/XcmDropdown/XcmItem';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useState } from 'react';
import Select, { ActionMeta, SingleValue } from 'react-select';
import styled, { ThemeContext } from 'styled-components';

interface Props {
  className?: string;
  label: string;
  onChange?: any;
  options: DropdownTransformOptionType[];
  value?: string;
  ci?: React.ReactNode;
  networkMap: Record<string, NetworkJson>;
  isDisabled: boolean;
}

function Dropdown ({ className, isDisabled, label, onChange, options, value }: Props): React.ReactElement<Props> {

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

  const formatOptionLabel = useCallback((option: DropdownTransformOptionType) => {
    return (
      <XcmItem
        networkKey={option.value}
        networkName={option.label}
      />
    );
  }, []);

  const customStyles = {
    option (base: any, { isSelected }: any) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return {
        ...base,
        textAlign: 'left',
        fontFamily: 'Lexend',
        fontSize: '15px',
        color: isSelected ? themeContext.textColor : themeContext.textColor2,
        cursor: 'pointer',
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
    menu: (base: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return {
        ...base,
        width: '100%',
        right: 0,
        marginTop: '0',
        borderRadius: '8px'
      };
    },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    menuList: (base: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return {
        ...base,
        maxHeight: '200px',
        zIndex: 15,
        boxShadow: themeContext.boxShadow2,
        backgroundColor: themeContext.background,
        borderRadius: '8px'
      };
    },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    group: (base: any) => ({ ...base, paddingTop: '0' }),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    groupHeading: (base: any) => ({ ...base, textAlign: 'left', padding: '8px 12px', fontSize: '15px', fontFamily: 'Lexend', marginBottom: '0' })
  };

  return (
    <>
      <Label
        className={className}
        label={label}
      >
        <Select
          autoFocus
          className='token-dropdown-dropdown-wrapper'
          classNamePrefix='token-dropdown-dropdown'
          // filterOption={filterOption}
          formatOptionLabel={formatOptionLabel}
          isDisabled={isDisabled}
          isSearchable={false}
          menuPlacement={'auto'}
          menuPortalTarget={document.querySelector('main')}
          menuPosition='fixed'
          onChange={handleChange}
          options={options}
          styles={customStyles}
          value={options.filter((obj: { value: string }) => obj.value === selectedValue)}
        />
      </Label>
    </>
  );
}

export default React.memo(styled(Dropdown)(({ theme }: ThemeProps) => `
  font-weight: 500;
  color: ${theme.textColor2};
  position: relative;

  > label {
    font-size: 18px;
  }

  .dropdown-wrapper-item {
    height: 72px;
    display: flex;
    align-items: center;
    cursor: pointer;
    padding-right: 8px;
  }

  .dropdown-wrapper-selected-logo {
    width: 30px;
    height: 30px;
    min-width: 30px;
    border-radius: 50%;
    background: ${theme.identiconBackground};
    border: 2px solid transparent;
    margin-right: 8px;
  }

  .label-wrapper {
    margin-bottom: 0;
  }

  .token-dropdown__dropdown {
    position: absolute;
    right: -2px;
    top: 108%;
    z-index: 100;
  }

  .token-dropdown-dropdown__indicator-separator {
    display: none;
  }

  .token-dropdown-dropdown__control {
    align-items: center;
    background-color: ${theme.backgroundAccountAddress};
    border: none;
    border-radius: 8px;
    cursor: default;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    min-height: 48px;
    position: relative;
    min-width: 176px;
    box-shadow: none;
  }

  .token-dropdown-dropdown__control:hover {
    box-shadow: none;
  }

  .token-dropdown-dropdown__single-value {
    color: ${theme.textColor};
  }

  .token-dropdown-dropdown__input-container {
    background-color: ${theme.backgroundAccountAddress};
    color: ${theme.textColor2};
    padding: 4px 8px;
    border-radius: 8px;
  }

  .token-dropdown-dropdown__input {
    min-width: 100% !important;
    width: auto !important;
  }

`));
