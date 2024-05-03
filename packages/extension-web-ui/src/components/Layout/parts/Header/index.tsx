// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Balance from './Balance';
import Controller from './Controller';
import Simple from './Simple';

export type CompoundedHeader = {
  Controller: typeof Controller;
  Balance: typeof Balance;
  Simple: typeof Simple;
};

const Headers: CompoundedHeader = {
  Controller: Controller,
  Balance: Balance,
  Simple: Simple
};

export default Headers;
