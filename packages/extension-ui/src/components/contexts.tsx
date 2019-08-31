// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AccountsFromCtx, OnActionFromCtx, AuthRequestsFromCtx, SignRequestsFromCtx, SubtractProps } from './types';

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

export function withAccounts<P extends { accounts: AccountsFromCtx }> (Component: React.ComponentType<P>): React.ComponentType<SubtractProps<P, { accounts: AccountsFromCtx }>> {
  // eslint-disable-next-line react/display-name,@typescript-eslint/explicit-function-return-type
  return (props: SubtractProps<P, { accounts: AccountsFromCtx }>) => {
    return (
      <AccountContext.Consumer>
        {(accounts): React.ReactNode => (
          <Component
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...props as any}
            accounts={accounts}
          />
        )}
      </AccountContext.Consumer>
    );
  };
}

export function withOnAction<P extends { onAction: OnActionFromCtx }> (Component: React.ComponentType<P>): React.ComponentType<SubtractProps<P, { onAction: OnActionFromCtx }>> {
  // eslint-disable-next-line react/display-name,@typescript-eslint/explicit-function-return-type
  return (props: SubtractProps<P, { onAction: OnActionFromCtx }>) => {
    return (
      <ActionContext.Consumer>
        {(onAction): React.ReactNode => (
          <Component
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...props as any}
            onAction={onAction}
          />
        )}
      </ActionContext.Consumer>
    );
  };
}

export function withAuthRequests<P extends { requests: AuthRequestsFromCtx }> (Component: React.ComponentType<P>): React.ComponentType<SubtractProps<P, { requests: AuthRequestsFromCtx }>> {
  // eslint-disable-next-line react/display-name,@typescript-eslint/explicit-function-return-type
  return (props: SubtractProps<P, { requests: AuthRequestsFromCtx }>) => {
    return (
      <AuthorizeContext.Consumer>
        {(requests): React.ReactNode => (
          <Component
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...props as any}
            requests={requests}
          />
        )}
      </AuthorizeContext.Consumer>
    );
  };
}

export function withSignRequests<P extends { requests: SignRequestsFromCtx }> (Component: React.ComponentType<P>): React.ComponentType<SubtractProps<P, { requests: SignRequestsFromCtx }>> {
  // eslint-disable-next-line react/display-name,@typescript-eslint/explicit-function-return-type
  return (props: SubtractProps<P, { requests: SignRequestsFromCtx }>) => {
    return (
      <SigningContext.Consumer>
        {(requests): React.ReactNode => (
          <Component
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            {...props as any}
            requests={requests}
          />
        )}
      </SigningContext.Consumer>
    );
  };
}
