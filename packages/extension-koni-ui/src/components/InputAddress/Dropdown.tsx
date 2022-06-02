/* eslint-disable react-hooks/exhaustive-deps */
// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import { DropdownOptionType, DropdownTransformGroupOptionType, DropdownTransformOptionType } from '@subwallet/extension-base/background/KoniTypes';
import { Label, Theme } from '@subwallet/extension-koni-ui/components';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React, { useCallback, useContext, useEffect, useState } from 'react';
import { ActionMeta, SingleValue } from 'react-select';
import AsyncSelect from 'react-select/async';
import styled, { ThemeContext } from 'styled-components';

interface Props extends ThemeProps {
  className?: string;
  label: string;
  defaultOptions: DropdownTransformGroupOptionType[];
  defaultValue?: string;
  getFormatOptLabel?: (label: string, value: string) => React.ReactNode;
  onChange?: any;
  options: DropdownOptionType[];
  value?: string;
  ci?: React.ReactNode;
  isSetDefaultValue?: boolean;
  loadOptions?: (inputValue: string, callback: (options: DropdownTransformGroupOptionType[]) => void) => Promise<DropdownTransformGroupOptionType[]> | void;
  isDisabled: boolean
}

function Dropdown ({ className, defaultOptions, defaultValue, getFormatOptLabel, isDisabled, isSetDefaultValue = true, label, loadOptions, onChange, options, value }: Props): React.ReactElement<Props> {
  const transformOptions = options.map((t) => ({ label: t.text, value: t.value }));
  const [selectedValue, setSelectedValue] = useState(value);
  const grDeps = defaultOptions.toString();
  const themeContext = useContext(ThemeContext as React.Context<Theme>);

  useEffect(() => {
    if (isSetDefaultValue) {
      if (defaultValue && defaultValue !== 'all') {
        setSelectedValue(defaultValue);
      } else {
        if (defaultOptions && defaultOptions.length) {
          setSelectedValue(defaultOptions[0].options[0].value);
        }
      }
    }
  }, [defaultValue, grDeps, isSetDefaultValue]);

  const handleChange = useCallback(
    (newValue: SingleValue<{ label: string; value: string; }>, actionMeta: ActionMeta<{ label: string; value: string; }>): void => {
      const value = newValue?.value.trim() || '';

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      onChange && onChange(value);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      setSelectedValue(value);
    }, [onChange]
  );

  const formatOptionLabel = useCallback(({ label, value }: DropdownTransformOptionType) => {
    return getFormatOptLabel && getFormatOptLabel(label, value);
  }, [getFormatOptLabel]);

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
        color: themeContext.textColor,
        fontWeight: isSelected ? 500 : 400,
        backgroundColor: isSelected ? themeContext.backgroundAccountAddress : 'transparent',
        ':active': {
          backgroundColor: isSelected ? themeContext.backgroundAccountAddress : 'transparent'
        }
      };
    },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    noOptionsMessage: (base: any) => ({ ...base, textAlign: 'left', fontFamily: 'Lexend', fontSize: '15px' }),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    menuList: (base: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return {
        ...base,
        maxHeight: '200px',
        zIndex: 15,
        paddingTop: 0,
        paddingBottom: 0
      };
    },
    menu: (base: any) => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return {
        ...base,
        width: '100%',
        boxShadow: themeContext.boxShadow2,
        background: themeContext.background,
        borderRadius: '8px',
        outline: `2px solid ${themeContext.background}`
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
    <>
      <Label
        className={className}
        label={label}
      >
        { !selectedValue && <div className='input-address-logo-placeholder' />}
        <AsyncSelect
          className='input-address-dropdown-wrapper'
          classNamePrefix='input-address-dropdown'
          defaultOptions={defaultOptions}
          formatOptionLabel={getFormatOptLabel && formatOptionLabel}
          isDisabled={isDisabled}
          isSearchable
          loadOptions={loadOptions}
          menuPlacement={'auto'}
          menuPortalTarget={document.querySelector('main')}
          menuPosition='fixed'
          onChange={handleChange}
          placeholder=''
          styles={customStyles}
          value={transformOptions.filter((obj: { value: string }) => obj.value === selectedValue)}
        />
      </Label>
    </>
  );
}

export default React.memo(styled(Dropdown)(({ theme }: Props) => `
  font-weight: 500;
  color: ${theme.textColor2};
  position: relative;

  .input-address-logo-placeholder {
    position: absolute;
    content: '';
    width: 40px;
    min-width: 40px;
    height: 40px;
    border-radius: 50%;
    background: ${theme.backgroundAccountAddress};
    top: 11px;
    left: 10px;
    z-index: 1;
  }

  .input-address-dropdown-wrapper {
    height: 100%;
  }

  .label-wrapper {
    margin-bottom: 0;
  }

  .input-address-dropdown__indicators {
    display: none;
  }

  .input-address-dropdown__control {
    height: 100%;
    margin-top: 0;
    background: ${theme.background};
    border-radius: 8px;
    width: 100%;
    cursor: pointer;
    border: 0;
    box-sizing: border-box;
    display: flex;
    font-family: ${theme.fontFamily};
    box-shadow: none;
  }

  .input-address-dropdown__control:hover {
    box-shadow: none;
  }

  .input-address-dropdown__input-container {
    padding-top: 26px;
    padding-left: 50px;
    color: ${theme.textColor2};
  }

  .input-address-dropdown__input {
    max-width: 350px;
    font-size: 16px;
  }

  .input-address-dropdown__single-value {
    color: ${theme.textColor};
    font-size: 14px;
    line-height: 24px;
    font-weight: 400;
  }

  .input-address-dropdown__indicator-separator {
    display: none;
  }

  .input-address-dropdown__menu-portal {
    text-align: left;
    font-size: 15px;
  }

  .input-address-dropdown__menu-notice--no-options {
    text-align: left;
    font-family: ${theme.fontFamily};
  }

  .input-address-dropdown__control--menu-is-open {
    .key-pair {
      opacity: 0.5;
    }
  }
`));
