// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

// eslint-disable-next-line header/header
import type { KeyringOption$Type, KeyringSectionOption } from '@polkadot/ui-keyring/options/types';
import type { DonateTransformOptionType, Option } from './types';

import { DropdownTransformGroupOptionType, DropdownTransformOptionType, OptionInputAddress } from '@subwallet/extension-base/background/KoniTypes';
import DONATEINFOS from '@subwallet/extension-koni-base/api/donate';
import DonateReceiveItem from '@subwallet/extension-koni-ui/components/DonateInputAddress/DonateReceiveItem';
import Dropdown from '@subwallet/extension-koni-ui/components/InputAddress/Dropdown';
import { cancelSubscription, saveRecentAccountId, subscribeAccountsInputAddress } from '@subwallet/extension-koni-ui/messaging';
import createItem from '@subwallet/extension-koni-ui/Popup/Sending/old/component/InputAddress/createItem';
import LabelHelp from '@subwallet/extension-koni-ui/Popup/Sending/old/component/LabelHelp';
import { ThemeProps } from '@subwallet/extension-koni-ui/types';
import { toAddress } from '@subwallet/extension-koni-ui/util';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import store from 'store';
import styled from 'styled-components';

import { keyring } from '@polkadot/ui-keyring';
import { createOptionItem } from '@polkadot/ui-keyring/options/item';

