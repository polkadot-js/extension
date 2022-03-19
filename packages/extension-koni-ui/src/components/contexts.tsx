// Copyright 2019-2022 @polkadot/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountsContext, AuthorizeRequest, MetadataRequest, SigningRequest } from '@polkadot/extension-base/background/types';
import type { SettingsStruct } from '@polkadot/ui-settings/types';
import type { AvailableThemes } from './themes';

import React from 'react';

import settings from '@polkadot/ui-settings';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const noop = (): void => undefined;

const AccountContext = React.createContext<AccountsContext>({ accounts: [], hierarchy: [], master: undefined });
const ActionContext = React.createContext<(to?: string) => void>(noop);
const AuthorizeReqContext = React.createContext<AuthorizeRequest[]>([]);
const MediaContext = React.createContext<boolean>(false);
const MetadataReqContext = React.createContext<MetadataRequest[]>([]);
const SettingsContext = React.createContext<SettingsStruct>(settings.get());
const SigningReqContext = React.createContext<SigningRequest[]>([]);
const ThemeSwitchContext = React.createContext<(theme: AvailableThemes) => void>(noop);
const ToastContext = React.createContext<({show: (message: string) => void, setToastError: (isError: boolean) => void})>({ show: noop, setToastError: noop });

export {
  AccountContext,
  ActionContext,
  AuthorizeReqContext,
  MediaContext,
  MetadataReqContext,
  SettingsContext,
  SigningReqContext,
  ThemeSwitchContext,
  ToastContext
};
