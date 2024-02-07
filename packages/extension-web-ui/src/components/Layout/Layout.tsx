// Copyright 2019-2022 @subwallet/extension-web-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Base from './base/Base';
import { Home } from './base/Home';
import { WithSubHeaderOnly } from './base/WithSubHeaderOnly';

export type CompoundedComponent = {
  Home: typeof Home;
  Base: typeof Base;
  WithSubHeaderOnly: typeof WithSubHeaderOnly;
};

const Layout: CompoundedComponent = {
  Home: Home,
  Base: Base,
  WithSubHeaderOnly: WithSubHeaderOnly
};

export default Layout;
