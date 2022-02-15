// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useContext, useEffect, useState } from 'react';
import Select, { StylesConfig } from 'react-select';
import styled, { ThemeContext } from 'styled-components';

import KeyPair from '@polkadot/extension-koni-ui/components/InputAddress/KeyPair';
import { Theme, ThemeProps } from '@polkadot/extension-koni-ui/types';
import { isUndefined } from '@polkadot/util';

import Labelled from './Labelled';

interface Props<Option> {
  children?: React.ReactNode;
  className?: string;
  defaultValue?: any;
  help?: React.ReactNode;
  isButton?: boolean;
  isDisabled?: boolean;
  isFull?: boolean;
  isMultiple?: boolean;
  label?: React.ReactNode;
  labelExtra?: React.ReactNode;
  onBlur?: () => void;
  onChange?: (value: any) => void;
  optionsData: any[];
  placeholder?: string;
  transform?: (value: any) => any;
  value?: unknown;
  withEllipsis?: boolean;
  withLabel?: boolean;
  showIndicators?: boolean;
  isSearchable?: boolean;
  isCustomOption?: boolean
}

export type IDropdown<Option> = React.ComponentType<Props<Option>> & {
  Header: React.ComponentType<{ content: React.ReactNode }>;
}

function BaseDropdown<Option> ({ children, className = '', defaultValue, help, isButton, isCustomOption, isDisabled, isFull, isMultiple, isSearchable, label, labelExtra, onBlur, onChange, optionsData, placeholder, showIndicators, transform, value, withEllipsis, withLabel }: Props<Option>): React.ReactElement<Props<Option>> {
  const [stored, setStored] = useState<string | undefined>();
  const [optionValues, setOptionValues] = useState<any[]>([]);
  const themeContext = useContext(ThemeContext as React.Context<Theme>);
  const customStyles: StylesConfig<any> = {
    option: (theme: any, { isSelected }) => {
      return {
        textAlign: 'left',
        fontFamily: 'Lexend',
        fontSize: '15px',
        padding: '8px 16px',
        color: themeContext.id === 'dark' ? '#666666' : '#9196AB',
        backgroundColor: isSelected ? themeContext.id === 'dark' ? '#262C4A' : '#F5F5F5' : 'transparent',
        borderRadius: '8px',
        cursor: 'pointer',
        '&:hover': {
          '.ui--KeyPair .name, .advance-dropdown-basic-item': {
            color: themeContext.id === 'dark' ? '#fff' : '#00072D'
          }
        }
      };
    },
    dropdownIndicator: () => ({
      display: showIndicators ? 'flex' : 'none',
      paddingRight: showIndicators ? '6px' : 0
    }),
    menu: () => ({
      borderRadius: '8px',
      margin: '-2px'
    }),
    menuList: () => ({
      backgroundColor: themeContext.id === 'dark' ? '#010414' : '#fff',
      boxShadow: themeContext.id === 'dark' ? '0px 0px 7px rgba(4, 193, 183, 0.4)' : '0px 0px 5px rgba(0, 0, 0, 0.05), 0px 20px 60px rgba(0, 0, 0, 0.15)',
      overflowX: 'hidden',
      overflowY: 'auto',
      borderRadius: '8px',
      '@media only screen and (min-width: 768px)': {
        maxHeight: '150px'
      },
      '@media only screen and (min-width: 992px)': {
        maxHeight: '225px'
      },
      '@media only screen and (min-width: 1920px)': {
        maxHeight: '300px'
      },
      '@media only screen and (max-width: 767px)': {
        maxHeight: '130px'
      }
    }),
    group: () => ({
      padding: 0
    }),
    groupHeading: () => ({
      textAlign: 'left',
      fontFamily: 'Lexend',
      color: themeContext.id === 'dark' ? '#fff' : '#00072D',
      padding: '8px 16px',
      textTransform: 'uppercase',
      fontWeight: 500,
      fontSize: '15px'
    }),
    noOptionsMessage: (base: any) => ({ ...base, textAlign: 'left', fontFamily: 'Lexend', fontSize: '15px' })
  };

  useEffect(() => {
    if (!!optionsData && !!optionsData[0]) {
      if (optionsData[0].options) {
        setOptionValues(optionsData[0].options);
      } else {
        setOptionValues(optionsData);
      }
    }
  }, []);

  const _setStored = useCallback(
    (selectedValue): void => {
      setStored(selectedValue);

      onChange && onChange(
        transform
          ? transform(selectedValue)
          : selectedValue
      );
    },
    [onChange, transform]
  );

  useEffect((): void => {
    _setStored((isUndefined(value) ? defaultValue : value) as string);
  }, [_setStored, defaultValue, value]);

  const _onChange = useCallback(
    ({ value }): void => {
      _setStored(value as string);
    },
    [_setStored]
  );

  const formatOptionLabel = (data: any) => {
    if (data.value) {
      return (isCustomOption
        ? <KeyPair
          address={data.value}
          name={data.label}
        />
        : (<div className='advance-dropdown-basic-item'>{data.label}</div>));
    } else {
      return (<div>{data.label}</div>);
    }
  };

  const dropdown = (
    <Select
      className='advance-dropdown-wrapper'
      classNamePrefix='advance-dropdown'
      formatOptionLabel={formatOptionLabel}
      isDisabled={isDisabled}
      isMulti={isMultiple}
      isSearchable={isSearchable}
      menuPortalTarget={document.body}
      onBlur={onBlur}
      onChange={_onChange}
      options={optionsData}
      placeholder={placeholder}
      styles={customStyles}
      value={optionValues.filter((obj: { value: string; }) => obj.value === stored)}
    />
  );

  return isButton
    ? <div className={`unit-button ${className}`}>{dropdown}{children}</div>
    : (
      <Labelled
        className={`ui--Dropdown ${className} ${isDisabled ? 'isDisabled' : ''}`}
        help={help}
        isFull={isFull}
        label={label}
        labelExtra={labelExtra}
        withEllipsis={withEllipsis}
        withLabel={withLabel}
      >
        {dropdown}
        {children}
      </Labelled>
    );
}

export default React.memo(styled(BaseDropdown)(({ theme }: ThemeProps) => `
  .advance-dropdown-wrapper {
    height: 100%;
  }

  .advance-dropdown__control {
    height: 100%;
    border-radius: 8px;
    width: 100%;
    cursor: pointer;
    border: 1px solid transparent;
    box-sizing: border-box;
    display: flex;
    font-family: ${theme.fontFamily};
    background: transparent;
    box-shadow: none;
    align-items: flex-end;
  }

  .advance-dropdown__control:before {
    content: '';
    height: 42px;
    width: 42px;
    display: block;
    position: absolute;
    top: 10px;
    left: 10px;
    border-radius: 100%;
    background: ${theme.backgroundAccountAddress};
  }

  .advance-dropdown__control:hover {
    border: 1px solid transparent;
    box-shadow: none;
  }

  .advance-dropdown__single-value {
    color: ${theme.textColor2};
  }

  .advance-dropdown__indicator-separator {
    display: none;
  }

  .advance-dropdown__input-container {
    color: ${theme.textColor2};
  }

  .advance-dropdown__menu-portal {
    text-align: left;
    font-size: 15px;
  }

  .advance-dropdown__menu-notice--no-options {
    text-align: left;
    font-family: ${theme.fontFamily};
  }
`));
