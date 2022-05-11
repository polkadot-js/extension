// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeyringOption$Type, KeyringOptions, KeyringSectionOption, KeyringSectionOptions } from '@polkadot/ui-keyring/options/types';
import type { Option } from './types';

import React from 'react';
import store from 'store';
import styled from 'styled-components';

import { BackgroundWindow } from '@subwallet/extension-base/background/KoniTypes';
import { withMulti, withObservable } from '@subwallet/extension-koni-ui/Popup/Sending/old/api/hoc';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { createOptionItem } from '@polkadot/ui-keyring/options/item';
import { isNull, isUndefined } from '@polkadot/util';

import Dropdown from '../Dropdown';
import Static from '../Static';
import { toAddress } from '../util';
import createHeader from './createHeader';
import createItem from './createItem';

const bWindow = chrome.extension.getBackgroundPage() as BackgroundWindow;
const { keyring } = bWindow.pdotApi;

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
  isEtherium?: boolean;
}

type ExportedType = React.ComponentType<Props> & {
  createOption: (option: KeyringSectionOption, isUppercase?: boolean) => Option;
  setLastValue: (type: KeyringOption$Type, value: string) => void;
};

interface State {
  lastValue?: string;
  value?: string | string[];
}

const STORAGE_KEY = 'options:InputAddress';
const DEFAULT_TYPE = 'all';

function transformToAddress (value?: string | Uint8Array | null): string | null {
  try {
    return toAddress(value) || null;
  } catch (error) {
    // noop, handled by return
  }

  return null;
}

function transformToAccountId (value: string): string | null {
  if (!value) {
    return null;
  }

  const accountId = transformToAddress(value);

  return !accountId
    ? null
    : accountId;
}

function createOption (address: string): Option {
  let isRecent: boolean | undefined;
  const pair = keyring.getAccount(address);
  let name: string | undefined;

  if (pair) {
    name = pair.meta.name;
  } else {
    const addr = keyring.getAddress(address);

    if (addr) {
      name = addr.meta.name;
      isRecent = addr.meta.isRecent;
    } else {
      isRecent = true;
    }
  }

  return createItem(createOptionItem(address, name), !isRecent);
}

function readOptions (): Record<string, Record<string, string>> {
  return store.get(STORAGE_KEY) as Record<string, Record<string, string>> || { defaults: {} };
}

function getLastValue (type: KeyringOption$Type = DEFAULT_TYPE): string {
  const options = readOptions();

  return options.defaults[type];
}

function setLastValue (type: KeyringOption$Type = DEFAULT_TYPE, value: string): void {
  const options = readOptions();

  options.defaults[type] = value;
  store.set(STORAGE_KEY, options);
}

function dedupe (options: Option[]): Option[] {
  return options.reduce<Option[]>((all, o, index) => {
    const hasDupe = all.some(({ key }, eindex) =>
      eindex !== index &&
      key === o.key
    );

    if (!hasDupe) {
      all.push(o);
    }

    return all;
  }, []);
}

class InputAddress extends React.PureComponent<Props, State> {
  public override state: State = {};

  public static getDerivedStateFromProps ({ type, value }: Props, { lastValue }: State): Pick<State, never> | null {
    try {
      return {
        lastValue: lastValue || getLastValue(type),
        value: Array.isArray(value)
          ? value.map((v) => toAddress(v))
          : (toAddress(value) || undefined)
      };
    } catch (error) {
      return null;
    }
  }

  public override render (): React.ReactNode {
    const { className = '', defaultValue, help, hideAddress = false, isDisabled = false, isError, label, labelExtra, options, optionsAll, placeholder, type = DEFAULT_TYPE, withEllipsis, withLabel, autoPrefill = true } = this.props;

    const hasOptions = (options && options.length !== 0) || (optionsAll && Object.keys(optionsAll[type]).length !== 0);

    // the options could be delayed, don't render without
    if (!hasOptions && !isDisabled) {
      // This is nasty, but since this things is non-functional, there is not much
      // we can do (well, wrap it, however that approach is deprecated here)
      return (
        <Static
          className={className}
          help={help}
          label={label}
        >
          No accounts are available for selection.
        </Static>
      );
    }

    const { lastValue, value } = this.state;
    const lastOption = this.getLastOptionValue();
    const actualValue = transformToAddress(
      isDisabled || (defaultValue && this.hasValue(defaultValue))
        ? defaultValue
        : this.hasValue(lastValue)
          ? lastValue
          : (lastOption && lastOption.value)
    );

    const actualOptions: Option[] = options
      ? dedupe(options.map((o) => createItem(o)))
      : isDisabled && actualValue
        ? [createOption(actualValue)]
        : this.getFiltered();
    const _defaultValue = ((!autoPrefill && !isDisabled) || !isUndefined(value))
      ? undefined
      : actualValue;

    return (
      <Dropdown
        className={`ui--InputAddress${hideAddress ? ' hideAddress' : ''} ${className}`}
        defaultValue={_defaultValue}
        dropdownClassName='ui--AddressSearch'
        help={help}
        isDisabled={isDisabled}
        isError={isError}
        label={label}
        labelExtra={labelExtra}
        onChange={this.onChange}
        onSearch={this.onSearch}
        options={actualOptions}
        placeholder={placeholder}
        value={value}
        withEllipsis={withEllipsis}
        withLabel={withLabel}
      />
    );
  }

