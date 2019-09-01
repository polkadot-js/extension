// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AccountsFromCtx, OnActionFromCtx, AuthRequestsFromCtx, SignRequestsFromCtx } from './types';

import React from 'react';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const noop = (to?: string): void => {
  // do nothing
};

const AccountContext = React.createContext<AccountsFromCtx>([]);
const ActionContext = React.createContext<OnActionFromCtx>(noop);
const AuthorizeContext = React.createContext<AuthRequestsFromCtx>([]);
const SigningContext = React.createContext<SignRequestsFromCtx>([]);

export {
  AccountContext,
  ActionContext,
  AuthorizeContext,
  SigningContext
};
