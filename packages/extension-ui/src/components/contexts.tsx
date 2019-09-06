// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AccountJson, AuthorizeRequest, SigningRequest } from '@polkadot/extension/background/types';

import React from 'react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const noop = (to?: string): void => {};

const AccountContext = React.createContext<AccountJson[]>([]);
const ActionContext = React.createContext<(to?: string) => void>(noop);
const AuthorizeContext = React.createContext<AuthorizeRequest[]>([]);
const SigningContext = React.createContext<SigningRequest[]>([]);

export {
  AccountContext,
  ActionContext,
  AuthorizeContext,
  SigningContext
};
