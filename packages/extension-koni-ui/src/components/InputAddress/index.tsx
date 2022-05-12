// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeyringOption$Type, KeyringSectionOption } from '@polkadot/ui-keyring/options/types';
import type { Option } from './types';

import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import React from 'react';
import styled from 'styled-components';
//
// import Dropdown from '../AdvanceDropdown';

interface Props {
  className?: string;
  defaultValue?: Uint8Array | string | null;
  filter?: string[] | null;
  help?: React.ReactNode;
  hideAddress?: boolean;
  isDisabled?: boolean;
  isError?: boolean;
  isInput?: boolean;
  autoPrefill?: boolean;
  label?: React.ReactNode;
  labelExtra?: React.ReactNode;
  onChange?: (value: string | null) => void;
  onChangeMulti?: (value: string[]) => void;
  options?: KeyringSectionOption[];
  optionsAll?: Record<string, Option[]>;
  placeholder?: string;
  type?: KeyringOption$Type;
  value?: string | Uint8Array | string[] | null;
  withEllipsis?: boolean;
  withLabel?: boolean;
}

// const STORAGE_KEY = 'options:InputAddress';
// const DEFAULT_TYPE = 'all';

// function transformToAddress (value?: string | Uint8Array | null): string | null {
//   try {
//     return toAddress(value) || null;
//   } catch (error) {
//     // noop, handled by return
//   }
//
//   return null;
// }

// function transformToAccountId (value: string): string | null {
//   if (!value) {
//     return null;
//   }
//
//   const accountId = transformToAddress(value);
//
//   return !accountId
//     ? null
//     : accountId;
// }

// function createOption (address: string): Option {
//   let isRecent: boolean | undefined;
//   const pair = keyring.getAccount(address);
//   let name: string | undefined;
//
//   if (pair) {
//     name = pair.meta.name;
//   } else {
//     const addr = keyring.getAddress(address);
//
//     if (addr) {
//       name = addr.meta.name;
//       isRecent = addr.meta.isRecent;
//     } else {
//       isRecent = true;
//     }
//   }
//
//   return createItem(createOptionItem(address, name), !isRecent);
// }

// function readOptions (): Record<string, Record<string, string>> {
//   return store.get(STORAGE_KEY) as Record<string, Record<string, string>> || { defaults: {} };
// }
//
// function getLastValue (type: KeyringOption$Type = DEFAULT_TYPE): string {
//   const options = readOptions();
//
//   return options.defaults[type];
// }

// function setLastValue (type: KeyringOption$Type = DEFAULT_TYPE, value: string): void {
//   const options = readOptions();
//
//   options.defaults[type] = value;
//   store.set(STORAGE_KEY, options);
// }

// eslint-disable-next-line no-empty-pattern
function InputAddress ({}: Props): React.ReactElement {
  // const [lastValue, setInputAddressLastValue] = useState('');
  // const [value, setInputAddressValue] = useState<string |(string | undefined)[] | undefined>('');

  // useEffect(() => {
  //   setInputAddressLastValue(getLastValue(type));
  //
  //   if (Array.isArray(value)) {
  //     const addressVal = value.map((v) => toAddress(v));
  //
  //     setInputAddressValue(addressVal);
  //   } else {
  //     setInputAddressValue(toAddress(value) || undefined);
  //   }
  // }, [lastValue, type, value]);

  // const actualOptions = [{
  //   label: 'ACCOUNTS',
  //   options: [
  //     { value: '5CoT5i2xrtg8ZfP9AGvCHnxFH8T6h7RyYM7n8VEaxTzu7hG8', label: '111' },
  //     { value: '5G3Wr5f4fDv913LLLXq6B9a2c4oJonhSVXcs69wX7CkSC67k', label: '123123' }
  //   ]
  // }];

  // const getFiltered = (): Option[] => {
  //   return !optionsAll
  //     ? []
  //     : optionsAll[type].filter(({ value }) => !filter || (!!value && filter.includes(value)));
  // };

  // const getLastOptionValue = (): KeyringSectionOption | undefined => {
  //   const available = getFiltered();
  //
  //   return available.length
  //     ? available[available.length - 1]
  //     : undefined;
  // };

  // const lastOption = getLastOptionValue();

  // const actualValue = transformToAddress(
  //   isDisabled || defaultValue
  //     ? defaultValue
  //     : lastValue || (lastOption && lastOption.value)
  // );

  // const _defaultValue = ((!autoPrefill && !isDisabled) || !isUndefined(value))
  //   ? undefined
  //   : actualValue;

  // const onChangeData = useCallback((address: string): void => {
  //   !filter && setLastValue(type, address);
  //   setInputAddressLastValue(getLastValue(type));
  //   setInputAddressValue(toAddress(address));
  //
  //   onChange && onChange(
  //     address
  //       ? transformToAccountId(address)
  //       : null
  //   );
  // }, [filter, onChange, type]);

  return (
    // <Dropdown
    //   className={`ui--InputAddress${hideAddress ? ' hideAddress' : ''} ${className}`}
    //   defaultValue={_defaultValue}
    //   help={help}
    //   isCustomOption={true}
    //   isDisabled={isDisabled}
    //   isError={isError}
    //   isSearchable={true}
    //   label={label}
    //   labelExtra={labelExtra}
    //   // onSearch={this.onSearch}
    //   onChange={onChangeData}
    //   optionsData={actualOptions}
    //   placeholder={placeholder || ''}
    //   value={value}
    //   withEllipsis={withEllipsis}
    //   withLabel={withLabel}
    // />
    <div />
  );
}

export default React.memo(styled(InputAddress)(({ theme }: ThemeProps) => `
  padding-top: 9px;
  padding-left: 60px;
  padding-right: 10px;
  display: flex;
  align-items: flex-start;
  background: ${theme.background};
  position: relative;
  border: 2px solid ${theme.boxBorderColor};
  height: 72px;
  border-radius: 8px;

  > label, .labelExtra {
    position: relative;
  }

  > label {
    flex: 1;
    font-size: 15px;
    font-weight: 500;
    color: ${theme.textColor2};
    display: flex;
    align-items: center;
    overflow: hidden;
    margin-right: 10px;
  }

  .format-balance {
    font-weight: 500;
    font-size: 15px;
    color: ${theme.textColor};
  }

  .format-balance__postfix {
    color: ${theme.textColor2};
  }

  .advance-dropdown-wrapper {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
  }

  .advance-dropdown-wrapper .advance-dropdown__value-container {
    padding: 28px 10px 10px 60px;
  }

  .advance-dropdown__input-container {
    cursor: text
  }

  .key-pair {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    border-radius: 8px;
    background-color: transparent;
  }

  .key-pair__name {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    padding-right: 16px;
    flex: 1;
    font-size: 18px;
    color: ${theme.textColor};
    font-weight: 500;
  }

  .key-pair__icon {
    position: absolute;
    width: 42px;
    height: 42px;
    left: 10px;
    top: 10px;
  }

  .key-pair__icon .icon {
    width: 100%;
    height: 100%;

    svg, img {
      width: 100%;
      height: 100%;
    }
  }

  .key-pair__address {
    color: ${theme.textColor2};
    font-weight: 400
  }

  &.isDisabled {
    border-style: dashed;
  }
  `));
