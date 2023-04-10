// Copyright 2019-2023 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountsContext, AuthorizeRequest, MetadataRequest, SigningRequest } from '@polkadot/extension-base/background/types';
import type { SettingsStruct } from '@polkadot/ui-settings/types';
import type { AvailableThemes } from './themes';

import React from 'react';

import settings from '@polkadot/ui-settings';

const noop = (): void => undefined;

export const AccountContext = /*#__PURE__*/ React.createContext<AccountsContext>({ accounts: [], hierarchy: [], master: undefined });

export const ActionContext = /*#__PURE__*/ React.createContext<(to?: string) => void>(noop);

export const AuthorizeReqContext = /*#__PURE__*/ React.createContext<AuthorizeRequest[]>([]);

export const MediaContext = /*#__PURE__*/ React.createContext<boolean>(false);

export const MetadataReqContext = /*#__PURE__*/ React.createContext<MetadataRequest[]>([]);

export const SettingsContext = /*#__PURE__*/ React.createContext<SettingsStruct>(settings.get());

export const SigningReqContext = /*#__PURE__*/ React.createContext<SigningRequest[]>([]);

export const ToastContext = /*#__PURE__*/ React.createContext<({show: (message: string) => void})>({ show: noop });

export const ThemeSwitchContext = /*#__PURE__*/ React.createContext<(theme: AvailableThemes) => void>(noop);