  private getLastOptionValue (): KeyringSectionOption | undefined {
    const available = this.getFiltered();

    return available.length
      ? available[available.length - 1]
      : undefined;
  }

  private hasValue (test?: Uint8Array | string | null): boolean {
    return this.getFiltered().some(({ value }) => test === value);
  }

  private getFiltered (): Option[] {
    const { filter, optionsAll, isEtherium, type = DEFAULT_TYPE } = this.props;

    let options: Option[] = [];

    if (optionsAll) {
      if (isEtherium) {
        options = optionsAll[type].filter((opt) => opt.key && (opt.key.includes('0x') || opt.key === 'header-accounts'));
      } else {
        options = optionsAll[type].filter((opt) => opt.key && (!opt.key.includes('0x') || opt.key === 'header-accounts'));
      }
    }

    return !optionsAll
      ? []
      : dedupe(options).filter(({ value }) => !filter || (!!value && filter.includes(value)));
  }

  private onChange = (address: string): void => {
    const { filter, onChange, type } = this.props;

    !filter && setLastValue(type, address);

    onChange && onChange(
      this.hasValue(address)
        ? transformToAccountId(address)
        : null
    );
  };

  private onSearch = (filteredOptions: KeyringSectionOptions, _query: string): KeyringSectionOptions => {
    const { isInput = true } = this.props;
    const query = _query.trim();
    const queryLower = query.toLowerCase();
    const matches = filteredOptions.filter((item): boolean =>
      !!item.value && (
        (item.name.toLowerCase && item.name.toLowerCase().includes(queryLower)) ||
        item.value.toLowerCase().includes(queryLower)
      )
    );

    if (isInput && matches.length === 0) {
      const accountId = transformToAccountId(query);

      if (accountId) {
        matches.push(
          keyring.saveRecent(
            accountId.toString()
          ).option
        );
      }
    }

    return matches.filter((item, index): boolean => {
      const isLast = index === matches.length - 1;
      const nextItem = matches[index + 1];
      const hasNext = nextItem && nextItem.value;

      return !(isNull(item.value) || isUndefined(item.value)) || (!isLast && !!hasNext);
    });
  };
}

