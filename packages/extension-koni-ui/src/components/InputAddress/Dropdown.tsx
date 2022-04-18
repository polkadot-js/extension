// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import React, { useCallback, useEffect, useState } from 'react';
import Select from 'react-select';
import styled from 'styled-components';

import { DropdownOptionType, DropdownTransformGroupOptionType } from '@polkadot/extension-base/background/KoniTypes';
import { Label } from '@polkadot/extension-koni-ui/components';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';

interface Props extends ThemeProps {
  className?: string;
  label: string;
  defaultValue?: string;
  getFormatOptLabel?: (label: string, value: string) => React.ReactNode;
  onChange?: any;
  options: DropdownOptionType[];
  value?: string;
  ci?: React.ReactNode;
  filterOptions?: (candidate: {label: string, value: string}, input: string) => boolean;
  isSetDefaultValue?: boolean;
}

function Dropdown ({ className, defaultValue, filterOptions, getFormatOptLabel, isSetDefaultValue = true, label, onChange, options, value }: Props): React.ReactElement<Props> {
  const transformOptions = options.map((t) => ({ label: t.text, value: t.value }));
  const transformGrOptions: DropdownTransformGroupOptionType[] = [];

  let index = 0;

  for (let i = 0; i < transformOptions.length; i++) {
    if (!transformOptions[i].value) {
      transformGrOptions.push({ label: transformOptions[i].label, options: [] });
      index++;
    } else {
      transformGrOptions[index - 1].options.push(transformOptions[i]);
    }
  }

  const [selectedValue, setSelectedValue] = useState(value);
  const grDeps = transformGrOptions.toString();

  useEffect(() => {
    if (isSetDefaultValue) {
      if (defaultValue) {
        setSelectedValue(defaultValue);
      } else {
        if (transformOptions && transformOptions.length) {
          setSelectedValue(transformGrOptions[0].options[0].value);
        }
      }
    }
  }, [defaultValue, grDeps, isSetDefaultValue]);

  const handleChange = useCallback(
    ({ value }): void => {
      if (typeof value === 'string') {
        value = value.trim();
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      onChange && onChange(value);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
      setSelectedValue(value);
    }, [onChange]
  );

  const formatOptionLabel = useCallback(({ label, value }) => {
    return getFormatOptLabel && getFormatOptLabel(label as string, value as string);
  }, [getFormatOptLabel]);

  const filterOption = useCallback((candidate: { label: string; value: string }, input: string) => {
    if (filterOptions) {
      return filterOptions(candidate, input);
    }

    return false;
  }, [filterOptions]);

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
    menuList: (base: any) => ({ ...base, maxHeight: '200px', zIndex: 15 }),
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
        { !selectedValue && <div className='input-address-logo-placeholder' />}
        <Select
          className='input-address-dropdown-wrapper'
          classNamePrefix='input-address-dropdown'
          filterOption={filterOptions && filterOption}
          formatOptionLabel={getFormatOptLabel && formatOptionLabel}
          isSearchable
          menuPlacement={'auto'}
          menuPortalTarget={document.querySelector('body')}
          menuPosition='fixed'
          onChange={handleChange}
          options={transformGrOptions}
          placeholder=''
          styles={customStyles}
          value={transformOptions.filter((obj: { value: string }) => obj.value === selectedValue)}
        />
      </Label>
    </>
  );
}

export default React.memo(styled(Dropdown)(({ isSetDefaultValue, theme }: Props) => `
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
    top: 16px;
    left: 16px;
    z-index: 1;
  }

  .label-wrapper {
    margin-bottom: 0;
  }

  .input-address-dropdown-wrapper {
    // // background: ${theme.background};
    // position: relative;
    // border: 2px solid ${theme.boxBorderColor};
    // height: 72px;
    // border-radius: 8px;
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
    border: 1px solid transparent;
    box-sizing: border-box;
    display: flex;
    font-family: ${theme.fontFamily};
    box-shadow: none;
  }

  .input-address-dropdown__control:hover {
    border: 1px solid transparent;
    box-shadow: none;
  }

  .input-address-dropdown__input-container {
    padding-top: 28px;
    padding-left: 48px;
  }

  .input-address-dropdown__input {
    max-width: 350px;
  }

  .input-address-dropdown__single-value {
    color: ${theme.textColor};
    font-size: 14px;
    line-height: 24px;
    font-weight: 400;
  }

  .input-address-dropdown__single-value .key-pair__address {
    display: none;
  }

  .input-address-dropdown__indicator-separator {
    display: none;
  }

  .input-address-dropdown__input-container {
    color: ${theme.textColor2};
  }

  .input-address-dropdown__menu-portal {
    text-align: left;
    font-size: 15px;
  }

  .input-address-dropdown__menu-notice--no-options {
    text-align: left;
    font-family: ${theme.fontFamily};
  }

`));
