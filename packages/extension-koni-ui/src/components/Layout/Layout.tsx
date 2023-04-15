// Copyright 2019-2022 @subwallet/extension-koni-ui authors & contributors
// SPDX-License-Identifier: Apache-2.0

import Base from './base/Base';
import { Home } from './base/Home';
import { WithSubHeaderOnly } from './base/WithSubHeaderOnly';
import { WithSideMenu } from './base/WithSideMenu';

type CompoundedComponent = {
  Home: typeof Home;
  Base: typeof Base;
  WithSubHeaderOnly: typeof WithSubHeaderOnly;
  WithSideMenu: typeof WithSideMenu;
};

const Layout: CompoundedComponent = {
  Home: Home,
  Base: Base,
  WithSubHeaderOnly: WithSubHeaderOnly,
  WithSideMenu: WithSideMenu,
};

export default Layout;
