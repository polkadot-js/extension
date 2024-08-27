// Copyright 2019-2022 @polkadot/extension-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import type { AccountsContext, AuthorizeRequest, MetadataRequest, SigningRequest } from '@subwallet/extension-base/background/types';
import type { SettingsStruct } from '@polkadot/ui-settings/types';

import { ConfirmationsQueue } from '@subwallet/extension-base/background/KoniTypes';
import React from 'react';

import settings from '@polkadot/ui-settings';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const noop = (): void => undefined;

const AccountContext = React.createContext<AccountsContext>({ accounts: [], hierarchy: [], master: undefined });
const ActionContext = React.createContext<(to?: string) => void>(noop);
const MediaContext = React.createContext<boolean>(false);

const AuthorizeReqContext = React.createContext<AuthorizeRequest[]>([]);
const MetadataReqContext = React.createContext<MetadataRequest[]>([]);
const SigningReqContext = React.createContext<SigningRequest[]>([]);
const ConfirmationsQueueContext = React.createContext<ConfirmationsQueue>({
  addNetworkRequest: {},
  addTokenRequest: {},
  evmSignatureRequest: {},
  evmSendTransactionRequest: {},
  evmWatchTransactionRequest: {},
  errorConnectNetwork: {}
});

const SettingsContext = React.createContext<SettingsStruct>(settings.get());

const ToastContext = React.createContext<({show: (message: string, isError?: boolean) => void})>({ show: noop });
// eslint-disable-next-line func-call-spacing
const WaitAtHomeContext = React.createContext<{ wait: boolean, setWait: (val: boolean) => void }>({ setWait: noop, wait: false });

export {
  AccountContext,
  ActionContext,
  AuthorizeReqContext,
  MediaContext,
  MetadataReqContext,
  SettingsContext,
  SigningReqContext,
  ConfirmationsQueueContext,
  ToastContext,
  WaitAtHomeContext
};
