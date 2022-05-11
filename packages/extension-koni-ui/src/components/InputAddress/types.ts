// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { KeyringOption$Type, KeyringSectionOption } from '@polkadot/ui-keyring/options/types';

import React from 'react';

export interface AccountOption extends KeyringSectionOption {
  text: string;
}

export interface DropdownOption {
  label: string;
  value: string;
}

export interface Option extends KeyringSectionOption {
  className?: string;
}

export interface InputAddressProps {
  className?: string;
  defaultValue?: Uint8Array | string | null;
  help?: React.ReactNode;
  hideAddress?: boolean;
  isDisabled?: boolean;
  isError?: boolean;
  isInput?: boolean;
  isMultiple?: boolean;
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
