// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

export interface BasicInputEvent<T = string> {
  target: {
    value: T
  }
}

export type BasicOnChangeFunction<T = string> = (event: BasicInputEvent) => void;

export interface BasicInputWrapper<T = string> {
  id?: string,
  label?: string,
  placeholder?: string
  value?: T,
  disabled?: boolean,
  onChange?: BasicOnChangeFunction<T>
}
