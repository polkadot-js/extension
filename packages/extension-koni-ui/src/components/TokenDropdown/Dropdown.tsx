// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import { faChevronDown } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useCallback, useContext, useRef, useState } from 'react';
import Select, { ActionMeta, SingleValue } from 'react-select';
import styled, { ThemeContext } from 'styled-components';

import { Label, Theme } from '@polkadot/extension-koni-ui/components';
import { TokenItemType } from '@polkadot/extension-koni-ui/components/types';
import useOutsideClick from '@polkadot/extension-koni-ui/hooks/useOutsideClick';
import { ThemeProps } from '@polkadot/extension-koni-ui/types';
import { getLogoByNetworkKey } from '@polkadot/extension-koni-ui/util';

interface WrapperProps {
  className?: string;
  formatOptLabel?: (label: string, value: string, networkKey: string) => React.ReactNode;
  onChange?: (token: string) => void;
  value: string;
  options: TokenItemType[];
  ci?: React.ReactNode;
  filterOptions?: (candidate: {label: string, value: string}, input: string) => boolean;
}

interface Props {
  className?: string;
  label: string;
  getFormatOptLabel?: (label: string, value: string, networkKey: string) => React.ReactNode;
  onChange?: any;
  options: TokenItemType[];
  value?: string;
  ci?: React.ReactNode;
  filterOptions?: (candidate: {label: string, value: string}, input: string) => boolean;
}

function DropdownWrapper ({ className, formatOptLabel, onChange, options, value }: WrapperProps): React.ReactElement<WrapperProps> {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const tokenValueArr = value.split('|');
  const dropdownRef = useRef(null);

  const toggleDropdownWrapper = useCallback(() => {
    setDropdownOpen(!isDropdownOpen);
  }, [isDropdownOpen]);

  useOutsideClick(dropdownRef, (): void => {
    setDropdownOpen(false);
  });

  const _onChange = useCallback((value: string) => {
    onChange && onChange(value);
    setDropdownOpen(false);
  }, [onChange]);

  return (
    <div
      className={className}
      ref={dropdownRef}
    >
      <div
        className='dropdown-wrapper-item'
        onClick={toggleDropdownWrapper}
      >
        <img
          alt={tokenValueArr[1]}
          className='dropdown-wrapper-selected-logo'
          src={getLogoByNetworkKey(tokenValueArr[1])}
        />
        <FontAwesomeIcon
          className='dropdown-wrapper-item__icon'
          // @ts-ignore
          icon={faChevronDown}
          size='sm'
        />
      </div>

      {isDropdownOpen && (
        <Dropdown
          className='token-dropdown__dropdown'
          getFormatOptLabel={formatOptLabel}
          label={''}
          onChange={_onChange}
          options={options}
          value={value}
        />
      )}
    </div>
  );
}

function Dropdown ({ className, filterOptions, getFormatOptLabel, label, onChange, options, value }: Props): React.ReactElement<Props> {
  const transformOptions = options.map((t) => ({ label: t.token, value: `${t.token}|${t.networkKey}`, networkKey: t.networkKey }));
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

  const formatOptionLabel = useCallback(({ label, networkKey, value }: {label: string, value: string, networkKey: string}) => {
    return getFormatOptLabel && getFormatOptLabel(label, value, networkKey);
  }, [getFormatOptLabel]);

  const filterOption = useCallback((candidate: { label: string; value: string }, input: string) => {
    if (filterOptions) {
      return filterOptions(candidate, input);
    }

    return false;
  }, [filterOptions]);

  const customStyles = {
    option (base: any, { isSelected }: any) {
      const isDarkTheme = themeContext.id === 'dark';
      const color = isDarkTheme ? '#888888' : '#7B8098';
      const hoverBgc = isDarkTheme ? 'rgba(255, 255, 255, 0.05)' : 'rgba(17, 17, 17, 0.08)';
      const hoverColor = isDarkTheme ? '#FFFFFF' : '#00072D';

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return {
        ...base,
        textAlign: 'left',
        fontFamily: 'Lexend',
        fontSize: '15px',
        color: color,
        backgroundColor: isSelected ? hoverBgc : 'transparent',
        ':hover': {
          backgroundColor: hoverBgc,
          color: hoverColor
        },
        ':active': {
          backgroundColor: hoverBgc
        }
      };
    },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    noOptionsMessage: (base: any) => ({ ...base, textAlign: 'left', fontFamily: 'Lexend', fontSize: '15px' }),
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    menu: (base: any) => {
      const borderColor = themeContext.id === 'dark' ? '#212845' : '#EEEEEE';

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return {
        ...base,
        width: '240px',
        right: 0,
        marginTop: '0',
        borderTopLeftRadius: '0',
        borderTopRightRadius: '0',
        borderBottomLeftRadius: '8px',
        borderBottomRightRadius: '8px',
        border: `2px solid ${borderColor}`
      };
    },
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    menuList: (base: any) => {
      const backgroundColor = themeContext.id === 'dark' ? '#181E42' : '#FFFFFF';

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return {
        ...base,
        maxHeight: '200px',
        zIndex: 15,
        backgroundColor: `${backgroundColor}`
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
          filterOption={filterOptions && filterOption}
          formatOptionLabel={getFormatOptLabel && formatOptionLabel}
          isSearchable
          menuIsOpen
          menuPlacement={'auto'}
          menuPortalTarget={document.querySelector('body')}
          menuPosition='fixed'
          onChange={handleChange}
          options={transformOptions}
          placeholder='Search...'
          styles={customStyles}
          value={transformOptions.filter((obj: { value: string }) => obj.value === selectedValue)}
        />
      </Label>
    </>
  );
}

export default React.memo(styled(DropdownWrapper)(({ theme }: ThemeProps) => `
  font-weight: 500;
  color: ${theme.textColor2};
  position: relative;

  .dropdown-wrapper-item {
    height: 68px;
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
    right: 0;
    top: 100%;
    z-index: 100;
  }

  .token-dropdown-dropdown__indicators {
    display: none;
  }

  .token-dropdown-dropdown__control {
    align-items: center;
    background-color: ${theme.popupBackground};
    border: 2px solid ${theme.boxBorderColor};
    border-bottom: none;
    border-top-left-radius: 8px;
    border-top-right-radius: 8px;
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    cursor: default;
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    min-height: 48px;
    position: relative;
    min-width: 240px;
    box-shadow: none;
  }

  .token-dropdown-dropdown__control:hover {
    border: 2px solid ${theme.boxBorderColor};
    border-bottom: none;
    box-shadow: none;
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

  .token-dropdown-dropdown__single-value {
    display: none;
  }

`));