const ExportedComponent = withMulti(
  styled(InputAddress)(({ theme }: ThemeProps) => `
  padding-top: 9px;
  padding-left: 60px;
  padding-right: 10px;
  display: flex;
  align-items: flex-start;
  background: ${theme.background};
  position: relative;
  border: 2px solid ${theme.borderColor2};
  height: 72px;
  z-index: 3;
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

  .labelExtra {

  }

  .ui--Labelled-content {
  }

  .ui--FormatBalance {
    font-weight: 400;
    font-size: 14px;
    color: ${theme.textColor};
  }

  .ui--FormatBalance-postfix {
    color: ${theme.textColor2};
  }

  .ui--AddressSearch {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
  }

  .ui--AddressSearch > input,
  .text > .ui--KeyPair {
    padding: 28px 10px 10px 60px;
  }

  .ui--AddressSearch > input {
    display: block;
    width: 100%;
    height: 100%;
    border: 0;
    outline: none;
    background: transparent;
    position: relative;
    z-index: 2;
    font-size: 18px;
    color: ${theme.textColor};
  }

  .ui--KeyPair-icon .icon {
    width: 100%;
    height: 100%;

    svg, img {
      width: 100%;
      height: 100%;
    }
  }

  .ui--AddressSearch > .text {
    position: absolute;
    top: 0;
    left: 0;
    bottom: 0;
    right: 0;
    z-index: 2;

    &.filtered {
      display: none;
    }

    &:before {
      content: '';
      height: 42px;
      width: 42px;
      display: block;
      position: absolute;
      z-index: -1;
      top: 10px;
      left: 10px;
      border-radius: 100%;
      background: ${theme.backgroundAccountAddress};
    }
  }

  .ui--KeyPair {
    .name {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      padding-right: 16px;
    }
  }

  .text > .ui--KeyPair {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    border-radius: 8px;
    background-color: transparent;

    .ui--KeyPair-icon {
      position: absolute;
      width: 42px;
      height: 42px;
      left: 10px;
      top: 10px;
    }

    .name, .address {
      cursor: text;
    }

    .name {
      flex: 1;
      font-size: 16px;
      color: ${theme.textColor};
      font-weight: 500;
    }

    .address {
      font-size: 14px;
      line-height: 24px;
      color: ${theme.textColor2};
      font-weight: 400
    }
  }

  .ui--AddressSearch.visible {
    z-index: 3;

    > .text {
      opacity: 0.5;
    }
  }

  .ui--AddressSearch .menu {
    display: none;
    user-select: none;
    top: 100%;
    position: absolute;
    right: 0;
    overflow-x: hidden;
    overflow-y: auto;
    -webkit-backface-visibility: hidden;
    backface-visibility: hidden;
    -webkit-overflow-scrolling: touch;
    outline: 0;
    margin: 0 -2px;
    min-width: calc(100% + 4px);
    width: calc(100% + 2px);
    //box-shadow: 0 2px 3px 0 rgb(34 36 38 / 15%);
    box-shadow: ${theme.boxShadow2};
    -webkit-transition: opacity .1s ease;
    transition: opacity .1s ease;
    background: ${theme.background};
    font-size: 15px;
    border-radius: 8px;
  }

  .ui--AddressSearch .menu.visible {
    display: block;
  }

  .ui--AddressSearch .menu .header {
    padding: 8px 16px;
    text-transform: uppercase;
    color: ${theme.textColor};
    font-weight: 500;
    background-color: ${theme.background};
  }

  .ui--AddressSearch .menu .message {
      padding: 8px 16px;
  }

  .ui--AddressSearch .menu .item {
    padding: 8px 16px;
    border-radius: 4px;
    cursor: pointer;
  }

  .ui--AddressSearch .menu .item.selected {
    background: ${theme.backgroundAccountAddress};
    color: ${theme.textColor};
    font-weight: 500;
  }

  .ui--AddressSearch .menu .item:hover {
    .ui--KeyPair .name {
      color: ${theme.textColor};
    }
  }

  .ui--AddressSearch .menu .ui--KeyPair {
    display: flex;
    align-items: center;
    color: ${theme.textColor2};

    .ui--KeyPair-icon {
      min-width: 24px;
      width: 24px;
      height: 24px;
      margin-right: 16px;
    }

    .name {
      flex: 1;
    }
  }

  .ui--AddressSearch .menu .item.selected {
    .ui--KeyPair .name {
      color: ${theme.textColor2};
      font-weight: 500;
    }
  }

  &.isDisabled {
    border-style: dashed;
  }

    @media only screen and (min-width: 768px) {
      .ui--AddressSearch .menu {
        max-height: 150px;
      }
    }

    @media only screen and (min-width: 992px) {
      .ui--AddressSearch .menu {
        max-height: 225px;
      }
    }

    @media only screen and (min-width: 1920px) {
      .ui--AddressSearch .menu {
        max-height: 300px;
      }
    }


    @media (max-width: 767px) {
      .ui--AddressSearch .menu {
        max-height: 130px;
      }
    }
  }
  `),
  withObservable(keyring.keyringOption.optionsSubject, {
    propName: 'optionsAll',
    transform: (optionsAll: KeyringOptions): Record<string, (Option | React.ReactNode)[]> =>
      Object.entries(optionsAll).reduce((result: Record<string, (Option | React.ReactNode)[]>, [type, options]): Record<string, (Option | React.ReactNode)[]> => {
        result[type] = options.map((option): Option | React.ReactNode =>
          option.value === null
            ? createHeader(option)
            : createItem(option)
        );

        return result;
      }, {})
  })
) as ExportedType;

ExportedComponent.createOption = createItem;
ExportedComponent.setLastValue = setLastValue;

export default ExportedComponent;
