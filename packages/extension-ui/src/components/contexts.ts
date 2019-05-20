// Copyright 2019 @polkadot/extension-ui authors & contributors
// This software may be modified and distributed under the terms
// of the Apache-2.0 license. See the LICENSE file for details.

import { MessageExtrinsicSign } from '@polkadot/extension/background/types';
import { KeyringJson } from '@polkadot/ui-keyring/types';

import React from 'react';

const noop = (to?: string) => {
  // do nothing
};

const AccountContext = React.createContext([] as Array<KeyringJson>);
const ActionContext = React.createContext(noop);
const SigningContext = React.createContext([] as Array<[number, MessageExtrinsicSign, string]>);

export {
  AccountContext,
  ActionContext,
  SigningContext
};
