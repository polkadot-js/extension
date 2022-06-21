// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountsContext, AuthorizeRequest, MetadataRequest, SigningRequest } from '@subwallet/extension-base/background/types';
import type { SettingsStruct } from '@polkadot/ui-settings/types';
import type { AvailableThemes } from '../components/themes';

import { ConfirmationsQueue } from '@subwallet/extension-base/background/KoniTypes';
import { createFindAccountHandler } from '@subwallet/extension-koni-ui/util/findAccount';
import React from 'react';

import settings from '@polkadot/ui-settings';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const noop = (): void => undefined;

const AccountContext = React.createContext<AccountsContext>({ accounts: [], hierarchy: [], master: undefined, getAccountByAddress: createFindAccountHandler([]) });
const ActionContext = React.createContext<(to?: string) => void>(noop);
const AuthorizeReqContext = React.createContext<AuthorizeRequest[]>([]);
const MediaContext = React.createContext<boolean>(false);
const MetadataReqContext = React.createContext<MetadataRequest[]>([]);
const SettingsContext = React.createContext<SettingsStruct>(settings.get());
const SigningReqContext = React.createContext<SigningRequest[]>([]);
const ConfirmationsQueueContext = React.createContext<ConfirmationsQueue>({
  addNetworkRequest: {},
  switchNetworkRequest: {},
  evmSignatureRequest: {},
  evmSendTransactionRequest: {}
});
const ThemeSwitchContext = React.createContext<(theme: AvailableThemes) => void>(noop);
const ToastContext = React.createContext<({show: (message: string, isError?: boolean) => void})>({ show: noop });

export {
  AccountContext,
  ActionContext,
  AuthorizeReqContext,
  MediaContext,
  MetadataReqContext,
  SettingsContext,
  SigningReqContext,
  ConfirmationsQueueContext,
  ThemeSwitchContext,
  ToastContext
};
