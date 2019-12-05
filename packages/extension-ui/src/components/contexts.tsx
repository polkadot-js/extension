// Copyright 2019-2020 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AccountJson, AuthorizeRequest, SigningRequest } from '@polkadot/extension/background/types';

import React from 'react';
import { AvailableThemes } from '.';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const noop = (): void => undefined;

const AccountContext = React.createContext<AccountJson[]>([]);
const ActionContext = React.createContext<(to?: string) => void>(noop);
const AuthorizeContext = React.createContext<AuthorizeRequest[]>([]);
const MediaContext = React.createContext<boolean>(false);
const SigningContext = React.createContext<SigningRequest[]>([]);
const ThemeSwitchContext = React.createContext<(theme: AvailableThemes) => void>(noop);
const ToastContext = React.createContext<({show: (message: string) => void})>({ show: noop });

export {
  AccountContext,
  ActionContext,
  AuthorizeContext,
  MediaContext,
  SigningContext,
  ThemeSwitchContext,
  ToastContext
};
