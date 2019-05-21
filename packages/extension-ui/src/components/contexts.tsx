// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { AccountsFromCtx, OnActionFromCtx, RequestsFromCtx, SubtractProps } from './types';

import React from 'react';

const noop = (to?: string) => {
  // do nothing
};

const AccountContext = React.createContext([] as AccountsFromCtx);
const ActionContext = React.createContext(noop as OnActionFromCtx);
const SigningContext = React.createContext([] as RequestsFromCtx);

export {
  AccountContext,
  ActionContext,
  SigningContext
};

export function withAccounts<P extends { accounts: AccountsFromCtx }> (Component: React.ComponentType<P>): React.ComponentType<SubtractProps<P, { accounts: AccountsFromCtx }>> {
  return (props: SubtractProps<P, { accounts: AccountsFromCtx }>) => {
    return (
      <AccountContext.Consumer>
        {(accounts) => (
          // @ts-ignore Something here with the props are going wonky
          <Component
            {...props}
            accounts={accounts}
          />
        )}
      </AccountContext.Consumer>
    );
  };
}

export function withAction<P extends { onAction: OnActionFromCtx }> (Component: React.ComponentType<P>): React.ComponentType<SubtractProps<P, { onAction: OnActionFromCtx }>> {
  return (props: SubtractProps<P, { onAction: OnActionFromCtx }>) => {
    return (
      <ActionContext.Consumer>
        {(onAction) => (
          // @ts-ignore Something here with the props are going wonky
          <Component
            {...props}
            onAction={onAction}
          />
        )}
      </ActionContext.Consumer>
    );
  };
}

export function withRequests<P extends { requests: RequestsFromCtx }> (Component: React.ComponentType<P>): React.ComponentType<SubtractProps<P, { requests: RequestsFromCtx }>> {
  return (props: SubtractProps<P, { requests: RequestsFromCtx }>) => {
    return (
      <SigningContext.Consumer>
        {(requests) => (
          // @ts-ignore Something here with the props are going wonky
          <Component
            {...props}
            requests={requests}
          />
        )}
      </SigningContext.Consumer>
    );
  };
}