interface Props {
  className?: string;
  defaultValue?: string;
  filter?: string[] | null;
  help?: React.ReactNode;
  hideAddress?: boolean;
  isDisabled?: boolean;
  isError?: boolean;
  isInput?: boolean;
  autoPrefill?: boolean;
  label?: React.ReactNode;
  onChange?: (value: string | null) => void;
  options?: KeyringSectionOption[];
  optionsAll?: Record<string, Option[]>;
  placeholder?: string;
  networkPrefix?: number;
  type?: KeyringOption$Type;
  withEllipsis?: boolean;
  value: string;
  isSetDefaultValue?: boolean;
  setInputAddressValue?: (value: string) => void;
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

function getTransformOptions (options: Option[]): DropdownTransformOptionType[] {
  return options.map((t) => ({ label: t.name, value: t.value || '' }));
}

function transformGrOptions (options: Option[]) {
  const transformGrOptions: DropdownTransformGroupOptionType[] = [];
  const transformOptions = getTransformOptions(options);
  let index = 0;

  for (let i = 0; i < transformOptions.length; i++) {
    if (!transformOptions[i].value) {
      transformGrOptions.push({ label: transformOptions[i].label, options: [] });
      index++;
    } else {
      transformGrOptions[index - 1].options.push(transformOptions[i]);
    }
  }

  return transformGrOptions;
}

// eslint-disable-next-line no-empty-pattern
function DonateInputAddress ({ className = '', defaultValue, filter, help, isDisabled, isSetDefaultValue, label, networkPrefix, onChange, optionsAll, type = DEFAULT_TYPE, withEllipsis }: Props): React.ReactElement {
  const [lastValue, setInputAddressLastValue] = useState('');
  const inputAddressRef = useRef(null);
  const [projectLink, setProjectLink] = useState<string | undefined>('');
  const [options, setOptions] = useState<DonateTransformOptionType[]>([]);
  const deps = options.toString();

  useEffect(() => {
    let isSync = true;
    let subscriptionId = '';

    subscribeAccountsInputAddress((data: OptionInputAddress) => {
      if (isSync) {
        const { options } = data;

        const donateOptions = Object.values(DONATEINFOS);
        const accountList = [];

        accountList.push(options.account[0]);
        const allPlusAccountList: DonateTransformOptionType[] = accountList.concat(donateOptions).concat(options.address);

        setOptions(allPlusAccountList);
      }
    })
      .then((id) => {
        if (isSync) {
          subscriptionId = id;
        } else {
          cancelSubscription(id).catch((e) => console.log('Error when cancel subscription', e));
        }
      })
      .catch(console.error);

    return () => {
      isSync = false;

      if (subscriptionId) {
        cancelSubscription(subscriptionId).catch((e) => console.log('Error when cancel subscription', e));
      }
    };
  }, []);

  useEffect(() => {
    setInputAddressLastValue(getLastValue(type));
  }, [lastValue, type]);

  const getFiltered = (): Option[] => {
    return !optionsAll
      ? []
      : optionsAll[type].filter(({ value }) => !filter || (!!value && filter.includes(value)));
  };

  function hasValue (test?: Uint8Array | string | null): boolean {
    return getFiltered().some(({ value }) => test === value);
  }

  const getLastOptionValue = (): KeyringSectionOption | undefined => {
    const available = getFiltered();

    return available.length
      ? available[available.length - 1]
      : undefined;
  };

  const lastOption = getLastOptionValue();

  const actualValue = transformToAddress(
    isDisabled || (defaultValue && hasValue(defaultValue))
      ? defaultValue
      : lastValue || (lastOption && lastOption.value)
  );

  const actualOptions: KeyringSectionOption[] = options
    ? dedupe(options)
    : isDisabled && actualValue
      ? [createOption(actualValue)]
      : getFiltered();

  const onChangeData = useCallback((address: string): void => {
    !filter && setLastValue(type, address);
    setInputAddressLastValue(getLastValue(type));
    const selectedOption = options.find((item) => item.value === address);

    setProjectLink(selectedOption?.link);
    onChange && onChange(
      address
        ? transformToAccountId(address)
        : null
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deps, filter, onChange, type]);

  const loadOptions = useCallback((input: string, callback: (options: DropdownTransformGroupOptionType[]) => void) => {
    if (input) {
      const query = input.trim();
      const queryLower = query.toLowerCase();
      const matches = options.filter((item) => !item.value || (item.value && (item.name.toLowerCase().includes(queryLower) || item.value.toLowerCase().includes(queryLower))));
      const matchesWithoutHeader = matches.filter((match) => match.value !== null);

      if (!matchesWithoutHeader.length) {
        const accountId = transformToAccountId(query);

        if (accountId) {
          saveRecentAccountId(accountId.toString()).then((res) => {
            matches.push({
              key: res.option.key,
              value: res.option.value,
              name: res.option.name
            });
            // eslint-disable-next-line node/no-callback-literal
            callback(transformGrOptions(matches));
          }).catch(console.error);
        } else {
          callback(transformGrOptions(matchesWithoutHeader));
        }
      } else {
        callback(transformGrOptions(matches));
      }
    } else {
      transformGrOptions(options);
    }
  }, [options]);

  const formatOptionLabel = useCallback((label: string, value: string) => {
    const selectedOption = options.find((item) => item.value === value);

    return (
      <DonateReceiveItem
        address={value}
        iconName={selectedOption?.icon}
        name={selectedOption?.name || label}
        networkPrefix={networkPrefix}
      />
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deps, networkPrefix]);

  return (
    <div className={className}>
      <Dropdown
        className={`input-address__dropdown ${isDisabled ? 'is-disabled' : ''}`}
        defaultOptions={transformGrOptions(options)}
        defaultValue={defaultValue}
        getFormatOptLabel={formatOptionLabel}
        isDisabled={isDisabled}
        isSetDefaultValue={isSetDefaultValue}
        loadOptions={loadOptions}
        onChange={onChangeData}
        options={actualOptions}
        reference={inputAddressRef}
      />
      <label>{withEllipsis
        ? <div className='input-address__dropdown-label'>{label}</div>
        : label
      }{help &&
      <LabelHelp
        className='input-address__dropdown-label-help'
        help={help}
      />}</label>
      {projectLink && (
        <a
          className='input-receive-project-link'
          href={projectLink}
          rel='noreferrer'
          target='_blank'
        >
          <span>{projectLink}</span>
        </a>
      )
      }
    </div>
  );
}

export default React.memo(styled(DonateInputAddress)(({ theme }: ThemeProps) => `
  position: relative;

  > label {
    position: absolute;
  }

  > label {
    flex: 1;
    font-size: 14px;
    color: ${theme.textColor2};
    display: flex;
    align-items: center;
    overflow: hidden;
    margin-right: 10px;
    top: 8px;
    left: 60px;
  }

  .input-address__dropdown {
    border: 2px solid ${theme.boxBorderColor};
    border-radius: 8px;
    height: 72px;
  }

  .input-address__dropdown.is-disabled {
    border-style: dashed;
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
    font-size: 16px;
    line-height: 26px;
    color: ${theme.textColor};
    font-weight: 500;
    padding-left: 50px;
    padding-top: 24px;
  }

  .key-pair__icon {
    position: absolute;
    width: 42px;
    height: 42px;
    background: ${theme.backgroundAccountAddress};
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
    font-weight: 400;
    padding-top: 24px;
  }

  &.isDisabled {
    border-style: dashed;
  }

  .input-address__dropdown-label-help {
    z-index: 1;
  }

  .dropdown__option .input-address__address-list-label {
    pointer-events: none;
  }

  .input-receive-project-link {
    background-color: ${theme.backgroundAccountAddress};
    height: 48px;
    border-radius: 8px;
    padding: 8px 12px;
    display: flex;
    align-items: center;
    font-size: 15px;
    line-height: 26px;
    color: ${theme.textColor2};
    margin-bottom: 10px;
    margin-top: 10px;

    > span {
      text-overflow: ellipsis;
      white-space: nowrap;
      overflow: hidden;
    }
  }
  `));
